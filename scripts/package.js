import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const releaseDir = path.resolve(rootDir, 'release');

// 1. Read package.json version
const pkg = JSON.parse(fs.readFileSync(path.resolve(rootDir, 'package.json'), 'utf-8'));
const version = pkg.version || '1.0.0';

console.log(`📦 Packaging Pagewright v${version} for release...`);

// 2. Ensure dist/ exists
if (!fs.existsSync(distDir) || fs.readdirSync(distDir).length === 0) {
  console.log('⚡ Building project with Vite first...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
}

// 3. Ensure release/ output directory exists
if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

const zipName = `pagewright-v${version}.zip`;
const zipPath = path.resolve(releaseDir, zipName);

// 4. Remove previous zip if present
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

// 5. Create zip file using native zip command
try {
  execSync(`zip -r "${zipPath}" . -x "*.DS_Store"`, { cwd: distDir, stdio: 'ignore' });
  const stats = fs.statSync(zipPath);
  const sizeKb = (stats.size / 1024).toFixed(1);
  console.log(`✅ Successfully generated release bundle!`);
  console.log(`   File: release/${zipName}`);
  console.log(`   Size: ${sizeKb} KB`);
  console.log(`   Ready for Chrome Web Store upload & GitHub Releases.`);
} catch (error) {
  console.error('❌ Failed to create zip bundle:', error.message);
  process.exit(1);
}
