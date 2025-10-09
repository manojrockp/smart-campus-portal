#!/bin/bash

echo "🔥 Deploying Smart Campus Portal to Firebase..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

# Install function dependencies
echo "📦 Installing function dependencies..."
cd functions
npm install
cd ..

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
firebase deploy

echo "✅ Deployment complete!"
echo "🌐 Your app is live at: https://your-project-id.web.app"