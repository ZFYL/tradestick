// Simple build script that doesn't rely on TypeScript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure the dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Run Vite build
try {
  console.log('Building with Vite...');
  execSync('npx vite build', { stdio: 'inherit', cwd: __dirname });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
