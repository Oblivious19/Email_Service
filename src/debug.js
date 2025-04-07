import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Debug script running...');
console.log('Current directory:', process.cwd());
console.log('Script directory:', __dirname);

// List files in current directory
console.log('\nFiles in current directory:');
try {
  const files = fs.readdirSync(process.cwd());
  files.forEach(file => {
    const stats = fs.statSync(path.join(process.cwd(), file));
    console.log(`${file} - ${stats.isDirectory() ? 'Directory' : 'File'}`);
  });
} catch (error) {
  console.error('Error listing files:', error);
}

// List files in src directory
console.log('\nFiles in src directory:');
try {
  const srcPath = path.join(process.cwd(), 'src');
  const files = fs.readdirSync(srcPath);
  files.forEach(file => {
    const stats = fs.statSync(path.join(srcPath, file));
    console.log(`${file} - ${stats.isDirectory() ? 'Directory' : 'File'}`);
  });
} catch (error) {
  console.error('Error listing src files:', error);
}

// Check if app.js exists
const appPath = path.join(process.cwd(), 'src', 'app.js');
console.log('\nChecking if app.js exists:', appPath);
try {
  const exists = fs.existsSync(appPath);
  console.log(`app.js exists: ${exists}`);
  if (exists) {
    const stats = fs.statSync(appPath);
    console.log(`app.js size: ${stats.size} bytes`);
    console.log(`app.js last modified: ${stats.mtime}`);
  }
} catch (error) {
  console.error('Error checking app.js:', error);
}

console.log('\nDebug script completed.'); 