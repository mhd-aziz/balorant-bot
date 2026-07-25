/**
 * Riot ID Helper
 * Parse and validate Riot ID format
 */

/**
 * Split Riot ID into name and tag
 * @param {string} riotId - Format: "Name#TAG"
 * @returns {{gameName: string, tagLine: string}}
 * @throws {Error} If format is invalid
 */
function parseRiotId(riotId) {
  const match = riotId.match(/^(.+)#([a-zA-Z0-9]+)$/);
  if (!match) {
    throw new Error('Invalid Riot ID format. Expected: Name#TAG');
  }
  return {
    gameName: match[1].trim(),
    tagLine: match[2].trim(),
  };
}

module.exports = { parseRiotId };
