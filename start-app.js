/**
 * Custom start script that fixes the gopd module issue before starting the app
 */
const { execSync } = require('child_process');
const path = require('path');

console.log('Running fix-gopd script...');
try {
  // Run the fix script first
  require('./fix-gopd.js');
  
  console.log('Starting application...');
  
  // Run the actual app based on its location (either in root or src directory)
  try {
    // Try to start from src directory first
    execSync('node src/app.js', { stdio: 'inherit' });
  } catch (srcError) {
    console.log('Failed to start from src directory, trying root directory...');
    try {
      // If that fails, try the root directory
      execSync('node app.js', { stdio: 'inherit' });
    } catch (rootError) {
      console.error('Failed to start application from either location');
      console.error(rootError);
      process.exit(1);
    }
  }
} catch (error) {
  console.error('Error during startup:', error);
  process.exit(1);
} 