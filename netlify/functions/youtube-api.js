/**
 * NETLIFY FUNCTION: YouTube API Proxy
 * Keeps API key secure on server-side
 */

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Get API key from environment variable
  const API_KEY = process.env.YOUTUBE_API_KEY;

  if (!API_KEY) {
    console.error('[YouTube API] API key not configured');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key not configured' })
    };
  }

  // Parse query parameters
  const { action, channelId, videoId } = event.queryStringParameters || {};

  try {
    let url;

    switch (action) {
      case 'live-broadcast':
        // Check for live broadcasts
        url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${API_KEY}`;
        break;

      case 'recent-video':
        // Get recent uploads
        url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=10&key=${API_KEY}`;
        break;

      case 'video-details':
        // Get video details
        url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${API_KEY}`;
        break;

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid action parameter' })
        };
    }

    console.log('[YouTube API] Fetching:', action);

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error('[YouTube API] Error:', data);
      return {
        statusCode: response.status,
        body: JSON.stringify(data)
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=120' // Cache for 2 minutes
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('[YouTube API] Exception:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};
