#!/usr/bin/env bash
# Render build script for backend (non-Docker)

set -o errexit

echo "🔧 Installing dependencies..."
npm install

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "✅ Build completed successfully"