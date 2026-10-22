import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import knowledgeBase from '../../lib/knowledge-base.js';
import liveSources from '../../lib/live-sources.js';
import openaiApi from '../../lib/openai-api.js';

const {
  buildKnowledgeDocuments,
  collectSuggestions,
  ensureArray,
  rankDocuments,
  selectContextDocuments
} = knowledgeBase;
const {
  analyzeRoute,
  applyAdaptiveSourceBoost,
  fetchRelevantLiveDocuments
} = liveSources;
const {
  createEmbeddings,
  createStructuredResponse
} = openaiApi;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const knowledgePath = path.join(repoRoot, 'data', 'church-knowledge.json');
const ministryContentPath = path.join(repoRoot, 'data', 'ministry-content.json');
const knowledgeIndexPath = path.join(repoRoot, 'data', 'church-knowledge-index.json');
const routingPath = path.join(repoRoot, 'data', 'assistant-routing.json');
const officialSourcesPath = path.join(repoRoot, 'data', 'official-sources.json');

const CONTEXTUAL_REFERENCES = /^(and|also|it|that|those|there|them|this)\b/i;

const ANSWER_SCHEMA = {
  name: 'church_assistant_answer',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string' },
      answer: { type: 'string' }
    },
    required: ['title', 'answer']
  }
};

let cachedBundle = null;

function jsonResponse(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function loadKnowledgeBundle() {
  if (cachedBundle) {
    return cachedBundle;
  }

  const [knowledge, ministryContent] = await Promise.all([
    readJson(knowledgePath),
    readJson(ministryContentPath)
  ]);
  let routingConfig = { currentInfoTokens: [], intents: [] };
  let officialSources = { cacheTtlSeconds: 900, sources: [] };

  let index = null;

  try {
    index = await readJson(knowledgeIndexPath);
  } catch (error) {
    index = {
      hasEmbeddings: false,
      documents: buildKnowledgeDocuments(knowledge, ministryContent)
    };
  }

  if (!Array.isArray(index.documents) || index.documents.length === 0) {
    index.documents = buildKnowledgeDocuments(knowledge, ministryContent);
    index.hasEmbeddings = false;
  }

  try {
    routingConfig = await readJson(routingPath);
  } catch (error) {
    routingConfig = { currentInfoTokens: [], intents: [] };
  }

  try {
    officialSources = await readJson(officialSourcesPath);
  } catch (error) {
    officialSources = { cacheTtlSeconds: 900, sources: [] };
  }

  cachedBundle = {
    knowledge,
    index,
    routingConfig,
    officialSources
  };

  return cachedBundle;
}

async function parseBody(req) {
  try {
    const raw = await req.text();
    return JSON.parse(raw || '{}');
  } catch (error) {
    return null;
  }
}

function buildRetrievalQuestion(question, history) {
  const trimmedQuestion = String(question || '').trim();
  const turns = ensureArray(history)
    .filter((item) => item && typeof item.text === 'string' && typeof item.role === 'string');

  if (!turns.length) {
    return trimmedQuestion;
  }

  if (CONTEXTUAL_REFERENCES.test(trimmedQuestion) || trimmedQuestion.split(/\s+/).length <= 4) {
    const priorUserTurns = turns
      .filter((item) => item.role === 'user')
      .slice(-2)
      .map((item) => item.text.trim())
      .filter(Boolean);

    return `${priorUserTurns.join(' ')} ${trimmedQuestion}`.trim();
  }

  return trimmedQuestion;
}

function summarizeContent(text) {
  const blocks = String(text || '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!blocks.length) {
    return '';
  }

  if (blocks[0].length <= 240) {
    return blocks[0];
  }

  const sentences = blocks[0].split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, 2).join(' ').trim();
}

function buildDeterministicAnswer(selectedDocuments, knowledge) {
  if (!selectedDocuments.length) {
    return {
      title: 'Church Assistant',
      answer: knowledge.fallback || 'I do not have an answer for that yet.'
    };
  }

  if (selectedDocuments.length === 1) {
    return {
      title: selectedDocuments[0].title,
      answer: selectedDocuments[0].content
    };
  }

  const answer = selectedDocuments
    .map((document) => `${document.title}: ${summarizeContent(document.content)}`)
    .join('\n\n');

  return {
    title: 'Church Assistant',
    answer
  };
}

function buildPromptContext(selectedDocuments, fallback) {
  const context = selectedDocuments.map((document, index) => {
    const lines = [
      `[${index + 1}] ${document.title}`,
      `Source Type: ${document.sourceType}`,
      `Source: ${document.sourcePath}`,
      `Content: ${document.content}`
    ];

    if (document.keywords && document.keywords.length) {
      lines.push(`Keywords: ${document.keywords.join(', ')}`);
    }

    if (document.relatedQuestions && document.relatedQuestions.length) {
      lines.push(`Related Questions: ${document.relatedQuestions.join(' | ')}`);
    }

    if (document.fetchedAt) {
      lines.push(`Fetched At: ${document.fetchedAt}`);
    }

    return lines.join('\n');
  }).join('\n\n');

  return [
    'Approved ministry context:',
    context,
    '',
    `Fallback if context is insufficient: ${fallback}`
  ].join('\n');
}

async function answerWithOpenAI({ question, history, selectedDocuments, knowledge, apiKey }) {
  const model = process.env.OPENAI_ASSISTANT_MODEL || 'gpt-5-mini';
  const reasoningEffort = process.env.OPENAI_ASSISTANT_REASONING_EFFORT || 'medium';
  const fallback = knowledge.fallback || 'I do not have enough approved ministry knowledge to answer that.';
  const suggestions = collectSuggestions(selectedDocuments, knowledge.suggestedQuestions);

  const input = [
    {
      role: 'system',
      content: buildPromptContext(selectedDocuments, fallback)
    },
    ...ensureArray(history)
      .slice(-6)
      .filter((item) => item && typeof item.role === 'string' && typeof item.text === 'string')
      .map((item) => ({
        role: item.role === 'assistant' ? 'assistant' : 'user',
        content: item.text
      })),
    {
      role: 'user',
      content: question
    }
  ];

  const instructions = [
    'You are the Life Changing Christian Church assistant.',
    'Answer only from the approved ministry context provided in the conversation.',
    'Do not invent facts, dates, schedules, locations, contacts, books, or ministry claims that are not in context.',
    'If the context does not fully answer the question, say so clearly and use the fallback guidance.',
    'Be pastorally warm but concise.',
    'Prefer curated church knowledge for doctrine, prayer, deliverance, spiritual guidance, and ministry teaching.',
    'Prefer live official sources for recent announcements, contact details, social channels, bookstore updates, broadcasts, or latest media items when those sources are present in context.',
    'When appropriate, mention the official contact details, prayer support, broadcast options, or bookstore details that appear in context.',
    'Return plain text only in the answer field. Do not use markdown headings.'
  ].join(' ');

  const response = await createStructuredResponse({
    apiKey,
    model,
    instructions,
    input,
    schema: ANSWER_SCHEMA,
    reasoningEffort
  });

  return {
    title: response.parsed.title || 'Church Assistant',
    answer: response.parsed.answer || fallback,
    suggestions
  };
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return jsonResponse(200, { ok: true });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const payload = await parseBody(req);
  if (!payload) {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  const question = String(payload.question || '').trim();
  if (question.length < 3) {
    return jsonResponse(400, { error: 'Question is too short' });
  }

  // Injected at runtime by Netlify AI Gateway.
  const apiKey = process.env.OPENAI_API_KEY || '';

  try {
    const { knowledge, index, routingConfig, officialSources } = await loadKnowledgeBundle();
    const retrievalQuestion = buildRetrievalQuestion(question, payload.history);
    const shouldUseEmbeddings = Boolean(index.hasEmbeddings);
    const routeProfile = analyzeRoute(retrievalQuestion, routingConfig);

    let queryEmbedding = null;
    if (shouldUseEmbeddings) {
      const embeddingResponse = await createEmbeddings({
        apiKey,
        model: process.env.OPENAI_EMBEDDING_MODEL || index.embeddingModel || 'text-embedding-3-small',
        inputs: [retrievalQuestion]
      });
      queryEmbedding = embeddingResponse.data[0].embedding;
    }

    const localRankedDocuments = rankDocuments(retrievalQuestion, index.documents, queryEmbedding);
    const topLocalScore = localRankedDocuments[0] ? localRankedDocuments[0].combinedScore : 0;

    let liveDocuments = [];
    if (routeProfile.preferLiveSources || routeProfile.wantsCurrentInfo || topLocalScore < 8) {
      const liveResult = await fetchRelevantLiveDocuments(retrievalQuestion, routingConfig, officialSources);
      liveDocuments = liveResult.documents;
    }

    const liveRankedDocuments = rankDocuments(retrievalQuestion, liveDocuments, null);
    const rankedDocuments = [...localRankedDocuments, ...liveRankedDocuments]
      .map((document) => ({
        ...document,
        combinedScore: document.combinedScore + applyAdaptiveSourceBoost(document, routeProfile)
      }))
      .sort((left, right) => right.combinedScore - left.combinedScore);

    const selectedDocuments = selectContextDocuments(retrievalQuestion, rankedDocuments, 5);

    if (!selectedDocuments.length) {
      return jsonResponse(200, {
        mode: shouldUseEmbeddings ? 'hybrid' : 'lexical',
        usedEmbeddings: shouldUseEmbeddings,
        usedLiveSources: false,
        title: 'Church Assistant',
        answer: knowledge.fallback || 'I do not have an answer for that yet.',
        suggestions: collectSuggestions([], knowledge.suggestedQuestions),
        sources: []
      });
    }

    let answer;

    try {
      answer = await answerWithOpenAI({
        question,
        history: payload.history,
        selectedDocuments,
        knowledge,
        apiKey
      });
    } catch (error) {
      console.error('[church-assistant] OpenAI answer generation failed:', error.message);
      answer = {
        ...buildDeterministicAnswer(selectedDocuments, knowledge),
        suggestions: collectSuggestions(selectedDocuments, knowledge.suggestedQuestions)
      };
    }

    return jsonResponse(200, {
      mode: shouldUseEmbeddings ? 'hybrid' : 'lexical',
      usedEmbeddings: shouldUseEmbeddings,
      usedLiveSources: liveDocuments.length > 0,
      title: answer.title,
      answer: answer.answer,
      suggestions: answer.suggestions,
      sources: selectedDocuments.map((document) => ({
        id: document.id,
        title: document.title,
        sourceType: document.sourceType,
        sourcePath: document.sourcePath,
        fetchedAt: document.fetchedAt || null,
        score: Number(document.combinedScore.toFixed(3))
      }))
    });
  } catch (error) {
    console.error('[church-assistant] Failed:', error);
    return jsonResponse(500, {
      error: 'assistant_failed',
      message: error.message
    });
  }
};
