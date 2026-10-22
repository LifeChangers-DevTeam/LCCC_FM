(function () {
  async function loadContent() {
    const response = await fetch('data/ministry-content.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Unable to load ministry content: ${response.status}`);
    }

    return response.json();
  }

  function renderNotifications(content) {
    const message = document.getElementById('notification-message');
    const list = document.getElementById('notificationList');

    if (message && content.notificationMessage) {
      message.textContent = content.notificationMessage;
    }

    if (!list || !Array.isArray(content.notifications)) {
      return;
    }

    list.innerHTML = content.notifications.map((item) => `
      <article class="notification-item">
        <span class="notification-label">${item.label || 'Notice'}</span>
        <h4>${item.title || 'Update'}</h4>
        <p>${item.text || ''}</p>
      </article>
    `).join('');
  }

  function renderWeeklyUpdates(content) {
    const slide = document.querySelector('.slide');
    if (!slide || !Array.isArray(content.weeklyUpdates) || content.weeklyUpdates.length === 0) {
      return;
    }

    slide.innerHTML = content.weeklyUpdates.map((item) => `
      <div class="item" style="background-image: url(${item.image});">
        <div class="content">
          <div class="name">${item.title || 'Weekly Update'}</div>
          <div class="des">${item.description || ''}</div>
          <button class="view-btn">Full View</button>
        </div>
      </div>
    `).join('');
  }

  function renderPrayerPanel(content) {
    const prayer = content.prayerCta || {};
    const title = document.getElementById('prayerPanelTitle');
    const description = document.getElementById('prayerPanelDescription');
    const hours = document.getElementById('prayerOfficeHours');
    const whatsapp = document.getElementById('prayerWhatsappLink');
    const email = document.getElementById('prayerEmailLink');
    const success = document.getElementById('prayerSuccessMessage');

    if (title && prayer.title) title.textContent = prayer.title;
    if (description && prayer.description) description.textContent = prayer.description;
    if (hours && prayer.officeHours) hours.textContent = prayer.officeHours;
    if (success && prayer.successMessage) success.textContent = prayer.successMessage;

    if (whatsapp && prayer.whatsappUrl) {
      whatsapp.href = prayer.whatsappUrl;
      whatsapp.dataset.whatsappUrl = prayer.whatsappUrl;
    }

    if (email && prayer.email) {
      email.href = `mailto:${prayer.email}?subject=Prayer%20Request`;
      email.textContent = prayer.email;
    }
  }

  window.homeContentLoader = loadContent()
    .then((content) => {
      renderNotifications(content);
      renderWeeklyUpdates(content);
      renderPrayerPanel(content);
      window.__MINISTRY_CONTENT__ = content;
      return content;
    })
    .catch((error) => {
      console.error('[HomeContent] Failed to load ministry content:', error);
    });
})();

// Scroll to top button functionality
function initBackToTopButton() {
  const backToTopButton = document.getElementById('backToTopButton');

  if (!backToTopButton) {
    return;
  }

  backToTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const updateVisibility = () => {
    backToTopButton.classList.toggle('is-visible', window.scrollY > 420);
  };

  updateVisibility();
  window.addEventListener('scroll', updateVisibility, { passive: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBackToTopButton);
} else {
  initBackToTopButton();
}
