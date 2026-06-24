/**
 * Fetches an AI-generated summary of a country's COVID-19 situation.
 * Calls the /.netlify/functions/aiDescription serverless function,
 * which holds the API key server-side and proxies to the Anthropic API.
 *
 * @param {Object} countryData
 * @param {string} countryData.country       - Country name
 * @param {number} [countryData.cases]       - Total confirmed cases
 * @param {number} [countryData.deaths]      - Total deaths
 * @param {number} [countryData.recovered]   - Total recovered
 * @param {number} [countryData.active]      - Active cases
 * @param {number} [countryData.todayCases]  - New cases today
 * @param {number} [countryData.todayDeaths] - New deaths today
 * @returns {Promise<string>} 1-2 sentence AI description, or empty string on failure
 */
export async function getCountryDescription(countryData) {
  try {
    const res = await fetch('/.netlify/functions/aiDescription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(countryData),
    });
    if (!res.ok) return '';
    const json = await res.json();
    return json.description ?? '';
  } catch {
    return '';
  }
}
