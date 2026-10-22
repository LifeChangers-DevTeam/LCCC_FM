const fetch = require('node-fetch');

const {
  buildDocument,
  ensureArray,
  normalize,
  tokenize
} = require('./knowledge-base');

const liveSourceCache = new Map();

function decodeHtmlEntities(text) {
  return String(text || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractTextFromHtml(html) {
  return decodeHtmlEntities(
    String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function extractHintSections(text, hints) {
  const normalizedText = String(text || '');
  const sections = [];

  ensureArray(hints).forEach((hint) => {
    const index = normalizedText.toLowerCase().indexOf(String(hint).toLowerCase());
    if (index === -1) return;

    const start = Math.max(0, index - 120);
    const end = Math.min(normalizedText.length, index + 900);
    sections.push(normalizedText.slice(start, end).trim());
  });

  return sections.filter(Boolean);
}

function getCachedSource(sourceId) {
  const cached = liveSourceCache.get(sourceId);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    liveSourceCache.delete(sourceId);
    return null;
  }

  return cached.document;
}

function setCachedSource(sourceId, ttlMs, document) {
  liveSourceCache.set(sourceId, {
    expiresAt: Date.now() + ttlMs,
    document
  });
}

function analyzeRoute(question, routingConfig) {
  const normalizedQuestion = normalize(question);
  const questionTokens = new Set(tokenize(question));
  const intents = ensureArray(routingConfig && routingConfig.intents)
    .map((intent) => {
      const intentTokens = ensureArray(intent.keywords).flatMap((keyword) => tokenize(keyword));
      const matches = intentTokens.filter((token) => questionTokens.has(token));
      const score = matches.length / Math.max(intentTokens.length, 1);

      return {
        ...intent,
        score,
        matches
      };
    })
    .filter((intent) => intent.score > 0);

  const currentInfoTokens = ensureArray(routingConfig && routingConfig.currentInfoTokens);
  const wantsCurrentInfo = currentInfoTokens.some((token) => normalizedQuestion.includes(normalize(token)));
  const preferLiveSources = wantsCurrentInfo || intents.some((intent) => intent.preferLiveSources);
  const prioritizeKnowledge = intents.some((intent) => intent.prioritizeKnowledge);

  return {
    intents,
    wantsCurrentInfo,
    preferLiveSources,
    prioritizeKnowledge
  };
}

function sourceIntentScore(source, routeProfile) {
  const sourceTokens = new Set(ensureArray(source.topics).flatMap((topic) => tokenize(topic)));
  let score = 0;

  routeProfile.intents.forEach((intent) => {
    intent.matches.forEach((token) => {
      if (sourceTokens.has(token)) {
        score += intent.sourceBoost || 0;
      }
    });
  });

  if (routeProfile.wantsCurrentInfo && source.type !== 'web-page') {
    score += 4;
  }

  return score;
}

function selectRelevantSources(question, routingConfig, sourcesConfig) {
  const routeProfile = analyzeRoute(question, routingConfig);
  const selected = ensureArray(sourcesConfig && sourcesConfig.sources)
    .map((source) => ({
      ...source,
      sourceScore: sourceIntentScore(source, routeProfile)
    }))
    .filter((source) => routeProfile.preferLiveSources ? source.sourceScore > 0 : routeProfile.wantsCurrentInfo && source.sourceScore > 0)
    .sort((left, right) => right.sourceScore - left.sourceScore)
    .slice(0, 3);

  return {
    routeProfile,
    selectedSources: selected
  };
}

async function fetchWebPageSource(source, ttlMs) {
  const cached = getCachedSource(source.id);
  if (cached) return cached;

  const response = await fetch(source.url, {
    headers: {
      'User-Agent': 'LCCC-Assistant/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${source.url}: ${response.status}`);
  }

  const html = await response.text();
  const text = extractTextFromHtml(html);
  const sections = extractHintSections(text, source.extractHints);
  const content = sections.length ? sections.join('\n\n') : text.slice(0, 3000);

  const document = buildDocument({
    id: `live-${source.id}`,
    sourceType: 'live-web-page',
    title: source.title,
    content,
    keywords: source.topics,
    relatedQuestions: [],
    synonyms: [],
    sourcePath: source.url
  });

  document.fetchedAt = new Date().toISOString();
  setCachedSource(source.id, ttlMs, document);
  return document;
}

async function fetchYouTubeSource(source, ttlMs) {
  const cached = getCachedSource(source.id);
  if (cached) return cached;

  const apiKey = process.env.YOUTUBE_API_KEY || '';
  if (!apiKey) {
    return null;
  }

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${source.channelId}&order=date&type=video&maxResults=5&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data && data.error && data.error.message ? data.error.message : 'YouTube API request failed');
  }

  const videos = ensureArray(data.items).slice(0, 5).map((item) => {
    const publishedAt = item.snippet && item.snippet.publishedAt ? item.snippet.publishedAt : 'unknown date';
    return `- ${item.snippet.title} (${publishedAt}) https://www.youtube.com/watch?v=${item.id.videoId}`;
  });

  const document = buildDocument({
    id: `live-${source.id}`,
    sourceType: 'live-youtube-feed',
    title: source.title,
    content: videos.length
      ? `Most recent official videos from Life Changers TV:\n${videos.join('\n')}`
      : 'No recent videos returned by the official YouTube source.',
    keywords: source.topics,
    relatedQuestions: [],
    synonyms: [],
    sourcePath: source.url
  });

  document.fetchedAt = new Date().toISOString();
  setCachedSource(source.id, ttlMs, document);
  return document;
}

async function fetchFacebookSource(source, ttlMs) {
  const cached = getCachedSource(source.id);
  if (cached) return cached;

  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN || '';
  const pageId = process.env.FACEBOOK_PAGE_ID || source.pageId || '';
  if (!accessToken || !pageId) {
    return null;
  }

  const fields = 'message,created_time,permalink_url';
  const url = `https://graph.facebook.com/v19.0/${pageId}/feed?fields=${fields}&limit=5&access_token=${accessToken}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data && data.error && data.error.message ? data.error.message : 'Facebook API request failed');
  }

  const posts = ensureArray(data.data).slice(0, 5).map((post) => {
    const message = String(post.message || '').replace(/\s+/g, ' ').trim();
    const summary = message.length > 240 ? `${message.slice(0, 240)}...` : message;
    return `- ${post.created_time || 'unknown date'} ${summary} ${post.permalink_url || ''}`.trim();
  });

  const document = buildDocument({
    id: `live-${source.id}`,
    sourceType: 'live-facebook-feed',
    title: source.title,
    content: posts.length
      ? `Recent official Facebook posts from Life Changing Christian Church:\n${posts.join('\n')}`
      : 'No recent posts returned by the official Facebook source.',
    keywords: source.topics,
    relatedQuestions: [],
    synonyms: [],
    sourcePath: source.url
  });

  document.fetchedAt = new Date().toISOString();
  setCachedSource(source.id, ttlMs, document);
  return document;
}

async function fetchLiveSourceDocument(source, ttlMs) {
  switch (source.type) {
    case 'web-page':
      return fetchWebPageSource(source, ttlMs);
    case 'youtube-feed':
      return fetchYouTubeSource(source, ttlMs);
    case 'facebook-feed':
      return fetchFacebookSource(source, ttlMs);
    default:
      return null;
  }
}

async function fetchRelevantLiveDocuments(question, routingConfig, sourcesConfig) {
  const { routeProfile, selectedSources } = selectRelevantSources(question, routingConfig, sourcesConfig);
  if (!selectedSources.length) {
    return { routeProfile, documents: [] };
  }

  const ttlSeconds = Number(sourcesConfig && sourcesConfig.cacheTtlSeconds) || 900;
  const ttlMs = ttlSeconds * 1000;

  const settled = await Promise.allSettled(
    selectedSources.map((source) => fetchLiveSourceDocument(source, ttlMs))
  );

  const documents = settled
    .filter((result) => result.status === 'fulfilled' && result.value)
    .map((result) => result.value);

  return {
    routeProfile,
    documents
  };
}

function applyAdaptiveSourceBoost(document, routeProfile) {
  let adjustment = 0;

  if (routeProfile.prioritizeKnowledge && document.sourceType === 'knowledge-entry') {
    adjustment += 5;
  }

  if (routeProfile.prioritizeKnowledge && String(document.sourceType || '').startsWith('live-')) {
    adjustment -= 2;
  }

  if (routeProfile.preferLiveSources && String(document.sourceType || '').startsWith('live-')) {
    adjustment += 6;
  }

  if (routeProfile.wantsCurrentInfo && String(document.sourceType || '').startsWith('live-')) {
    adjustment += 4;
  }

  return adjustment;
}

module.exports = {
  analyzeRoute,
  applyAdaptiveSourceBoost,
  fetchRelevantLiveDocuments
};
