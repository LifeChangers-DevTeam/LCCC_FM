// Netlify AI Gateway sets OPENAI_BASE_URL at runtime; fall back to the public API elsewhere.
const OPENAI_API_BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');

function buildHeaders(apiKey) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`
  };
}

async function readError(response) {
  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  const message = payload && payload.error && payload.error.message
    ? payload.error.message
    : `OpenAI request failed with status ${response.status}`;

  const error = new Error(message);
  error.statusCode = response.status;
  error.payload = payload;
  throw error;
}

async function createEmbeddings({ apiKey, model, inputs, dimensions }) {
  const response = await fetch(`${OPENAI_API_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    body: JSON.stringify({
      model,
      input: inputs,
      ...(dimensions ? { dimensions } : {})
    })
  });

  if (!response.ok) {
    await readError(response);
  }

  return response.json();
}

function extractOutputText(payload) {
  const output = Array.isArray(payload && payload.output) ? payload.output : [];

  for (const item of output) {
    if (item.type !== 'message' || !Array.isArray(item.content)) continue;

    for (const contentItem of item.content) {
      if (contentItem.type === 'output_text' && typeof contentItem.text === 'string') {
        return contentItem.text;
      }
    }
  }

  return '';
}

async function createStructuredResponse({
  apiKey,
  model,
  instructions,
  input,
  schema,
  reasoningEffort
}) {
  const payload = {
    model,
    instructions,
    input,
    text: {
      format: {
        type: 'json_schema',
        name: schema.name,
        strict: true,
        schema: schema.schema
      }
    }
  };

  if (reasoningEffort) {
    payload.reasoning = { effort: reasoningEffort };
  }

  const response = await fetch(`${OPENAI_API_BASE_URL}/responses`, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    await readError(response);
  }

  const json = await response.json();
  const outputText = extractOutputText(json);

  if (!outputText) {
    const error = new Error('OpenAI response did not include output text');
    error.payload = json;
    throw error;
  }

  return {
    raw: json,
    parsed: JSON.parse(outputText)
  };
}

module.exports = {
  createEmbeddings,
  createStructuredResponse,
  extractOutputText
};
