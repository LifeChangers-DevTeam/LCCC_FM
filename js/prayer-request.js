(function () {
  const PRAYER_ENDPOINT = '/api/prayer-request';

  function setStatus(element, text, isError) {
    if (!element) return;

    element.textContent = text;
    element.classList.toggle('is-error', Boolean(isError));
    element.classList.toggle('is-success', !isError);
  }

  async function submitPrayerRequest(payload) {
    const response = await fetch(PRAYER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Prayer request submission failed.');
    }

    return data;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('prayerRequestForm');
    const successMessage = document.getElementById('prayerSuccessMessage');
    const officeHours = document.getElementById('prayerOfficeHours');
    const submitButton = form ? form.querySelector('button[type="submit"]') : null;

    if (!form || !submitButton) {
      return;
    }

    if (officeHours) {
      officeHours.textContent = 'Prayer requests are reviewed by the church team during office hours. For urgent matters, use WhatsApp or phone as well.';
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const payload = {
        name: (formData.get('name') || '').toString().trim(),
        contact: (formData.get('contact') || '').toString().trim(),
        request: (formData.get('request') || '').toString().trim(),
        followUpMethod: (formData.get('followUpMethod') || '').toString().trim(),
        urgency: (formData.get('urgency') || '').toString().trim(),
        'bot-field': (formData.get('bot-field') || '').toString().trim()
      };

      submitButton.disabled = true;
      setStatus(successMessage, 'Sending your prayer request...', false);

      try {
        const result = await submitPrayerRequest(payload);
        setStatus(
          successMessage,
          result.message || 'Your prayer request was sent successfully.',
          false
        );
        form.reset();
      } catch (error) {
        console.error('[PrayerRequest] Submission failed:', error);
        setStatus(
          successMessage,
          `${error.message} If this is urgent, use the WhatsApp Prayer Team button or call the church office directly.`,
          true
        );
      } finally {
        submitButton.disabled = false;
      }
    });
  });
})();
