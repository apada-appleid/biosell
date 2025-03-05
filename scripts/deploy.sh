#!/bin/bash

# Deploy script for CentOS server with WHM
# Make sure this file has execute permissions: chmod +x scripts/deploy.sh

# Set the port you want to use permanently
export PORT=3001

# Navigate to project directory (update this path as needed)
# cd /path/to/your/app

# Install dependencies
yarn install --frozen-lockfile

# Build the application
yarn build

# Start the application
yarn start

# Note: For production deployment, you should use a process manager like PM2
# Example PM2 commands:
# pm2 delete biosell-front # Delete existing instance if any
# pm2 start yarn --name "biosell-front" -- start
# pm2 save 