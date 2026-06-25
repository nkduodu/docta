/**
 * Netlify Serverless Function - Claude API Proxy
 * 
 * This function proxies requests to the Anthropic Claude API
 * The API key is stored in Netlify environment variables (secure)
 * 
 * Deploy: Place this file at netlify/functions/claude-proxy.js
 */

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const { prompt } = JSON.parse(event.body);

    // Get API key from environment variable (set in Netlify settings)
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Verify API key is configured
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'API key not configured. Set ANTHROPIC_API_KEY environment variable in Netlify settings.'
        })
      };
    }

    // Verify prompt is provided
    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing prompt in request body' })
      };
    }

    // Call Anthropic Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    // Get response data
    const data = await response.json();

    // Check if API call was successful
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: data.error?.message || 'API call failed'
        })
      };
    }

    // Return successful response
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Error in claude-proxy:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Internal server error'
      })
    };
  }
};
