const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Zipping ONLY .next Folder (Excluding dev & cache) ===\n');

const baseDir = path.join(__dirname, '..');
const nextDir = path.join(baseDir, '.next');
const stagingDir = path.join(baseDir, 'next-staging', '.next');

// Clean staging
if (fs.existsSync(path.join(baseDir, 'next-staging'))) {
  fs.rmSync(path.join(baseDir, 'next-staging'), { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

function copyRecursive(src, dest, ignoreList = []) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);

  for (const item of ignoreList) {
    if (src.endsWith(path.sep + item) || src.includes(path.sep + item + path.sep)) {
      return;
    }
  }

  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child), ignoreList);
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('Copying production build files from .next...');
copyRecursive(nextDir, stagingDir, ['cache', 'dev', 'lock']);

const zipOutput = path.join(baseDir, 'next-update.zip');
if (fs.existsSync(zipOutput)) fs.unlinkSync(zipOutput);

console.log('Compressing into next-update.zip...');
execSync(`powershell -Command "Compress-Archive -Path '${path.join(baseDir, 'next-staging')}\\*' -DestinationPath '${zipOutput}' -Force"`, { stdio: 'inherit' });

// Remove staging
fs.rmSync(path.join(baseDir, 'next-staging'), { recursive: true, force: true });

const sizeMb = (fs.statSync(zipOutput).size / (1024 * 1024)).toFixed(2);
console.log(`\nDone! Successfully created next-update.zip (${sizeMb} MB).`);
