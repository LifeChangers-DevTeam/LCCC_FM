(function () {
  const state = {
    knowledge: null
  };

  function ensureArray(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
  }

  function parseCommaSeparated(value) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function parseLineSeparated(value) {
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function updateStats() {
    const stats = document.getElementById('knowledgeStats');
    if (!stats || !state.knowledge) return;

    const entryCount = ensureArray(state.knowledge.entries).length;
    const suggestionCount = ensureArray(state.knowledge.suggestedQuestions).length;
    stats.textContent = `${entryCount} entries • ${suggestionCount} suggested questions`;
  }

  function syncSettingsFromForm() {
    if (!state.knowledge) return;

    state.knowledge.welcome = document.getElementById('knowledgeWelcome').value.trim();
    state.knowledge.fallback = document.getElementById('knowledgeFallback').value.trim();
    state.knowledge.suggestedQuestions = parseLineSeparated(
      document.getElementById('knowledgeSuggestedQuestions').value
    );
    updateStats();
  }

  function populateSettingsForm() {
    if (!state.knowledge) return;

    document.getElementById('knowledgeWelcome').value = state.knowledge.welcome || '';
    document.getElementById('knowledgeFallback').value = state.knowledge.fallback || '';
    document.getElementById('knowledgeSuggestedQuestions').value = ensureArray(
      state.knowledge.suggestedQuestions
    ).join('\n');
    updateStats();
  }

  function resetEntryForm() {
    document.getElementById('knowledgeEditIndex').value = '';
    document.getElementById('knowledgeEntryForm').reset();
  }

  function populateEntryForm(index) {
    const entry = ensureArray(state.knowledge.entries)[index];
    if (!entry) return;

    document.getElementById('knowledgeEditIndex').value = String(index);
    document.getElementById('knowledgeTitle').value = entry.title || '';
    document.getElementById('knowledgeAnswer').value = entry.answer || '';
    document.getElementById('knowledgeKeywords').value = ensureArray(entry.keywords).join(', ');
    document.getElementById('knowledgeRelatedQuestions').value = ensureArray(entry.relatedQuestions).join('\n');
    document.getElementById('knowledgeSynonyms').value = ensureArray(entry.synonyms).join(', ');
  }

  function renderEntries() {
    const list = document.getElementById('knowledgeEntriesList');
    if (!list || !state.knowledge) return;

    const entries = ensureArray(state.knowledge.entries);
    list.innerHTML = '';

    if (entries.length === 0) {
      const emptyState = document.createElement('p');
      emptyState.className = 'studio-empty-state';
      emptyState.textContent = 'No knowledge entries yet.';
      list.appendChild(emptyState);
      updateStats();
      return;
    }

    entries.forEach((entry, index) => {
      const row = document.createElement('article');
      row.className = 'studio-update-row';
      row.innerHTML = `
        <div>
          <strong>${entry.title}</strong>
          <p class="studio-list-meta">${ensureArray(entry.keywords).length} keywords • ${ensureArray(entry.relatedQuestions).length} related questions</p>
        </div>
        <div class="studio-row-actions">
          <button type="button" data-edit="${index}" class="secondary-button">Edit</button>
          <button type="button" data-delete="${index}" class="secondary-button danger-button">Delete</button>
        </div>
      `;
      list.appendChild(row);
    });

    list.querySelectorAll('[data-edit]').forEach((button) => {
      button.addEventListener('click', () => populateEntryForm(Number(button.dataset.edit)));
    });

    list.querySelectorAll('[data-delete]').forEach((button) => {
      button.addEventListener('click', () => {
        state.knowledge.entries.splice(Number(button.dataset.delete), 1);
        renderEntries();
      });
    });

    updateStats();
  }

  function downloadJson() {
    syncSettingsFromForm();
    const blob = new Blob([JSON.stringify(state.knowledge, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'church-knowledge.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function init() {
    const response = await fetch('data/church-knowledge.json', { cache: 'no-store' });
    state.knowledge = await response.json();
    state.knowledge.entries = ensureArray(state.knowledge.entries);
    state.knowledge.suggestedQuestions = ensureArray(state.knowledge.suggestedQuestions);

    populateSettingsForm();
    renderEntries();

    document.getElementById('knowledgeSettingsForm')?.addEventListener('input', syncSettingsFromForm);

    document.getElementById('knowledgeEntryForm')?.addEventListener('submit', (event) => {
      event.preventDefault();

      const indexValue = document.getElementById('knowledgeEditIndex').value;
      const payload = {
        title: document.getElementById('knowledgeTitle').value.trim(),
        answer: document.getElementById('knowledgeAnswer').value.trim(),
        keywords: parseCommaSeparated(document.getElementById('knowledgeKeywords').value),
        relatedQuestions: parseLineSeparated(document.getElementById('knowledgeRelatedQuestions').value),
        synonyms: parseCommaSeparated(document.getElementById('knowledgeSynonyms').value)
      };

      if (!payload.relatedQuestions.length) {
        delete payload.relatedQuestions;
      }

      if (!payload.synonyms.length) {
        delete payload.synonyms;
      }

      if (indexValue === '') {
        state.knowledge.entries.push(payload);
      } else {
        state.knowledge.entries[Number(indexValue)] = payload;
      }

      resetEntryForm();
      renderEntries();
    });

    document.getElementById('knowledgeReset')?.addEventListener('click', resetEntryForm);
    document.getElementById('knowledgeExport')?.addEventListener('click', downloadJson);
  }

  document.addEventListener('DOMContentLoaded', () => {
    init().catch((error) => {
      console.error('[KnowledgeStudio] Failed to initialize:', error);
    });
  });
})();
