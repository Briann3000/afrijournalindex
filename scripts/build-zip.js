const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Creating cPanel Deployment Package (Excluding node_modules, .git, dev locks) ===\n');

const deployDir = path.join(__dirname, '..', 'deploy-staging');
if (fs.existsSync(deployDir)) {
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir, { recursive: true });

function copyRecursive(src, dest, ignorePatterns = []) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);

  for (const pattern of ignorePatterns) {
    if (src.includes(pattern)) return;
  }

  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child), ignorePatterns);
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

const baseDir = path.join(__dirname, '..');
console.log('Copying production .next build artifacts...');
copyRecursive(path.join(baseDir, '.next'), path.join(deployDir, '.next'), ['dev', 'cache']);

console.log('Copying public assets...');
copyRecursive(path.join(baseDir, 'public'), path.join(deployDir, 'public'));

console.log('Copying prisma schema & migrations...');
copyRecursive(path.join(baseDir, 'prisma'), path.join(deployDir, 'prisma'));

console.log('Copying source files & scripts...');
copyRecursive(path.join(baseDir, 'src'), path.join(deployDir, 'src'));
copyRecursive(path.join(baseDir, 'scripts'), path.join(deployDir, 'scripts'), ['build-zip.js', 'verify-zip.js', 'inspect-build.js']);

console.log('Copying manifests & config files...');
const filesToCopy = ['package.json', 'package-lock.json', 'next.config.ts', 'tsconfig.json', 'server.js', 'app.js'];
for (const f of filesToCopy) {
  const p = path.join(baseDir, f);
  if (fs.existsSync(p)) fs.copyFileSync(p, path.join(deployDir, f));
}

console.log('Compressing deploy-package.zip...');
const zipOutput = path.join(baseDir, 'deploy-package.zip');
if (fs.existsSync(zipOutput)) fs.unlinkSync(zipOutput);

execSync(`powershell -Command "Compress-Archive -Path '${deployDir}\\*' -DestinationPath '${zipOutput}' -Force"`, { stdio: 'inherit' });

// Cleanup staging folder
fs.rmSync(deployDir, { recursive: true, force: true });

const sizeMb = (fs.statSync(zipOutput).size / (1024 * 1024)).toFixed(2);
console.log(`\nSuccessfully created deploy-package.zip (${sizeMb} MB) ready for cPanel!`);
