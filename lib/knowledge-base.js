const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'at', 'be', 'by', 'can', 'do', 'does', 'for', 'from',
  'how', 'i', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'or', 'our', 'please',
  'the', 'to', 'we', 'what', 'when', 'where', 'which', 'who', 'why', 'with',
  'would', 'you', 'your'
]);

const SYNONYM_GROUPS = [
  ['address', 'directions', 'find', 'location', 'map', 'where'],
  ['audio', 'broadcast', 'fm', 'listen', 'radio', 'stream'],
  ['book', 'bookstore', 'manual', 'publication', 'resource', 'resources', 'store'],
  ['broadcast', 'latest', 'livestream', 'service', 'stream', 'video', 'watch', 'youtube'],
  ['contact', 'email', 'phone', 'reach', 'telephone', 'whatsapp'],
  ['counseling', 'counselling', 'guidance', 'help', 'support'],
  ['deliverance', 'freedom', 'healing', 'oppression', 'prayer'],
  ['giving', 'offering', 'partner', 'seed', 'support', 'tithe'],
  ['member', 'membership', 'join', 'new', 'visit', 'welcome'],
  ['prayer', 'pray', 'praying', 'request', 'supplication'],
  ['saved', 'salvation', 'born', 'again', 'jesus', 'christ'],
  ['schedule', 'service', 'time', 'times', 'program', 'event', 'meeting'],
  ['teaching', 'sermon', 'word', 'message', 'broadcast'],
  ['warfare', 'battle', 'fight', 'stronghold', 'deliverance']
];

const TOKEN_SYNONYMS = buildTokenSynonymMap(SYNONYM_GROUPS);

function ensureArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeToken(token) {
  let value = normalize(token);
  if (value.endsWith('ies') && value.length > 4) return `${value.slice(0, -3)}y`;
  if (value.endsWith('ing') && value.length > 5) return value.slice(0, -3);
  if (value.endsWith('ed') && value.length > 4) return value.slice(0, -2);
  if (value.endsWith('es') && value.length > 4) return value.slice(0, -2);
  if (value.endsWith('s') && value.length > 3) return value.slice(0, -1);
  return value;
}

function tokenize(text) {
  return normalize(text)
    .split(' ')
    .map(normalizeToken)
    .filter((token) => token && !STOP_WORDS.has(token));
}

function uniqueTokens(tokens) {
  return [...new Set(tokens.filter(Boolean))];
}

function buildBigrams(tokens) {
  const result = [];
  for (let index = 0; index < tokens.length - 1; index += 1) {
    result.push(`${tokens[index]} ${tokens[index + 1]}`);
  }
  return result;
}

function buildTokenSynonymMap(groups) {
  const map = new Map();

  groups.forEach((group) => {
    const tokens = uniqueTokens(group.flatMap((item) => tokenize(item)));
    tokens.forEach((token) => {
      map.set(token, tokens);
    });
  });

  return map;
}

function expandTokens(tokens) {
  const expanded = new Set(tokens);
  tokens.forEach((token) => {
    const related = TOKEN_SYNONYMS.get(token);
    if (related) {
      related.forEach((variant) => expanded.add(variant));
    }
  });
  return [...expanded];
}

function buildDocument({
  id,
  sourceType,
  title,
  content,
  keywords,
  relatedQuestions,
  synonyms,
  sourcePath,
  image
}) {
  const keywordList = ensureArray(keywords);
  const relatedList = ensureArray(relatedQuestions);
  const synonymList = ensureArray(synonyms);
  const searchableText = [
    title,
    content,
    keywordList.join(' '),
    relatedList.join(' '),
    synonymList.join(' '),
    image ? `image ${image}` : ''
  ].filter(Boolean).join('\n\n');

  const titleTokens = uniqueTokens(expandTokens(tokenize(title)));
  const keywordTokens = uniqueTokens(expandTokens(tokenize(keywordList.join(' '))));
  const relatedTokens = uniqueTokens(expandTokens(tokenize(relatedList.join(' '))));
  const synonymTokens = uniqueTokens(expandTokens(tokenize(synonymList.join(' '))));
  const contentTokens = uniqueTokens(expandTokens(tokenize(content)));
  const allTokens = uniqueTokens([
    ...titleTokens,
    ...keywordTokens,
    ...relatedTokens,
    ...synonymTokens,
    ...contentTokens
  ]);

  return {
    id,
    sourceType,
    title,
    content,
    keywords: keywordList,
    relatedQuestions: relatedList,
    synonyms: synonymList,
    sourcePath,
    image: image || null,
    searchableText,
    titleText: normalize(title),
    contentText: normalize(content),
    keywordText: normalize(keywordList.join(' ')),
    relatedText: normalize(relatedList.join(' ')),
    synonymText: normalize(synonymList.join(' ')),
    titleTokens,
    keywordTokens,
    relatedTokens,
    synonymTokens,
    contentTokens,
    allTokens,
    embedding: null
  };
}

function buildKnowledgeDocuments(knowledge, ministryContent) {
  const documents = [];
  const entries = ensureArray(knowledge && knowledge.entries);

  entries.forEach((entry, index) => {
    documents.push(buildDocument({
      id: `knowledge-entry-${index + 1}`,
      sourceType: 'knowledge-entry',
      title: String(entry.title || '').trim(),
      content: String(entry.answer || '').trim(),
      keywords: entry.keywords,
      relatedQuestions: entry.relatedQuestions,
      synonyms: entry.synonyms,
      sourcePath: 'data/church-knowledge.json'
    }));
  });

  const weeklyUpdates = ensureArray(ministryContent && ministryContent.weeklyUpdates);
  weeklyUpdates.forEach((item, index) => {
    documents.push(buildDocument({
      id: `weekly-update-${index + 1}`,
      sourceType: 'weekly-update',
      title: `Weekly Update: ${String(item.title || '').trim()}`,
      content: String(item.description || '').trim(),
      keywords: ['weekly update', 'announcement', 'notice', String(item.title || '').trim()],
      relatedQuestions: [
        'What are the latest weekly updates?',
        'What new ministry content is on the site?'
      ],
      sourcePath: 'data/ministry-content.json',
      image: String(item.image || '').trim()
    }));
  });

  return documents;
}

function levenshteinDistance(left, right) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const rows = new Array(right.length + 1);
  for (let column = 0; column <= right.length; column += 1) {
    rows[column] = column;
  }

  for (let row = 1; row <= left.length; row += 1) {
    let previous = row - 1;
    rows[0] = row;

    for (let column = 1; column <= right.length; column += 1) {
      const current = rows[column];
      const substitutionCost = left[row - 1] === right[column - 1] ? 0 : 1;
      rows[column] = Math.min(
        rows[column] + 1,
        rows[column - 1] + 1,
        previous + substitutionCost
      );
      previous = current;
    }
  }

  return rows[right.length];
}

function getTokenMatch(queryToken, candidateTokens) {
  let best = { score: 0, token: '' };

  for (const candidate of candidateTokens) {
    if (candidate === queryToken) {
      return { score: 1, token: candidate };
    }

    if ((candidate.startsWith(queryToken) || queryToken.startsWith(candidate)) && Math.min(candidate.length, queryToken.length) >= 4) {
      if (best.score < 0.88) {
        best = { score: 0.88, token: candidate };
      }
    }

    if (Math.abs(candidate.length - queryToken.length) > 2) continue;

    const distance = levenshteinDistance(candidate, queryToken);
    const maxDistance = candidate.length <= 5 ? 1 : 2;
    if (distance > maxDistance) continue;

    const score = distance === 1 ? 0.82 : 0.68;
    if (score > best.score) {
      best = { score, token: candidate };
    }
  }

  return best;
}

function scoreLexicalQuery(question, document) {
  const normalizedQuestion = normalize(question);
  const queryTokens = expandTokens(tokenize(question));
  const queryBigrams = buildBigrams(queryTokens);
  const matchedTokens = new Set();
  let score = 0;

  if (normalizedQuestion.length > 5) {
    if (document.titleText.includes(normalizedQuestion)) score += 18;
    if (document.keywordText.includes(normalizedQuestion)) score += 15;
    if (document.synonymText.includes(normalizedQuestion)) score += 12;
    if (document.contentText.includes(normalizedQuestion)) score += 8;
  }

  queryBigrams.forEach((bigram) => {
    if (document.titleText.includes(bigram)) score += 7;
    if (document.keywordText.includes(bigram)) score += 8;
    if (document.synonymText.includes(bigram)) score += 6;
    if (document.contentText.includes(bigram)) score += 3;
  });

  queryTokens.forEach((token) => {
    const titleMatch = getTokenMatch(token, document.titleTokens).score;
    const keywordMatch = getTokenMatch(token, document.keywordTokens).score;
    const synonymMatch = getTokenMatch(token, document.synonymTokens).score;
    const relatedMatch = getTokenMatch(token, document.relatedTokens).score;
    const contentMatch = getTokenMatch(token, document.contentTokens).score;

    const bestFieldScore = Math.max(
      titleMatch * 5.2,
      keywordMatch * 4.6,
      synonymMatch * 4.4,
      relatedMatch * 3.8,
      contentMatch * 2.2
    );

    if (bestFieldScore > 0) {
      score += bestFieldScore;
      matchedTokens.add(token);
    }
  });

  const coverage = queryTokens.length ? matchedTokens.size / queryTokens.length : 0;
  score += coverage * 10;

  if (coverage >= 0.75) score += 6;

  return {
    score,
    coverage,
    matchedTokens: [...matchedTokens]
  };
}

function cosineSimilarity(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length || left.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    dotProduct += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }

  if (!leftMagnitude || !rightMagnitude) {
    return 0;
  }

  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

function rankDocuments(question, documents, queryEmbedding) {
  return ensureArray(documents)
    .map((document) => {
      const lexical = scoreLexicalQuery(question, document);
      const semantic = Array.isArray(document.embedding) && Array.isArray(queryEmbedding)
        ? Math.max(0, cosineSimilarity(queryEmbedding, document.embedding))
        : 0;
      const semanticScore = semantic * 18;
      const combinedScore = lexical.score + semanticScore;

      return {
        ...document,
        lexicalScore: lexical.score,
        lexicalCoverage: lexical.coverage,
        semanticScore,
        semanticSimilarity: semantic,
        combinedScore
      };
    })
    .sort((left, right) => right.combinedScore - left.combinedScore);
}

function selectContextDocuments(question, rankedDocuments, limit = 5) {
  const top = ensureArray(rankedDocuments);
  if (!top.length) return [];

  const bestScore = top[0].combinedScore;
  const threshold = Math.max(4.5, bestScore * 0.42);
  const selected = [];

  for (const document of top) {
    if (document.combinedScore < threshold) break;
    selected.push(document);
    if (selected.length >= limit) break;
  }

  if (!selected.length && top[0].combinedScore >= 3) {
    return [top[0]];
  }

  return selected;
}

function dedupeStrings(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = normalize(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function collectSuggestions(selectedDocuments, fallbackSuggestions) {
  return dedupeStrings([
    ...ensureArray(selectedDocuments).flatMap((document) => document.relatedQuestions || []),
    ...ensureArray(fallbackSuggestions)
  ]).slice(0, 5);
}

module.exports = {
  buildDocument,
  buildKnowledgeDocuments,
  collectSuggestions,
  cosineSimilarity,
  ensureArray,
  normalize,
  rankDocuments,
  selectContextDocuments,
  tokenize
};
