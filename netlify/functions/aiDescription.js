const https = require('https');

const ANTHROPIC_API_URL = 'api.anthropic.com';
const ANTHROPIC_API_PATH = '/v1/messages';

function callAnthropic(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const body = JSON.stringify({
    model: 'claude-3-haiku-20240307',
    max_tokens: 150,
    messages: [{ role: 'user', content: prompt }],
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: ANTHROPIC_API_URL,
        path: ANTHROPIC_API_PATH,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse Anthropic response'));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let countryData;
  try {
    countryData = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { country, cases, deaths, recovered, active, todayCases, todayDeaths } = countryData;
  if (!country) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required field: country' }) };
  }

  const prompt =
    `Summarize the COVID-19 situation in ${country} in 1-2 sentences based on this data: ` +
    `${cases?.toLocaleString() ?? 'N/A'} total cases, ` +
    `${deaths?.toLocaleString() ?? 'N/A'} deaths, ` +
    `${recovered?.toLocaleString() ?? 'N/A'} recovered, ` +
    `${active?.toLocaleString() ?? 'N/A'} active cases, ` +
    `${todayCases?.toLocaleString() ?? 'N/A'} new cases today, ` +
    `${todayDeaths?.toLocaleString() ?? 'N/A'} new deaths today. ` +
    `Be concise and factual.`;

  try {
    const response = await callAnthropic(prompt);
    const description = response?.content?.[0]?.text ?? '';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    };
  } catch (err) {
    console.error('Anthropic API error:', err.message);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Failed to generate description' }),
    };
  }
};
