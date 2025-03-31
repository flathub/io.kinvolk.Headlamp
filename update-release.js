#!/usr/bin/env node
const fs = require('fs');
const {execSync} = require('child_process');
const fetch = require('node-fetch');

const HEADLAMP_SOURCE = 'headlamp-source.json';
const APPDATA = 'io.kinvolk.Headlamp.appdata.xml';

const arches = {
  'x86_64': 'x64',
  'aarch64': 'arm64',
  // We will add these when we get to test them.
  // 'arm': 'armv7l',
}

const sourceFormat = {
  type: 'archive',
  url: '',
  sha256: '',
  dest: 'headlamp',
};

async function fetchGithubReleaseInfo(tag) {
  const res = await fetch(`https://api.github.com/repos/headlamp-k8s/headlamp/releases/tags/${tag}`)
  return await res.json();
}

async function getChecksums(checksumsUrl) {
  const res = await fetch(checksumsUrl)
  const checksums = await res.text();
  const checksumMap = {};

  for (const line of checksums.split('\n')) {
    const [checksum, filename] = line.split('  ');

    if (!filename) {
      continue;
    }

    for (const arch in arches) {
      const flatpakArch = arches[arch];
      if (filename.includes(`linux-${flatpakArch}.tar.gz`)) {
        checksumMap[arch] = [checksum, filename];
      }
    }
  };

  return checksumMap;
}

function updateAppData(wantedVersion, publishDate) {
  const currentAppData = fs.readFileSync(APPDATA, 'utf8');

  const versionWithoutV = wantedVersion.slice(1);

  // Check if the version is already in the file.
  const releaseRegex = new RegExp(`<release.+version="${versionWithoutV}".*`);
  if (currentAppData.match(releaseRegex)) {
    console.log(`No changes needed in ${APPDATA}`);
    process.exit(0);
  }

  const newAppData = currentAppData.replace(/<releases>/, `<releases>\n    <release version="${versionWithoutV}" date="${publishDate}" />`);

  fs.writeFileSync(APPDATA, newAppData);
  console.log(`Updated ${APPDATA} to ${wantedVersion}`);
}

async function updateReleaseInfo(wantedVersion) {
  const release = await fetchGithubReleaseInfo(wantedVersion);
  const checksums = release.assets.find(v => v.name === 'checksums.txt')

  const archChecksums = await getChecksums(checksums.browser_download_url);
  const sources = [];

  for (const arch in archChecksums) {
    const [checksum, filename] = archChecksums[arch];
    const assetDownloadURL = release.assets.find(v => v.name === filename).browser_download_url
    sources.push({
      ...sourceFormat,
      url: assetDownloadURL,
      sha256: checksum,
      'only-arches': [arch],
    });
  }

  const currentSources = fs.readFileSync(HEADLAMP_SOURCE, 'utf8');

  const newSources = JSON.stringify(sources, null, 2);

  if (currentSources === newSources) {
    console.log(`No changes needed in ${HEADLAMP_SOURCE}`);
  } else {
    fs.writeFileSync('headlamp-source.json', newSources);
    console.log(`Updated ${HEADLAMP_SOURCE} to ${wantedVersion}`);
  }

  const publishDate = release.published_at.split('T')[0];

  updateAppData(wantedVersion, publishDate);
}

let wantedVersion = process.argv[2]

if (!wantedVersion) {
  console.error(`Usage: ${process.argv.slice(0, 2).join(' ')} VERSION`);
  console.error(' VERSION\t The version of Headlamp to update to (with the v prefix)');
  process.exit(1);
}

if (!wantedVersion.startsWith('v')) {
  console.log(`Version should start with a v. Adding it for you: ${wantedVersion} -> v${wantedVersion}`);
  wantedVersion = `v${wantedVersion}`;
}

updateReleaseInfo(wantedVersion);