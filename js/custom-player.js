(function () {
  const STREAM_URL = 'https://broadcast.shoutcheap.com/proxy/lifechan/stream';
  const STATUS_URL = 'https://broadcast.shoutcheap.com/external/rpc.php?m=streaminfo.get&username=lifechan';

  const CHURCH_TIME_ZONE = 'Africa/Windhoek';

  const SERVICE_SCHEDULE = [
    { weekday: 'Tue', startsAt: '18:30', durationMinutes: 120, name: 'Healing and Deliverance' },
    { weekday: 'Thu', startsAt: '18:30', durationMinutes: 120, name: 'Bible Study' },
    { weekday: 'Sun', startsAt: '10:00', durationMinutes: 180, name: 'Worship and Miracle Service' },
    { weekday: 'Fri', startsAt: '09:00', durationMinutes: 180, name: 'Night Vigil PowerShift Service', firstSaturday: true }
  ];

  const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  function getNamibiaParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: CHURCH_TIME_ZONE,
      weekday: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(date);

    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return {
      weekday: values.weekday,
      day: Number(values.day),
      minutes: (Number(values.hour) % 24) * 60 + Number(values.minute)
    };
  }

  function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  function serviceMatchesDay(service, parts) {
    if (service.weekday !== parts.weekday) return false;
    return !service.firstSaturday || parts.day <= 7;
  }

  function getServiceWindow(date = new Date()) {
    const parts = getNamibiaParts(date);

    const current = SERVICE_SCHEDULE.find((service) => {
      if (!serviceMatchesDay(service, parts)) return false;
      const start = timeToMinutes(service.startsAt);
      const end = start + service.durationMinutes;
      return parts.minutes >= start && parts.minutes < end;
    });

    if (current) {
      return {
        current,
        next: current,
        isServiceTime: true
      };
    }

    const currentDayIndex = WEEKDAY_INDEX[parts.weekday];
    const next = SERVICE_SCHEDULE
      .map((service) => {
        let daysUntil = (WEEKDAY_INDEX[service.weekday] - currentDayIndex + 7) % 7;
        const startMinutes = timeToMinutes(service.startsAt);

        if (daysUntil === 0 && startMinutes <= parts.minutes) {
          daysUntil = 7;
        }

        if (service.firstSaturday && daysUntil === 0 && parts.day > 7) {
          daysUntil = 7;
        }

        return { ...service, daysUntil };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil || timeToMinutes(a.startsAt) - timeToMinutes(b.startsAt))[0];

    return {
      current: null,
      next,
      isServiceTime: false
    };
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('radioStream');
    const playButton = document.getElementById('playToggleButton');
    const playLabel = playButton?.querySelector('.player-play-label');
    const playIcon = playButton?.querySelector('i');
    const muteButton = document.getElementById('muteToggleButton');
    const muteIcon = muteButton?.querySelector('i');
    const volumeSlider = document.getElementById('volumeSlider');
    const timer = document.getElementById('playerTimer');
    const playerStateText = document.getElementById('playerStateText');
    const streamModeBadge = document.getElementById('streamModeBadge');
    const streamSong = document.getElementById('streamSong');
    const streamProgramText = document.getElementById('streamProgramText');
    const lastUpdated = document.getElementById('last-updated');
    const serviceStatusLabel = document.getElementById('serviceStatusLabel');
    const serviceStatusText = document.getElementById('serviceStatusText');
    const liveIndicator = document.querySelector('.live-indicator');
    const bars = document.getElementById('playerLiveBars');
    const shareWhatsApp = document.getElementById('share-whatsapp');
    const shareFacebook = document.getElementById('share-facebook');
    const shareTwitter = document.getElementById('share-twitter');
    const copyLink = document.getElementById('copy-link');

    if (!audio || !playButton || !volumeSlider || !timer || !playerStateText || !streamSong || !lastUpdated || !liveIndicator || !streamModeBadge) {
      return;
    }

    let secondsListened = 0;
    let timerId = null;
    let currentSong = 'Life Changers Family FM is live now.';

    function setStreamMode(mode, label) {
      streamModeBadge.textContent = label;
      streamModeBadge.classList.remove('on-air', 'autodj', 'offline');
      streamModeBadge.classList.add(mode);
    }

    audio.volume = Number(volumeSlider.value) / 100;

    function updatePlayButton(isPlaying) {
      playButton.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
      playButton.classList.toggle('is-playing', isPlaying);

      if (playLabel) {
        playLabel.textContent = isPlaying ? 'Pause Live' : 'Listen Live';
      }

      if (playIcon) {
        playIcon.className = isPlaying ? 'bi bi-pause-fill' : 'bi bi-play-fill';
      }

      if (bars) {
        bars.classList.toggle('is-playing', isPlaying);
      }
    }

    function updateMuteButton() {
      if (!muteIcon) return;
      muteIcon.className = audio.muted || audio.volume === 0
        ? 'bi bi-volume-mute-fill'
        : 'bi bi-volume-up-fill';
    }

    function startListeningTimer() {
      if (timerId) return;
      timerId = window.setInterval(() => {
        secondsListened += 1;
        timer.textContent = formatTime(secondsListened);
      }, 1000);
    }

    function stopListeningTimer() {
      if (!timerId) return;
      window.clearInterval(timerId);
      timerId = null;
    }

    function formatServiceTimeRange(service) {
      const start = service.startsAt;
      const endMinutes = timeToMinutes(start) + service.durationMinutes;
      const endHours = Math.floor(endMinutes / 60) % 24;
      const endMinutesPart = endMinutes % 60;
      return `${start} - ${String(endHours).padStart(2, '0')}:${String(endMinutesPart).padStart(2, '0')}`;
    }

    function updateServiceStatus() {
      if (!serviceStatusLabel || !serviceStatusText) return;

      const serviceWindow = getServiceWindow(new Date());

      if (serviceWindow.isServiceTime && serviceWindow.current) {
        serviceStatusLabel.textContent = 'Service in Progress';
        serviceStatusText.textContent = `${serviceWindow.current.name} • ${formatServiceTimeRange(serviceWindow.current)}`;
        return;
      }

      if (serviceWindow.next) {
        serviceStatusLabel.textContent = 'Next Service';
        serviceStatusText.textContent = `${serviceWindow.next.name} • ${serviceWindow.next.weekday} ${serviceWindow.next.startsAt}`;
        return;
      }

      serviceStatusLabel.textContent = 'Next Service';
      serviceStatusText.textContent = 'No service scheduled';
    }

    function updateShareLinks() {
      const pageUrl = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`Listening to ${currentSong} on Life Changers Family FM`);

      shareWhatsApp?.addEventListener('click', () => {
        const directUrl = `whatsapp://send?text=${text}%20${pageUrl}`;
        const webUrl = `https://wa.me/?text=${text}%20${pageUrl}`;
        window.location.href = directUrl;
        window.setTimeout(() => window.open(webUrl, '_blank', 'noopener'), 500);
      });

      shareFacebook?.addEventListener('click', () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`, '_blank', 'noopener');
      });

      shareTwitter?.addEventListener('click', () => {
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${pageUrl}`, '_blank', 'noopener');
      });

      copyLink?.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          copyLink.classList.add('active');
          window.setTimeout(() => copyLink.classList.remove('active'), 1200);
        } catch (error) {
          console.error('[CustomPlayer] Copy failed:', error);
        }
      });
    }

    async function updateStatus() {
      try {
        const response = await fetch(STATUS_URL);
        const json = await response.json();
        const info = json.data?.[0];
        const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const serviceWindow = getServiceWindow(new Date());

        if (!info || info.offline || info.source === 'No') {
          liveIndicator.style.display = 'none';
          currentSong = 'Currently Offline - We will be back soon.';
          streamSong.textContent = currentSong;
          playerStateText.textContent = 'Offline right now';
          if (streamProgramText) {
            streamProgramText.textContent = 'The prayer team and ministry content remain available while the stream is offline.';
          }
          setStreamMode('offline', 'Offline');
          lastUpdated.textContent = `Last checked: ${timeString}`;
          return;
        }

        liveIndicator.style.display = 'inline-flex';
        currentSong = info.song || 'Broadcasting Live Now - Tune In and Be Blessed!';
        streamSong.textContent = currentSong;

        if (serviceWindow.isServiceTime && serviceWindow.current) {
          playerStateText.textContent = `${serviceWindow.current.name} live now`;
          if (streamProgramText) {
            streamProgramText.textContent = 'Listening to live service now';
          }
          setStreamMode('on-air', 'Service Live');
        } else if (info.source === 'Yes') {
          playerStateText.textContent = 'Live broadcast on air';
          if (streamProgramText) {
            streamProgramText.textContent = currentSong;
          }
          setStreamMode('on-air', 'On Air');
        } else {
          playerStateText.textContent = 'AutoDJ is currently on air';
          if (streamProgramText) {
            streamProgramText.textContent = currentSong;
          }
          setStreamMode('autodj', 'AutoDJ');
        }
        lastUpdated.textContent = `Last checked: ${timeString}`;
      } catch (error) {
        console.error('[CustomPlayer] Status check failed:', error);
        currentSong = 'Unable to check stream status right now.';
        streamSong.textContent = currentSong;
        playerStateText.textContent = 'Connection status unavailable';
        if (streamProgramText) {
          streamProgramText.textContent = 'Live metadata could not be refreshed. Try again shortly.';
        }
        setStreamMode('offline', 'Unavailable');
        lastUpdated.textContent = 'Status check failed';
      }
    }

    playButton.addEventListener('click', async () => {
      try {
        if (audio.paused) {
          playerStateText.textContent = 'Connecting to live stream...';
          await audio.play();
        } else {
          audio.pause();
        }
      } catch (error) {
        console.error('[CustomPlayer] Playback failed:', error);
        playerStateText.textContent = 'Tap again to retry the stream';
      }
    });

    muteButton?.addEventListener('click', () => {
      audio.muted = !audio.muted;
      updateMuteButton();
    });

    volumeSlider.addEventListener('input', () => {
      const volume = Number(volumeSlider.value) / 100;
      audio.volume = volume;
      audio.muted = volume === 0;
      updateMuteButton();
    });

    audio.addEventListener('play', () => {
      updatePlayButton(true);
      playerStateText.textContent = 'Live stream playing';
      startListeningTimer();
    });

    audio.addEventListener('pause', () => {
      updatePlayButton(false);
      playerStateText.textContent = 'Stream paused';
      stopListeningTimer();
    });

    audio.addEventListener('waiting', () => {
      playerStateText.textContent = 'Buffering live stream...';
    });

    audio.addEventListener('error', () => {
      updatePlayButton(false);
      stopListeningTimer();
      playerStateText.textContent = 'Unable to play the stream right now';
    });

    streamSong.href = STREAM_URL;
    timer.textContent = formatTime(secondsListened);
    updateMuteButton();
    updatePlayButton(false);
    updateShareLinks();
    updateStatus();
    updateServiceStatus();
    window.setInterval(updateStatus, 15000);
    window.setInterval(updateServiceStatus, 60000);
  });
})();
