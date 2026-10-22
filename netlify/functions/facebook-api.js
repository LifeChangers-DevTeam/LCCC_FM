/**
 * NETLIFY FUNCTION: Facebook Graph API Proxy
 * Keeps access token secure on server-side
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

  // Get credentials from environment variables
  const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
  const PAGE_ID = process.env.FACEBOOK_PAGE_ID || '100079670415708';

  if (!ACCESS_TOKEN) {
    console.error('[Facebook API] Access token not configured');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Access token not configured' })
    };
  }

  // Parse query parameters
  const { endpoint, limit } = event.queryStringParameters || {};

  try {
    let url;
    const defaultLimit = limit || '50';

    switch (endpoint) {
      case 'feed':
        // Get posts from feed
        const feedFields = 'id,message,full_picture,created_time,permalink_url,attachments{media,type,subattachments,description,url},story';
        url = `https://graph.facebook.com/v19.0/${PAGE_ID}/feed?fields=${feedFields}&limit=${defaultLimit}&access_token=${ACCESS_TOKEN}`;
        break;

      case 'photos':
        // Get uploaded photos
        const photoFields = 'id,created_time,name,picture,images,permalink_url,album';
        url = `https://graph.facebook.com/v19.0/${PAGE_ID}/photos/uploaded?fields=${photoFields}&limit=${defaultLimit}&access_token=${ACCESS_TOKEN}`;
        break;

      case 'posts':
        // Get published posts
        const postFields = 'id,message,full_picture,created_time,permalink_url,attachments{media,type,url}';
        url = `https://graph.facebook.com/v19.0/${PAGE_ID}/posts?fields=${postFields}&limit=${defaultLimit}&access_token=${ACCESS_TOKEN}`;
        break;

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid endpoint parameter. Use: feed, photos, or posts' })
        };
    }

    console.log('[Facebook API] Fetching:', endpoint);

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('[Facebook API] Error:', data.error || data);
      return {
        statusCode: response.status || 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(data)
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('[Facebook API] Exception:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      })
    };
  }
};
