/**
 * YOUTUBE VIDEO LOADER - Hardcoded with Netlify Function Fallback
 * Fetches latest service videos from YouTube channel
 * Version: 2.2.0 - Robust with dual methods
 * 
 * METHOD 1: Direct API call with hardcoded key
 * METHOD 2: Netlify Function (if direct fails or key invalid)
 */

class YouTubeVideoLoader {
  constructor() {
    const runtimeApiKey = window.__YOUTUBE_API_KEY__;
    const hasRuntimeApiKey = runtimeApiKey && !runtimeApiKey.includes('__');

    this.config = {
      // YouTube Channel ID for Life Changers TV
      channelId: 'UCqKbyuM7cqlZGUZCeaVssjw',
      
      // Prefer runtime config when available, otherwise keep the current fallback.
      apiKey: hasRuntimeApiKey
        ? runtimeApiKey
        : 'AIzaSyDiV4Gn9I3w5VW19O7sj8x4cFrj4iluRQ0',
      
      // Prefer the Netlify function first so env-based deploys work without client exposure.
      tryDirectFirst: false,
      
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
    this.lastMethodUsed = null;

    console.log('[YouTube] Initializing with triple-method support:', {
      hasApiKey: !!this.config.apiKey,
      methods: ['Direct API', 'Netlify Function', 'RSS Feed'],
      channelId: this.config.channelId
    });

    this.init();
  }

  init() {
    this.loadLatestVideo();
    
    // Auto-refresh every 2 minutes
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
        console.log('[YouTube] ✓ Using cached video');
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
      console.error('[YouTube] ❌ Error loading video:', error);
      
      // Try cached version on error
      const cached = this.getCachedVideo();
      if (cached) {
        console.log('[YouTube] ✓ Using cached video after error');
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
    // Try direct API first, then function fallback
    if (this.config.tryDirectFirst) {
      const videoId = await this.fetchLiveBroadcastDirect();
      if (videoId) return videoId;
      
      console.log('[YouTube] Direct API failed for live, trying function...');
      return await this.fetchLiveBroadcastFunction();
    } else {
      // Try function first
      const videoId = await this.fetchLiveBroadcastFunction();
      if (videoId) return videoId;
      
      console.log('[YouTube] Function failed for live, trying direct API...');
      return await this.fetchLiveBroadcastDirect();
    }
  }

  async fetchLiveBroadcastDirect() {
    if (!this.config.apiKey) {
      return null;
    }

    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${this.config.channelId}&eventType=live&type=video&key=${this.config.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.warn('[YouTube] Direct API error:', data.error.message);
        return null;
      }

      if (data.items && data.items.length > 0) {
        console.log('[YouTube] ✓ Found live broadcast (Direct API)');
        this.lastMethodUsed = 'direct';
        return data.items[0].id.videoId;
      }

      return null;
    } catch (error) {
      console.warn('[YouTube] Direct live broadcast check failed:', error);
      return null;
    }
  }

  async fetchLiveBroadcastFunction() {
    try {
      const response = await fetch(`/.netlify/functions/youtube-api?action=live-broadcast&channelId=${this.config.channelId}`);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        console.log('[YouTube] ✓ Found live broadcast (Netlify Function)');
        this.lastMethodUsed = 'function';
        return data.items[0].id.videoId;
      }

      return null;
    } catch (error) {
      console.warn('[YouTube] Function live broadcast check failed:', error);
      return null;
    }
  }

  async fetchRecentServiceVideo() {
    if (this.config.tryDirectFirst) {
      const directVideoId = await this.fetchRecentServiceVideoDirect();
      if (directVideoId) return directVideoId;

      console.log('[YouTube] Direct API failed for recent, trying function...');
      const functionVideoId = await this.fetchRecentServiceVideoFunction();
      if (functionVideoId) return functionVideoId;
    } else {
      const functionVideoId = await this.fetchRecentServiceVideoFunction();
      if (functionVideoId) return functionVideoId;

      console.log('[YouTube] Function failed for recent, trying direct API...');
      const directVideoId = await this.fetchRecentServiceVideoDirect();
      if (directVideoId) return directVideoId;
    }

    console.log('[YouTube] Function and direct API failed for recent, trying RSS...');
    return await this.fetchRecentServiceVideoRSS();
  }

  async fetchRecentServiceVideoDirect() {
    if (!this.config.apiKey) {
      return null;
    }

    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${this.config.channelId}&order=date&type=video&maxResults=10&key=${this.config.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error('[YouTube] Direct API Error:', data.error.message);
        throw new Error(data.error.message);
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
          console.log('[YouTube] ✓ Found service video (Direct API):', item.snippet.title);
          this.lastMethodUsed = 'direct';
          return item.id.videoId;
        }
      }

      // If no service video found, return most recent
      console.log('[YouTube] ✓ Using most recent video (Direct API):', data.items[0].snippet.title);
      this.lastMethodUsed = 'direct';
      return data.items[0].id.videoId;

    } catch (error) {
      console.error('[YouTube] Direct API fetch failed:', error);
      return null;
    }
  }

  async fetchRecentServiceVideoFunction() {
    try {
      const response = await fetch(`/.netlify/functions/youtube-api?action=recent-video&channelId=${this.config.channelId}`);
      const data = await response.json();

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
          console.log('[YouTube] ✓ Found service video (Netlify Function):', item.snippet.title);
          this.lastMethodUsed = 'function';
          return item.id.videoId;
        }
      }

      // If no service video found, return most recent
      console.log('[YouTube] ✓ Using most recent video (Netlify Function):', data.items[0].snippet.title);
      this.lastMethodUsed = 'function';
      return data.items[0].id.videoId;

    } catch (error) {
      console.error('[YouTube] Function API fetch failed:', error);
      return null;
    }
  }

  async fetchRecentServiceVideoRSS() {
    try {
      console.log('[YouTube] Trying RSS feed fallback...');
      
      // YouTube RSS feed doesn't require API key
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${this.config.channelId}`;
      const response = await fetch(rssUrl);
      const xmlText = await response.text();
      
      // Parse XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      // Get all entries
      const entries = xmlDoc.querySelectorAll('entry');
      
      if (entries.length === 0) {
        throw new Error('No videos in RSS feed');
      }

      // Try to find service video
      for (const entry of entries) {
        const title = entry.querySelector('title')?.textContent?.toLowerCase() || '';
        const description = entry.querySelector('media\\:description, description')?.textContent?.toLowerCase() || '';
        
        const isServiceVideo = this.config.serviceKeywords.some(keyword => 
          title.includes(keyword) || description.includes(keyword)
        );

        if (isServiceVideo) {
          const videoId = entry.querySelector('yt\\:videoId, videoId')?.textContent;
          if (videoId) {
            console.log('[YouTube] ✓ Found service video (RSS):', entry.querySelector('title')?.textContent);
            this.lastMethodUsed = 'rss';
            return videoId;
          }
        }
      }

      // If no service video found, return most recent
      const firstEntry = entries[0];
      const videoId = firstEntry.querySelector('yt\\:videoId, videoId')?.textContent;
      
      if (videoId) {
        console.log('[YouTube] ✓ Using most recent video (RSS):', firstEntry.querySelector('title')?.textContent);
        this.lastMethodUsed = 'rss';
        return videoId;
      }

      throw new Error('Could not extract video ID from RSS');

    } catch (error) {
      console.error('[YouTube] RSS fetch failed:', error);
      return null;
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
        timestamp: Date.now(),
        method: this.lastMethodUsed
      };
      localStorage.setItem(this.config.cacheKey, JSON.stringify(data));
      console.log(`[YouTube] ✓ Cached video (via ${this.lastMethodUsed})`);
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
      console.log('[YouTube] ✓ Video loaded:', videoId);

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('youtube-video-loaded', {
        detail: { videoId, method: this.lastMethodUsed }
      }));
    }
  }

  showError() {
    console.error('[YouTube] ❌ Failed to load video after all retries');
    const iframe = document.getElementById('youtubeFrame');
    
    if (iframe && iframe.parentElement) {
      iframe.parentElement.innerHTML = `
        <div style="padding: 2rem; text-align: center; background: rgba(255,255,255,0.1); border-radius: 12px;">
          <i class="bi bi-exclamation-triangle" style="font-size: 3rem; color: #ff4c4c;"></i>
          <p style="margin-top: 1rem; color: white;">Unable to load video</p>
          <p style="font-size: 0.9rem; color: rgba(255,255,255,0.7);">All 3 methods failed (API, Function, RSS)</p>
          <button onclick="window.youtubeLoader.loadLatestVideo()" 
                  style="margin-top: 1rem; padding: 10px 20px; background: #860b46; color: white; border: none; border-radius: 8px; cursor: pointer;">
            <i class="bi bi-arrow-clockwise"></i> Retry
          </button>
        </div>
      `;
    }
  }

  // Manual method switcher for testing
  switchMethod() {
    this.config.tryDirectFirst = !this.config.tryDirectFirst;
    console.log(`[YouTube] Switched to ${this.config.tryDirectFirst ? 'Direct API first' : 'Function first'}`);
    this.loadLatestVideo();
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

console.log('[YouTube] Module loaded - Triple-method support enabled (Function → API → RSS) ✓');
