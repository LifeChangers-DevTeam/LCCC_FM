(function () {
  const state = {
    content: null
  };

  function renderList() {
    const list = document.getElementById('studioUpdatesList');
    if (!list || !state.content) return;

    list.innerHTML = '';

    state.content.weeklyUpdates.forEach((item, index) => {
      const row = document.createElement('article');
      row.className = 'studio-update-row';
      row.innerHTML = `
        <div>
          <strong>${item.title}</strong>
          <p>${item.image}</p>
        </div>
        <div class="studio-row-actions">
          <button type="button" data-edit="${index}" class="secondary-button">Edit</button>
          <button type="button" data-delete="${index}" class="secondary-button danger-button">Delete</button>
        </div>
      `;
      list.appendChild(row);
    });

    list.querySelectorAll('[data-edit]').forEach((button) => {
      button.addEventListener('click', () => populateForm(Number(button.dataset.edit)));
    });

    list.querySelectorAll('[data-delete]').forEach((button) => {
      button.addEventListener('click', () => {
        state.content.weeklyUpdates.splice(Number(button.dataset.delete), 1);
        renderList();
      });
    });
  }

  function populateForm(index) {
    const item = state.content.weeklyUpdates[index];
    document.getElementById('studioEditIndex').value = String(index);
    document.getElementById('studioTitle').value = item.title;
    document.getElementById('studioDescription').value = item.description;
    document.getElementById('studioImage').value = item.image;
  }

  function resetForm() {
    document.getElementById('studioEditIndex').value = '';
    document.getElementById('studioForm').reset();
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(state.content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ministry-content.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function init() {
    const response = await fetch('data/ministry-content.json', { cache: 'no-store' });
    state.content = await response.json();

    renderList();

    document.getElementById('studioForm')?.addEventListener('submit', (event) => {
      event.preventDefault();

      const indexValue = document.getElementById('studioEditIndex').value;
      const payload = {
        title: document.getElementById('studioTitle').value.trim(),
        description: document.getElementById('studioDescription').value.trim(),
        image: document.getElementById('studioImage').value.trim()
      };

      if (indexValue === '') {
        state.content.weeklyUpdates.push(payload);
      } else {
        state.content.weeklyUpdates[Number(indexValue)] = payload;
      }

      resetForm();
      renderList();
    });

    document.getElementById('studioReset')?.addEventListener('click', resetForm);
    document.getElementById('studioExport')?.addEventListener('click', downloadJson);
  }

  document.addEventListener('DOMContentLoaded', () => {
    init().catch((error) => {
      console.error('[ContentStudio] Failed to initialize:', error);
    });
  });
})();
