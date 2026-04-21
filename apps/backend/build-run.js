import { execSync } from 'child_process';
import * as path from 'path';

const cwd = '/workspace/apps/backend';
console.log('Building...');

try {
  execSync('npx nest build', { cwd, stdio: 'inherit' });
  console.log('Build complete');
} catch(e) {
  console.error('Build failed:', e);
  process.exit(1);
}