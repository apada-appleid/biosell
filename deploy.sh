#!/bin/bash

cd /shopgram/shopgram-front || exit

echo "📥 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
yarn install

echo "⚙️ Building Next.js app..."
yarn run build

echo "🚀 Restarting app with PM2..."
pm2 restart shopgram-front || pm2 start npm --name "shopgram-front" -- start

echo "✅ Deployment finished!"
