
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggleVideoBtn');
    const videoSection = document.getElementById('live-video-section');

    if (!toggleBtn || !videoSection) return;

    let visible = false;
    // ensure initial state
    videoSection.classList.remove('show');
    videoSection.setAttribute('aria-hidden', 'true');

    toggleBtn.addEventListener('click', () => {
      visible = !visible;
      videoSection.classList.toggle('show', visible);
      videoSection.setAttribute('aria-hidden', visible ? 'false' : 'true');
      toggleBtn.classList.toggle('active', visible);
      toggleBtn.innerHTML = visible
        ? '<i class="bi bi-x-circle"></i> Hide Broadcast'
        : '<i class="bi bi-collection-play"></i> Watch Latest Broadcast';
      // focus management
      if (visible) document.getElementById('youtubeFrame').focus();
    });
  });
})();
