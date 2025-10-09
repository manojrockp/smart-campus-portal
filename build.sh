#!/bin/bash

# Smart Campus Portal - Render Build Script
echo "🚀 Building Smart Campus Portal for Render..."

# Set environment
export NODE_ENV=production

# Build Backend
echo "🔨 Building Backend..."
cd backend
npm install
npx prisma generate
echo "✅ Backend build completed"

# Build Frontend
echo "🎨 Building Frontend..."
cd ../frontend
npm install
npm run build
echo "✅ Frontend build completed"

echo "🎉 Build process completed successfully!"
echo "📦 Ready for Render deployment"