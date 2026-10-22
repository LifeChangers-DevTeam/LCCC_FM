(function () {
  const SERVER_ENDPOINT = '/api/church-assistant';

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

  const PHRASE_HINTS = [
    { pattern: /\b(where|how do i find|directions|map)\b/, tokens: ['location', 'address', 'directions'] },
    { pattern: /\b(contact|call|phone|email|whatsapp|get in touch|reach)\b/, tokens: ['contact', 'phone', 'email', 'whatsapp'] },
    { pattern: /\b(latest broadcast|watch online|watch live|livestream|live stream|youtube|latest service)\b/, tokens: ['broadcast', 'watch', 'youtube', 'latest'] },
    { pattern: /\b(listen|radio|audio stream|fm)\b/, tokens: ['radio', 'audio', 'stream'] },
    { pattern: /\b(prayer|counsel|counselling|counseling|support|help me)\b/, tokens: ['prayer', 'counseling', 'support'] },
    { pattern: /\b(book|books|resource|resources|publication|bookstore|store)\b/, tokens: ['book', 'resource', 'bookstore'] },
    { pattern: /\b(give|giving|offering|tithe|donation|seed)\b/, tokens: ['giving', 'offering', 'tithe'] },
    { pattern: /\b(service times|what time|schedule|program|event)\b/, tokens: ['service', 'schedule', 'time', 'program'] },
    { pattern: /\b(born again|saved|salvation|accept jesus)\b/, tokens: ['salvation', 'saved', 'jesus'] }
  ];

  const CONTEXTUAL_REFERENCES = new Set(['also', 'and', 'it', 'that', 'there', 'they', 'them', 'this', 'those']);
  const MULTI_INTENT_PATTERN = /\b(and|also|plus|as well as|along with|together with)\b/;
  const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

  const TOKEN_SYNONYMS = buildTokenSynonymMap(SYNONYM_GROUPS);

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

  function ensureArray(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
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

  function getHintTokens(normalizedText) {
    const tokens = [];
    PHRASE_HINTS.forEach(({ pattern, tokens: hintTokens }) => {
      if (pattern.test(normalizedText)) {
        tokens.push(...hintTokens.map(normalizeToken));
      }
    });
    return uniqueTokens(tokens);
  }

  function shouldUseConversationContext(question, state) {
    if (!state || !Array.isArray(state.lastEntries) || state.lastEntries.length === 0) {
      return false;
    }

    const tokens = tokenize(question);
    if (tokens.length <= 2) return true;

    const normalizedQuestion = normalize(question);
    const firstToken = normalizedQuestion.split(' ')[0];
    return CONTEXTUAL_REFERENCES.has(firstToken);
  }

  function getContextTokens(state) {
    return uniqueTokens(
      (state.lastEntries || []).flatMap((entry) => [
        ...tokenize(entry.title),
        ...ensureArray(entry.keywords).slice(0, 8).flatMap((keyword) => tokenize(keyword))
      ])
    );
  }

  function buildQuestionProfile(question, state) {
    const normalizedQuestion = normalize(question);
    const baseTokens = tokenize(question);
    const hintedTokens = getHintTokens(normalizedQuestion);
    const contextualTokens = shouldUseConversationContext(question, state) ? getContextTokens(state) : [];
    const coreTokens = uniqueTokens(baseTokens.length ? baseTokens : normalizedQuestion.split(' ').map(normalizeToken));
    const searchTokens = uniqueTokens(expandTokens([...coreTokens, ...hintedTokens, ...contextualTokens]));
    const phraseTokens = uniqueTokens([...coreTokens, ...hintedTokens]);

    return {
      normalizedQuestion,
      coreTokens,
      searchTokens,
      hintedTokens,
      queryBigrams: buildBigrams(phraseTokens),
      isMultiIntent: MULTI_INTENT_PATTERN.test(normalizedQuestion) || coreTokens.length >= 7
    };
  }

  function sanitizeEntry(entry) {
    return {
      ...entry,
      title: String(entry && entry.title || '').trim(),
      answer: String(entry && entry.answer || '').trim(),
      keywords: ensureArray(entry && entry.keywords),
      synonyms: ensureArray(entry && entry.synonyms),
      relatedQuestions: ensureArray(entry && entry.relatedQuestions)
    };
  }

  function buildKnowledgeIndex(knowledge) {
    knowledge.entries = ensureArray(knowledge.entries).map(sanitizeEntry);
    knowledge._searchIndex = knowledge.entries.map((entry) => {
      const titleText = normalize(entry.title);
      const answerText = normalize(entry.answer);
      const keywordPhrases = ensureArray(entry.keywords).map(normalize).filter(Boolean);
      const synonymPhrases = ensureArray(entry.synonyms).map(normalize).filter(Boolean);
      const relatedPhrases = ensureArray(entry.relatedQuestions).map(normalize).filter(Boolean);

      const titleTokens = uniqueTokens(expandTokens(tokenize(entry.title)));
      const answerTokens = uniqueTokens(expandTokens(tokenize(entry.answer)));
      const keywordTokens = uniqueTokens(expandTokens(tokenize(keywordPhrases.join(' '))));
      const synonymTokens = uniqueTokens(expandTokens(tokenize(synonymPhrases.join(' '))));
      const relatedTokens = uniqueTokens(expandTokens(tokenize(relatedPhrases.join(' '))));
      const allTokens = uniqueTokens([
        ...titleTokens,
        ...keywordTokens,
        ...synonymTokens,
        ...relatedTokens,
        ...answerTokens
      ]);

      return {
        entry,
        titleText,
        answerText,
        keywordPhrases,
        synonymPhrases,
        relatedPhrases,
        titleTokens,
        answerTokens,
        keywordTokens,
        synonymTokens,
        relatedTokens,
        allTokens
      };
    });
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

  function scoreEntry(profile, indexedEntry) {
    let score = 0;
    const matchedCoreTokens = new Set();

    if (profile.normalizedQuestion.length > 5) {
      if (indexedEntry.titleText.includes(profile.normalizedQuestion)) score += 18;
      if (indexedEntry.keywordPhrases.some((phrase) => phrase.includes(profile.normalizedQuestion))) score += 15;
      if (indexedEntry.synonymPhrases.some((phrase) => phrase.includes(profile.normalizedQuestion))) score += 12;
      if (indexedEntry.answerText.includes(profile.normalizedQuestion)) score += 8;
    }

    profile.queryBigrams.forEach((bigram) => {
      if (indexedEntry.titleText.includes(bigram)) score += 7;
      if (indexedEntry.keywordPhrases.some((phrase) => phrase.includes(bigram))) score += 8;
      if (indexedEntry.synonymPhrases.some((phrase) => phrase.includes(bigram))) score += 6;
      if (indexedEntry.answerText.includes(bigram)) score += 3;
    });

    profile.searchTokens.forEach((token) => {
      const titleMatch = getTokenMatch(token, indexedEntry.titleTokens).score;
      const keywordMatch = getTokenMatch(token, indexedEntry.keywordTokens).score;
      const synonymMatch = getTokenMatch(token, indexedEntry.synonymTokens).score;
      const relatedMatch = getTokenMatch(token, indexedEntry.relatedTokens).score;
      const answerMatch = getTokenMatch(token, indexedEntry.answerTokens).score;

      const bestFieldScore = Math.max(
        titleMatch * 5.2,
        keywordMatch * 4.6,
        synonymMatch * 4.4,
        relatedMatch * 3.8,
        answerMatch * 2.2
      );

      if (bestFieldScore > 0) {
        score += bestFieldScore;
      }

      if (profile.coreTokens.includes(token) && (titleMatch || keywordMatch || synonymMatch || relatedMatch || answerMatch)) {
        matchedCoreTokens.add(token);
      }
    });

    const coverage = profile.coreTokens.length ? matchedCoreTokens.size / profile.coreTokens.length : 0;
    score += coverage * 10;

    if (coverage >= 0.75) score += 6;
    if (profile.hintedTokens.some((token) => indexedEntry.allTokens.includes(token))) score += 2.5;

    return {
      entry: indexedEntry.entry,
      score,
      coverage,
      matchedTokens: [...matchedCoreTokens]
    };
  }

  function summarizeAnswer(answer) {
    const blocks = String(answer || '')
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean);

    if (blocks.length === 0) return '';

    if (blocks[0].length <= 220) {
      if (blocks[1] && blocks[1].length <= 240) {
        return `${blocks[0]}\n\n${blocks[1]}`;
      }
      return blocks[0];
    }

    const sentences = blocks[0].split(/(?<=[.!?])\s+/).filter(Boolean);
    return sentences.slice(0, 2).join(' ').trim();
  }

  function selectCompositeEntries(profile, ranked) {
    if (!ranked.length) return [];

    const first = ranked[0];
    const selected = [first];
    const coveredTokens = new Set(first.matchedTokens);

    if (!profile.isMultiIntent && (!ranked[1] || first.score >= ranked[1].score + 8)) {
      return selected;
    }

    for (let index = 1; index < ranked.length; index += 1) {
      const candidate = ranked[index];
      if (candidate.score < 5.5) break;
      if (selected.length >= 3) break;

      const newCoverage = candidate.matchedTokens.filter((token) => !coveredTokens.has(token));
      if (!profile.isMultiIntent && newCoverage.length === 0) continue;

      selected.push(candidate);
      newCoverage.forEach((token) => coveredTokens.add(token));
    }

    return selected;
  }

  function buildSuggestionList(matchedEntries, knowledge, currentQuestion) {
    return dedupeStrings([
      ...matchedEntries.flatMap((entry) => ensureArray(entry.relatedQuestions)),
      ...ensureArray(knowledge.suggestedQuestions)
    ])
      .filter((question) => normalize(question) !== normalize(currentQuestion))
      .slice(0, 5);
  }

  function buildLocalResponse(question, knowledge, state) {
    const profile = buildQuestionProfile(question, state);
    const ranked = ensureArray(knowledge._searchIndex)
      .map((indexedEntry) => scoreEntry(profile, indexedEntry))
      .sort((left, right) => right.score - left.score);

    if (!ranked.length || ranked[0].score < 6 || ranked[0].coverage < 0.2) {
      state.lastEntries = [];
      state.lastQuestion = question;
      return {
        title: 'Church Assistant',
        text: knowledge.fallback || 'I do not have an answer for that yet.',
        suggestions: buildSuggestionList([], knowledge, question),
        matchedEntries: []
      };
    }

    const selected = selectCompositeEntries(profile, ranked);
    state.lastEntries = selected.map((item) => item.entry);
    state.lastQuestion = question;

    if (selected.length === 1) {
      return {
        title: selected[0].entry.title,
        text: selected[0].entry.answer,
        suggestions: buildSuggestionList([selected[0].entry], knowledge, question),
        matchedEntries: [selected[0].entry]
      };
    }

    return {
      title: 'Church Assistant',
      text: 'I found a few parts of the ministry knowledge base that answer this question:',
      sections: selected.map((item) => ({
        title: item.entry.title,
        text: summarizeAnswer(item.entry.answer)
      })),
      suggestions: buildSuggestionList(selected.map((item) => item.entry), knowledge, question),
      matchedEntries: selected.map((item) => item.entry)
    };
  }

  async function requestServerResponse(question, state) {
    const history = ensureArray(state.conversation)
      .slice(-6)
      .map((item) => ({
        role: item.role,
        text: item.text
      }));

    const response = await fetch(SERVER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question,
        history
      })
    });

    if (!response.ok) {
      throw new Error(`Server assistant failed with status ${response.status}`);
    }

    const payload = await response.json();

    if (!payload || typeof payload.answer !== 'string') {
      throw new Error('Server assistant returned an invalid payload');
    }

    return {
      title: payload.title || 'Church Assistant',
      text: payload.answer,
      suggestions: ensureArray(payload.suggestions),
      matchedEntries: ensureArray(payload.sources).map((source) => ({
        title: source.title,
        keywords: [],
        relatedQuestions: []
      }))
    };
  }

  function appendLinkedText(container, text) {
    let cursor = 0;
    const matches = [...String(text || '').matchAll(URL_PATTERN)];

    matches.forEach((match) => {
      const url = match[0];
      const index = match.index || 0;
      if (index > cursor) {
        container.appendChild(document.createTextNode(text.slice(cursor, index)));
      }

      const link = document.createElement('a');
      link.href = url;
      link.textContent = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'assistant-link';
      container.appendChild(link);

      cursor = index + url.length;
    });

    if (cursor < text.length) {
      container.appendChild(document.createTextNode(text.slice(cursor)));
    }
  }

  function renderLines(node, lines) {
    lines.forEach((line, index) => {
      appendLinkedText(node, line);
      if (index < lines.length - 1) {
        node.appendChild(document.createElement('br'));
      }
    });
  }

  function renderFormattedText(container, text) {
    const blocks = String(text || '')
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean);

    if (blocks.length === 0) {
      const paragraph = document.createElement('p');
      paragraph.textContent = '';
      container.appendChild(paragraph);
      return;
    }

    blocks.forEach((block) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      const bulletLines = lines.every((line) => /^[-*•]\s+/.test(line));
      const numberedLines = lines.every((line) => /^\d+\.\s+/.test(line));

      if (bulletLines || numberedLines) {
        const list = document.createElement(numberedLines ? 'ol' : 'ul');
        lines.forEach((line) => {
          const item = document.createElement('li');
          appendLinkedText(item, line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, ''));
          list.appendChild(item);
        });
        container.appendChild(list);
        return;
      }

      const paragraph = document.createElement('p');
      renderLines(paragraph, lines);
      container.appendChild(paragraph);
    });
  }

  function appendMessage(log, message) {
    if (!log) return null;

    const item = document.createElement('div');
    item.className = `assistant-message ${message.role}${message.pending ? ' pending' : ''}`;

    if (message.title) {
      const heading = document.createElement('strong');
      heading.textContent = message.title;
      item.appendChild(heading);
    }

    const body = document.createElement('div');
    body.className = 'assistant-message-body';

    if (message.text) {
      renderFormattedText(body, message.text);
    }

    if (Array.isArray(message.sections) && message.sections.length) {
      message.sections.forEach((section) => {
        const sectionWrap = document.createElement('section');
        sectionWrap.className = 'assistant-section';

        const sectionTitle = document.createElement('div');
        sectionTitle.className = 'assistant-section-title';
        sectionTitle.textContent = section.title;
        sectionWrap.appendChild(sectionTitle);

        renderFormattedText(sectionWrap, section.text);
        body.appendChild(sectionWrap);
      });
    }

    item.appendChild(body);
    log.appendChild(item);
    log.scrollTop = log.scrollHeight;
    return item;
  }

  function renderSuggestions(container, questions, labelText, onSelect) {
    if (!container) return;

    const dedupedQuestions = dedupeStrings(questions).slice(0, 5);
    container.innerHTML = '';

    if (dedupedQuestions.length === 0) {
      container.hidden = true;
      return;
    }

    container.hidden = false;

    const label = document.createElement('p');
    label.className = 'assistant-suggestions-label';
    label.textContent = labelText;
    container.appendChild(label);

    dedupedQuestions.forEach((question) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'assistant-chip';
      button.textContent = question;
      button.addEventListener('click', () => onSelect(question));
      container.appendChild(button);
    });
  }

  async function initAssistant() {
    const panel = document.getElementById('churchAssistant');
    if (!panel) return;

    const launcher = document.getElementById('assistantLauncher');
    const closeButton = document.getElementById('assistantClose');
    const intro = document.getElementById('assistantIntro');
    const log = document.getElementById('assistantLog');
    const form = document.getElementById('assistantForm');
    const input = document.getElementById('assistantInput');
    const suggestions = document.getElementById('assistantSuggestions');
    const submitButton = form ? form.querySelector('button[type="submit"]') : null;
    const state = {
      conversation: [],
      lastEntries: [],
      lastQuestion: ''
    };

    function setOpen(open) {
      panel.classList.toggle('open', open);
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      launcher && launcher.setAttribute('aria-expanded', open ? 'true' : 'false');

      if (open) {
        setTimeout(() => input && input.focus({ preventScroll: true }), 60);
      }
    }

    function updateConversation(role, title, text) {
      state.conversation.push({
        role,
        title: title || '',
        text: text || ''
      });

      if (state.conversation.length > 10) {
        state.conversation = state.conversation.slice(-10);
      }
    }

    async function submitQuestion(question) {
      if (!question) return;

      setOpen(true);
      appendMessage(log, { role: 'user', text: question });
      updateConversation('user', '', question);

      const pending = appendMessage(log, {
        role: 'bot',
        title: 'Church Assistant',
        text: 'Thinking...',
        pending: true
      });

      if (submitButton) {
        submitButton.disabled = true;
      }

      let result = null;

      try {
        result = await requestServerResponse(question, state);
        state.lastEntries = result.matchedEntries || [];
      } catch (error) {
        console.warn('[ChurchAssistant] Server assistant unavailable, using local fallback.', error);
        result = buildLocalResponse(question, knowledge, state);
      } finally {
        if (pending && pending.parentNode) {
          pending.parentNode.removeChild(pending);
        }

        if (submitButton) {
          submitButton.disabled = false;
        }
      }

      appendMessage(log, { role: 'bot', ...result });
      updateConversation('assistant', result.title, result.text);
      renderSuggestions(
        suggestions,
        result.suggestions,
        result.matchedEntries && result.matchedEntries.length ? 'Try a related question:' : 'Try one of these questions:',
        (selectedQuestion) => {
          input.value = selectedQuestion;
          form.requestSubmit();
        }
      );

      input.value = '';
      input.focus({ preventScroll: true });
    }

    launcher && launcher.addEventListener('click', () => {
      setOpen(!panel.classList.contains('open'));
    });

    closeButton && closeButton.addEventListener('click', () => {
      setOpen(false);
    });

    let knowledge = {
      welcome: 'Welcome. How can I help you today?',
      fallback: 'I do not have an answer for that yet.',
      suggestedQuestions: [],
      entries: []
    };

    try {
      const response = await fetch('data/church-knowledge.json', { cache: 'no-store' });
      if (response.ok) {
        knowledge = await response.json();
      }
    } catch (error) {
      console.error('[ChurchAssistant] Failed to load knowledge:', error);
    }

    buildKnowledgeIndex(knowledge);

    if (intro) {
      intro.textContent = knowledge.welcome || intro.textContent;
    }

    appendMessage(log, {
      role: 'bot',
      title: 'Church Assistant',
      text: knowledge.welcome || 'How can I help you today?'
    });
    updateConversation('assistant', 'Church Assistant', knowledge.welcome || 'How can I help you today?');

    renderSuggestions(
      suggestions,
      ensureArray(knowledge.suggestedQuestions),
      'Try one of these questions:',
      (selectedQuestion) => {
        input.value = selectedQuestion;
        form.requestSubmit();
      }
    );

    form && form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitQuestion(input.value.trim());
    });
  }

  document.addEventListener('DOMContentLoaded', initAssistant);
})();
