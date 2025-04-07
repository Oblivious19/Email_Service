#!/bin/bash

echo "Starting deployment script..."

# Run the debug script
echo "Running debug script..."
node src/debug.js

# Try to run the main application
echo "Attempting to run the main application..."
if [ -f "src/app.js" ]; then
  echo "Found app.js in src directory, running it..."
  node src/app.js
elif [ -f "app.js" ]; then
  echo "Found app.js in root directory, running it..."
  node app.js
else
  echo "Could not find app.js in either src or root directory."
  echo "Listing files in current directory:"
  ls -la
  echo "Listing files in src directory (if it exists):"
  if [ -d "src" ]; then
    ls -la src
  else
    echo "src directory does not exist."
  fi
  exit 1
fi 