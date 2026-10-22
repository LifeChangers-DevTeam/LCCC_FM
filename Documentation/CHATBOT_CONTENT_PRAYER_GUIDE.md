# LCCC Assistant, Content, and Prayer Operations Guide

**Project:** Life Changers Family Radio  
**Scope:** Chatbot knowledge, weekly content, images, and prayer-request workflow

## 1. Overview

The site now has three connected content systems:

1. `data/church-knowledge.json`
   This is the main approved ministry dataset for the church assistant.

2. `data/ministry-content.json`
   This powers the weekly content cards and gallery-style updates on the site.

3. `data/church-knowledge-index.json`
   This is the server-side retrieval index used by the Netlify assistant function. It is generated from the two files above.

4. `data/official-sources.json`
   This is the allowlist of approved external church sources the assistant may consult live.

5. `data/assistant-routing.json`
   This controls how the assistant adapts its answer strategy by intent.

The assistant has two modes:

- Client fallback mode
  Uses the local browser matcher in `js/church-assistant.js`

- Server RAG mode
  Uses `netlify/functions/church-assistant.mjs` plus OpenAI, the generated index, and approved live sources when appropriate

## 2. Assistant Architecture

### Browser layer

- `js/church-assistant.js`
  Opens the assistant UI, sends questions to `/api/church-assistant`, and falls back locally if the backend is unavailable.

### Server layer

- `netlify/functions/church-assistant.mjs`
  Handles question answering on the server
- `lib/knowledge-base.js`
  Builds searchable documents and ranks them
- `lib/live-sources.js`
  Pulls approved live documents from official church sources
- `lib/openai-api.js`
  Calls OpenAI embeddings and Responses APIs

### Generated data

- `data/church-knowledge-index.json`
  Contains retrieval documents and, when available, embeddings

### Approved live-source config

- `data/official-sources.json`
  Lists the exact external sources the assistant is allowed to use

### Adaptive routing config

- `data/assistant-routing.json`
  Tells the assistant when to favor curated knowledge and when to pull live official data

## 3. How to Add to the Chatbot Dataset

### Option A: Use the editor page

1. Open `knowledge-studio.html` in a browser.
2. Edit:
   - welcome message
   - fallback message
   - suggested questions
   - knowledge entries
3. For each entry, provide:
   - title
   - answer
   - keywords
   - related questions
   - synonyms
4. Click `Download Updated JSON`.
5. Replace `data/church-knowledge.json` with the downloaded file.

### Option B: Edit the JSON directly

Edit `data/church-knowledge.json`.

Recommended entry shape:

```json
{
  "title": "Prayer Requests and Counseling",
  "answer": "You can request prayer or Christian counseling by ...",
  "keywords": ["prayer", "counseling", "support"],
  "relatedQuestions": ["How can I request prayer?", "How do I contact the church?"],
  "synonyms": ["need prayer", "I need counseling"]
}
```

### Writing rules for strong answers

- Put one ministry topic per entry.
- Make titles explicit and searchable.
- Put the full approved answer in `answer`.
- Add real phrasing people will type in `keywords` and `synonyms`.
- Use `relatedQuestions` for follow-up prompts.
- Do not add facts that are not approved by the church.

## 4. Rebuild the Assistant Index

After changing `data/church-knowledge.json` or `data/ministry-content.json`, rebuild the index.

### Lexical-only index

```bash
npm run build:knowledge-index:lexical
```

This creates `data/church-knowledge-index.json` without embeddings.

### Embedding-enabled index

Set the required environment variable first:

```bash
export OPENAI_API_KEY=your_key_here
```

Optional:

```bash
export OPENAI_EMBEDDING_MODEL=text-embedding-3-small
export OPENAI_EMBEDDING_DIMENSIONS=1536
```

Then run:

```bash
npm run build:knowledge-index
```

This regenerates `data/church-knowledge-index.json` with embeddings for hybrid retrieval.

## 4A. Approved Live Sources

The assistant does not browse the internet freely.

It only pulls from the allowlisted sources in `data/official-sources.json`.

Current source types:

- `web-page`
- `youtube-feed`
- `facebook-feed`

### When live sources are used

The assistant will prefer live sources for questions like:

- latest broadcast
- recent updates
- bookstore and new releases
- contact details and official links
- social channels

It will still prefer curated church knowledge for:

- salvation
- baptism
- prayer
- deliverance teaching
- spiritual warfare teaching
- doctrinal and ministry identity questions

## 4B. Adaptive Answer Strategy

The assistant does not self-train from user chats in this deployment.

Instead, it adapts by:

1. detecting the question intent
2. ranking curated JSON documents
3. fetching approved live sources when the intent needs current information
4. applying source-trust and intent-based boosts
5. generating the final answer only from retrieved approved context

That behavior is configured in `data/assistant-routing.json`.

## 5. How to Upload New Content and Images

### Images

1. Put the new image files in `resources/`.
2. Use clear filenames with no special characters when possible.
3. Commit the image files together with the JSON update that references them.

### Weekly content cards

1. Open `content-studio.html`.
2. Add or edit the update.
3. Use the exact image path, for example:
   - `resources/WeeklyCharge.jpg`
4. Click `Download Updated JSON`.
5. Replace `data/ministry-content.json` with the downloaded file.
6. Rebuild the knowledge index if you want the assistant to answer from the new weekly content.

### Important note

The content studio updates the JSON only. It does not upload image files automatically. The image must already exist in `resources/` before deployment.

## 6. Prayer Request Flow

### Current flow

The form in `index.html` now submits to:

```text
/api/prayer-request
```

That endpoint is implemented in:

- `netlify/functions/prayer-request.js`

### What the backend does

1. Validates the request
2. Rejects spam honeypot submissions
3. Submits the request into Netlify Forms
4. Optionally forwards the request to a webhook for staff notifications

### User-facing fallbacks

The page still keeps:

- WhatsApp prayer team button
- Email prayer team button

These remain available for urgent follow-up.

## 7. Prayer Request Configuration

### Automatic Netlify variables

Netlify usually provides:

- `URL`
- `DEPLOY_PRIME_URL`

These help the function submit into Netlify Forms on the same site.

### Optional webhook

Set this in Netlify if the church wants instant staff notifications:

```bash
PRAYER_REQUEST_WEBHOOK_URL
```

Examples:

- Zapier webhook
- Make webhook
- Slack incoming automation endpoint
- Custom pastoral backend

## 8. OpenAI Configuration

The server-side assistant runs through Netlify AI Gateway, which injects `OPENAI_API_KEY` and `OPENAI_BASE_URL` at runtime — do not set your own `OPENAI_API_KEY` in Netlify, or the gateway credentials will not be used.

Optional overrides you can set in Netlify:

```bash
OPENAI_ASSISTANT_MODEL
OPENAI_ASSISTANT_REASONING_EFFORT
OPENAI_EMBEDDING_MODEL
OPENAI_EMBEDDING_DIMENSIONS
```

Recommended starting values:

```bash
OPENAI_ASSISTANT_MODEL=gpt-5-mini
OPENAI_ASSISTANT_REASONING_EFFORT=medium
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

## 9. Deployment Checklist

When changing chatbot knowledge:

1. Update `data/church-knowledge.json`
2. Rebuild `data/church-knowledge-index.json`
3. Commit both files
4. Deploy
5. Ask 3-5 real questions against the deployed assistant

When changing weekly content:

1. Add images to `resources/`
2. Update `data/ministry-content.json`
3. Rebuild `data/church-knowledge-index.json`
4. Commit images plus JSON files
5. Deploy

When changing prayer workflow:

1. Confirm Netlify env vars
2. Submit a test request
3. Verify Netlify Forms captured it
4. Verify webhook delivery if configured

## 10. Local Validation Commands

Syntax checks:

```bash
node --check js/church-assistant.js
node --check js/prayer-request.js
node --check js/knowledge-studio.js
node --check netlify/functions/church-assistant.mjs
node --check netlify/functions/prayer-request.js
```

Rebuild index:

```bash
npm run build:knowledge-index:lexical
```

## 11. Files Most Admins Will Touch

- `knowledge-studio.html`
- `content-studio.html`
- `data/church-knowledge.json`
- `data/ministry-content.json`
- `resources/`

## 12. Files Developers Will Touch

- `js/church-assistant.js`
- `js/prayer-request.js`
- `netlify/functions/church-assistant.mjs`
- `netlify/functions/prayer-request.js`
- `lib/knowledge-base.js`
- `lib/openai-api.js`
- `scripts/build-knowledge-index.js`
