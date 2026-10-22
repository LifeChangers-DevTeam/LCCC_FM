const fetch = require('node-fetch');

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify(body)
  };
}

function parseJsonBody(body) {
  try {
    return JSON.parse(body || '{}');
  } catch (error) {
    return null;
  }
}

function sanitizeText(value) {
  return String(value || '').replace(/\r/g, '').trim();
}

function validatePayload(payload) {
  const data = {
    name: sanitizeText(payload.name),
    contact: sanitizeText(payload.contact),
    request: sanitizeText(payload.request),
    followUpMethod: sanitizeText(payload.followUpMethod) || 'No preference',
    urgency: sanitizeText(payload.urgency) || 'Routine',
    botField: sanitizeText(payload['bot-field'] || payload.botField)
  };

  if (!data.name || data.name.length < 2) {
    return { error: 'Please provide your name.' };
  }

  if (!data.request || data.request.length < 10) {
    return { error: 'Please provide a fuller prayer request.' };
  }

  return { data };
}

async function submitToNetlifyForms(siteUrl, payload) {
  if (!siteUrl) {
    return { delivered: false, channel: 'netlify_forms' };
  }

  const submission = new URLSearchParams({
    'form-name': 'prayer-request',
    name: payload.name,
    contact: payload.contact || 'Not provided',
    request: payload.request,
    followUpMethod: payload.followUpMethod,
    urgency: payload.urgency,
    submittedFrom: 'website',
    submittedAt: new Date().toISOString()
  });

  const response = await fetch(`${siteUrl.replace(/\/$/, '')}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: submission.toString()
  });

  if (!response.ok) {
    throw new Error(`Netlify Forms submission failed with status ${response.status}`);
  }

  return { delivered: true, channel: 'netlify_forms' };
}

async function notifyWebhook(webhookUrl, payload, metadata) {
  if (!webhookUrl) {
    return { delivered: false, channel: 'webhook' };
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'prayer_request',
      receivedAt: metadata.receivedAt,
      source: 'lccc-website',
      payload
    })
  });

  if (!response.ok) {
    throw new Error(`Prayer webhook failed with status ${response.status}`);
  }

  return { delivered: true, channel: 'webhook' };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const payload = parseJsonBody(event.body);
  if (!payload) {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  const { error, data } = validatePayload(payload);
  if (error) {
    return jsonResponse(400, { error });
  }

  if (data.botField) {
    return jsonResponse(200, { ok: true, filtered: true });
  }

  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || process.env.SITE_URL || '';
  const webhookUrl = process.env.PRAYER_REQUEST_WEBHOOK_URL || '';
  const metadata = {
    receivedAt: new Date().toISOString(),
    siteUrl
  };

  try {
    const deliveries = [];

    deliveries.push(await submitToNetlifyForms(siteUrl, data));

    try {
      deliveries.push(await notifyWebhook(webhookUrl, data, metadata));
    } catch (error) {
      console.error('[prayer-request] Webhook delivery failed:', error.message);
      deliveries.push({
        delivered: false,
        channel: 'webhook',
        error: error.message
      });
    }

    const stored = deliveries.some((item) => item.channel === 'netlify_forms' && item.delivered);
    if (!stored && !webhookUrl) {
      throw new Error('Prayer request could not be stored. Configure URL or SITE_URL for Netlify Forms submission.');
    }

    return jsonResponse(200, {
      ok: true,
      message: 'Your prayer request was received. The church team can now follow up from the site dashboard and notifications.',
      deliveries
    });
  } catch (submissionError) {
    console.error('[prayer-request] Submission failed:', submissionError);
    return jsonResponse(500, {
      error: 'Prayer request submission failed.',
      message: submissionError.message
    });
  }
};
