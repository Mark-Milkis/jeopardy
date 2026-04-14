#!/usr/bin/env node
/**
 * Synchronizes version numbers between root and client package.json files.
 * Can set version from git SHA or semantic version.
 * 
 * Usage:
 *   node scripts/sync-version.js                    # sync current version
 *   node scripts/sync-version.js --git-sha          # use git SHA
 *   node scripts/sync-version.js --version 2.1.0    # set specific version
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_PKG_PATH = path.join(__dirname, '..', 'package.json');
const CLIENT_PKG_PATH = path.join(__dirname, '..', 'client', 'src', 'package.json');

function getGitSha() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error('Failed to get git SHA:', error.message);
    return 'unknown';
  }
}

function getGitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

function readPackageJson(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function writePackageJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function syncVersion(options = {}) {
  const rootPkg = readPackageJson(ROOT_PKG_PATH);
  const clientPkg = readPackageJson(CLIENT_PKG_PATH);

  let newVersion;
  let buildMetadata = '';

  if (options.gitSha) {
    // For development builds: base-version+sha.branch
    const baseVersion = rootPkg.version;
    const sha = getGitSha();
    const branch = getGitBranch();
    newVersion = baseVersion;
    buildMetadata = `+${sha}.${branch}`;
    console.log(`Setting version to development build: ${newVersion}${buildMetadata}`);
  } else if (options.version) {
    // Explicit version provided
    newVersion = options.version;
    console.log(`Setting version to: ${newVersion}`);
  } else {
    // Sync client to root version
    newVersion = rootPkg.version;
    console.log(`Syncing version to: ${newVersion}`);
  }

  // Update root package.json
  rootPkg.version = newVersion;
  if (buildMetadata) {
    rootPkg.buildMetadata = buildMetadata;
  } else {
    delete rootPkg.buildMetadata;
  }
  writePackageJson(ROOT_PKG_PATH, rootPkg);

  // Update client package.json
  clientPkg.version = newVersion;
  if (buildMetadata) {
    clientPkg.buildMetadata = buildMetadata;
  } else {
    delete clientPkg.buildMetadata;
  }
  writePackageJson(CLIENT_PKG_PATH, clientPkg);

  console.log(`✓ Root package.json: ${newVersion}${buildMetadata}`);
  console.log(`✓ Client package.json: ${newVersion}${buildMetadata}`);

  // Generate version file for runtime access
  generateVersionFile(newVersion, buildMetadata);
}

function generateVersionFile(version, buildMetadata = '') {
  const versionData = {
    version,
    buildMetadata,
    fullVersion: version + buildMetadata,
    buildDate: new Date().toISOString(),
    gitSha: getGitSha(),
    gitBranch: getGitBranch()
  };

  // For backend
  const serverVersionPath = path.join(__dirname, '..', 'server', 'version.json');
  fs.writeFileSync(serverVersionPath, JSON.stringify(versionData, null, 2) + '\n');

  // For frontend
  const clientVersionPath = path.join(__dirname, '..', 'client', 'src', 'version.json');
  fs.writeFileSync(clientVersionPath, JSON.stringify(versionData, null, 2) + '\n');

  console.log(`✓ Generated version files`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--git-sha') {
    options.gitSha = true;
  } else if (args[i] === '--version' && args[i + 1]) {
    options.version = args[i + 1];
    i++;
  }
}

syncVersion(options);
