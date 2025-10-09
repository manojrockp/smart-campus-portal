#!/bin/bash

# Smart Campus Portal Deployment Script
echo "🚀 Starting Smart Campus Portal Deployment..."

# Set environment
export NODE_ENV=production

# Create necessary directories
mkdir -p logs uploads nginx/ssl

# Stop existing containers
echo "📦 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 30

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
docker-compose -f docker-compose.prod.yml exec app npx prisma generate

# Seed initial data (optional)
echo "🌱 Seeding initial data..."
docker-compose -f docker-compose.prod.yml exec app npm run seed

# Check service health
echo "🏥 Checking service health..."
sleep 10
curl -f http://localhost:5000/health || echo "⚠️ Health check failed"

echo "✅ Deployment completed!"
echo "🌐 Application available at: http://localhost"
echo "📊 API available at: http://localhost/api"

# Show running containers
docker-compose -f docker-compose.prod.yml ps