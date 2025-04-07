/**
 * This script fixes the gopd module's file casing issue
 */
const fs = require('fs');
const path = require('path');

// Check if gopd directory exists
const gopdPath = path.join(process.cwd(), 'node_modules', 'gopd');
const gopdIndexPath = path.join(gopdPath, 'index.js');

if (fs.existsSync(gopdPath)) {
  console.log('Found gopd module directory');
  
  // Read the content of index.js to see what it's trying to require
  if (fs.existsSync(gopdIndexPath)) {
    const content = fs.readFileSync(gopdIndexPath, 'utf8');
    console.log('Current index.js content:', content);

    // Modify the content to use the correct casing
    const updatedContent = content.replace("require('./gOPD')", "require('./gopd')");
    fs.writeFileSync(gopdIndexPath, updatedContent);
    console.log('Updated index.js to use correct casing');
    
    // Copy the gOPD.js file to gopd.js if it doesn't exist
    const gopdJsPath = path.join(gopdPath, 'gopd.js');
    const gOPDJsPath = path.join(gopdPath, 'gOPD.js');
    
    if (fs.existsSync(gOPDJsPath) && !fs.existsSync(gopdJsPath)) {
      fs.copyFileSync(gOPDJsPath, gopdJsPath);
      console.log('Created lowercase gopd.js file from gOPD.js');
    }
  } else {
    console.log('Could not find index.js in gopd module');
  }
} else {
  console.log('Could not find gopd module directory');
}

console.log('Fix script completed'); 