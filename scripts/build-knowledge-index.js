#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

const { buildKnowledgeDocuments } = require('../lib/knowledge-base');
const { createEmbeddings } = require('../lib/openai-api');

const repoRoot = path.resolve(__dirname, '..');
const knowledgePath = path.join(repoRoot, 'data', 'church-knowledge.json');
const ministryContentPath = path.join(repoRoot, 'data', 'ministry-content.json');
const outputPath = path.join(repoRoot, 'data', 'church-knowledge-index.json');

function getArguments() {
  const args = new Set(process.argv.slice(2));
  return {
    forceEmbeddings: args.has('--with-embeddings'),
    skipEmbeddings: args.has('--without-embeddings')
  };
}

async function readJson(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function embedDocuments(documents, { apiKey, model, dimensions }) {
  const batchSize = 20;
  const embeddedDocuments = documents.map((document) => ({ ...document }));

  for (let index = 0; index < embeddedDocuments.length; index += batchSize) {
    const batch = embeddedDocuments.slice(index, index + batchSize);
    const payload = batch.map((document) => document.searchableText);
    const response = await createEmbeddings({
      apiKey,
      model,
      inputs: payload,
      dimensions
    });

    response.data.forEach((item, batchIndex) => {
      batch[batchIndex].embedding = item.embedding;
    });

    console.log(`Embedded ${Math.min(index + batchSize, embeddedDocuments.length)} of ${embeddedDocuments.length} documents`);
  }

  return embeddedDocuments;
}

async function main() {
  const args = getArguments();
  const apiKey = process.env.OPENAI_API_KEY || '';
  const embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
  const embeddingDimensions = process.env.OPENAI_EMBEDDING_DIMENSIONS
    ? Number(process.env.OPENAI_EMBEDDING_DIMENSIONS)
    : undefined;

  if (Number.isNaN(embeddingDimensions)) {
    throw new Error('OPENAI_EMBEDDING_DIMENSIONS must be a number when set.');
  }

  const useEmbeddings = args.forceEmbeddings || (!args.skipEmbeddings && Boolean(apiKey));
  if (useEmbeddings && !apiKey) {
    throw new Error('OPENAI_API_KEY is required to build embeddings. Set it or pass --without-embeddings.');
  }

  const [knowledge, ministryContent] = await Promise.all([
    readJson(knowledgePath),
    readJson(ministryContentPath)
  ]);

  let documents = buildKnowledgeDocuments(knowledge, ministryContent);

  if (useEmbeddings) {
    documents = await embedDocuments(documents, {
      apiKey,
      model: embeddingModel,
      dimensions: embeddingDimensions
    });
  }

  const output = {
    generatedAt: new Date().toISOString(),
    sourceFiles: [
      'data/church-knowledge.json',
      'data/ministry-content.json'
    ],
    embeddingModel: useEmbeddings ? embeddingModel : null,
    embeddingDimensions: useEmbeddings ? embeddingDimensions || null : null,
    hasEmbeddings: useEmbeddings,
    documentCount: documents.length,
    documents
  };

  await writeJson(outputPath, output);

  console.log(`Saved knowledge index to ${path.relative(repoRoot, outputPath)}`);
  console.log(`Documents: ${documents.length}`);
  console.log(`Embeddings: ${useEmbeddings ? 'enabled' : 'disabled'}`);
}

main().catch((error) => {
  console.error('[build-knowledge-index] Failed:', error.message);
  process.exitCode = 1;
});
