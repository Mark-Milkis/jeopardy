/**
 * Version utility for accessing version information at runtime
 */

let versionData = null;

try {
  versionData = require('./version.json');
} catch (error) {
  // Fallback if version.json doesn't exist
  versionData = {
    version: require('../package.json').version,
    buildMetadata: '',
    fullVersion: require('../package.json').version,
    buildDate: new Date().toISOString(),
    gitSha: 'unknown',
    gitBranch: 'unknown'
  };
}

module.exports = versionData;
