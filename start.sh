# #!/bin/bash

# # Exit on any error
# set -e

# echo "Starting deployment script..."
# echo "Current directory: $(pwd)"
# echo "Node version: $(node --version)"
# echo "NPM version: $(npm --version)"

# # Ensure src directory exists
# if [ ! -d "src" ]; then
#   echo "Error: src directory not found"
#   echo "Contents of current directory:"
#   ls -la
#   exit 1
# fi

# # Ensure app.js exists in src
# if [ ! -f "src/app.js" ]; then
#   echo "Error: src/app.js not found"
#   echo "Contents of src directory:"
#   ls -la src
#   exit 1
# fi

# # Ensure required environment variables are set
# if [ -z "$NODE_ENV" ]; then
#   echo "Warning: NODE_ENV not set, defaulting to production"
#   export NODE_ENV=production
# fi

# echo "Starting application from src/app.js..."
# exec node src/app.js 