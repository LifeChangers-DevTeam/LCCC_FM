/**
 * YOUTUBE VIDEO LOADER - Enhanced with Environment Variables
 * Fetches latest service videos from YouTube channel
 * Version: 2.0.0 - Secure with env vars
 */

class YouTubeVideoLoader {
  constructor() {
    // Check if API key is a placeholder (not replaced by Netlify)
    const apiKeyFromEnv = window.__YOUTUBE_API_KEY__;
    const isPlaceholder = !apiKeyFromEnv || apiKeyFromEnv.includes('__');
    
    this.config = {
      // YouTube Channel ID for Life Changers TV
      channelId: 'UCqKbyuM7cqlZGUZCeaVssjw',
      
      // API Key from environment variable or Netlify Function
      apiKey: isPlaceholder ? null : apiKeyFromEnv,
      
      // Use Netlify Function if no API key or key is placeholder
      useNetlifyFunction: isPlaceholder,
      
      // Refresh interval (2 minutes)
      refreshInterval: 120000,
      
      // Cache duration (10 minutes)
      cacheDuration: 600000,
      cacheKey: 'lccc-latest-video',
      
      // Keywords for service videos
      serviceKeywords: [
        'service', 'fasting', 'prayer', 'sunday', 'miracle',
        'deliverance', 'power', 'night', 'shift', 'worship',
        'broadcast', 'live', 'sermon', 'preaching'
      ]
    };

    this.currentVideoId = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.isLoading = false;

    console.log('[YouTube] Initializing with config:', {
      hasApiKey: !!this.config.apiKey,
      useFunction: this.config.useNetlifyFunction,
      channelId: this.config.channelId
    });

    this.init();
  }

  init() {
    this.loadLatestVideo();
    
    // Auto-refresh
    setInterval(() => {
      if (!document.hidden) {
        this.loadLatestVideo(true);
      }
    }, this.config.refreshInterval);

    // Refresh when tab becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !this.isLoading) {
        this.loadLatestVideo(true);
      }
    });
  }

  async loadLatestVideo(silent = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      // Try cache first
      const cached = this.getCachedVideo();
      if (cached && !silent) {
        console.log('[YouTube] Using cached video');
        this.displayVideo(cached);
        this.isLoading = false;
        return;
      }

      console.log('[YouTube] Fetching latest video...');

      // Try to fetch live broadcast first
      let videoId = await this.fetchLiveBroadcast();
      
      if (!videoId) {
        // No live broadcast, get recent service video
        videoId = await this.fetchRecentServiceVideo();
      }

      if (!videoId) {
        throw new Error('No suitable video found');
      }

      // Cache and display
      this.setCachedVideo(videoId);
      this.displayVideo(videoId);
      this.retryCount = 0;

    } catch (error) {
      console.error('[YouTube] Error loading video:', error);
      
      // Try cached version on error
      const cached = this.getCachedVideo();
      if (cached) {
        console.log('[YouTube] Using cached video after error');
        this.displayVideo(cached);
      } else if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`[YouTube] Retrying... (${this.retryCount}/${this.maxRetries})`);
        setTimeout(() => this.loadLatestVideo(silent), 5000 * this.retryCount);
      } else {
        this.showError();
      }
    } finally {
      this.isLoading = false;
    }
  }

  async fetchLiveBroadcast() {
    try {
      let data;

      if (this.config.useNetlifyFunction) {
        // Use Netlify Function (most secure)
        const response = await fetch(`/.netlify/functions/youtube-api?action=live-broadcast&channelId=${this.config.channelId}`);
        data = await response.json();
      } else {
        // Use direct API call with key
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${this.config.channelId}&eventType=live&type=video&key=${this.config.apiKey}`;
        const response = await fetch(url);
        data = await response.json();
      }

      if (data.items && data.items.length > 0) {
        console.log('[YouTube] Found live broadcast');
        return data.items[0].id.videoId;
      }

      return null;
    } catch (error) {
      console.warn('[YouTube] Live broadcast check failed:', error);
      return null;
    }
  }

  async fetchRecentServiceVideo() {
    try {
      let data;

      if (this.config.useNetlifyFunction) {
        // Use Netlify Function
        const response = await fetch(`/.netlify/functions/youtube-api?action=recent-video&channelId=${this.config.channelId}`);
        data = await response.json();
      } else {
        // Use direct API call
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${this.config.channelId}&order=date&type=video&maxResults=10&key=${this.config.apiKey}`;
        const response = await fetch(url);
        data = await response.json();
      }

      if (!data.items || data.items.length === 0) {
        throw new Error('No videos found');
      }

      // Filter for service videos
      for (const item of data.items) {
        const title = item.snippet.title.toLowerCase();
        const description = (item.snippet.description || '').toLowerCase();
        
        const isServiceVideo = this.config.serviceKeywords.some(keyword => 
          title.includes(keyword) || description.includes(keyword)
        );

        if (isServiceVideo) {
          console.log('[YouTube] Found service video:', item.snippet.title);
          return item.id.videoId;
        }
      }

      // If no service video found, return most recent
      console.log('[YouTube] Using most recent video');
      return data.items[0].id.videoId;

    } catch (error) {
      console.error('[YouTube] API fetch failed:', error);
      throw error;
    }
  }

  getCachedVideo() {
    try {
      const cached = localStorage.getItem(this.config.cacheKey);
      if (!cached) return null;

      const { videoId, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age < this.config.cacheDuration) {
        return videoId;
      }

      // Cache expired
      localStorage.removeItem(this.config.cacheKey);
      return null;
    } catch (error) {
      console.warn('[YouTube] Cache read failed:', error);
      return null;
    }
  }

  setCachedVideo(videoId) {
    try {
      const data = {
        videoId,
        timestamp: Date.now()
      };
      localStorage.setItem(this.config.cacheKey, JSON.stringify(data));
    } catch (error) {
      console.warn('[YouTube] Cache write failed:', error);
    }
  }

  displayVideo(videoId) {
    if (this.currentVideoId === videoId) {
      return; // Already displaying this video
    }

    this.currentVideoId = videoId;
    const iframe = document.getElementById('youtubeFrame');
    
    if (iframe) {
      const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
      iframe.src = embedUrl;
      console.log('[YouTube] Video loaded:', videoId);

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('youtube-video-loaded', {
        detail: { videoId }
      }));
    }
  }

  showError() {
    console.error('[YouTube] Failed to load video after retries');
    const iframe = document.getElementById('youtubeFrame');
    
    if (iframe && iframe.parentElement) {
      iframe.parentElement.innerHTML = `
        <div style="padding: 2rem; text-align: center; background: rgba(255,255,255,0.1); border-radius: 12px;">
          <i class="bi bi-exclamation-triangle" style="font-size: 3rem; color: #ff4c4c;"></i>
          <p style="margin-top: 1rem; color: white;">Unable to load video</p>
          <button onclick="window.youtubeLoader.loadLatestVideo()" 
                  style="margin-top: 1rem; padding: 10px 20px; background: #860b46; color: white; border: none; border-radius: 8px; cursor: pointer;">
            Retry
          </button>
        </div>
      `;
    }
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.youtubeLoader = new YouTubeVideoLoader();
  });
} else {
  window.youtubeLoader = new YouTubeVideoLoader();
}

console.log('[YouTube] Module loaded');
