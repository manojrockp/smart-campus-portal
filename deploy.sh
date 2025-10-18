#!/bin/bash

# Smart Campus Portal - Production Deployment Script

set -e

echo "🚀 Starting Smart Campus Portal deployment..."

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is required"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET environment variable is required"
    exit 1
fi

# Build and push Docker images
echo "📦 Building Docker images..."

# Build backend
docker build -t smart-campus-backend:latest ./backend
docker tag smart-campus-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/smart-campus-backend:latest

# Build frontend
docker build -t smart-campus-frontend:latest ./frontend
docker tag smart-campus-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/smart-campus-frontend:latest

# Login to ECR
echo "🔐 Logging into AWS ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Push images
echo "⬆️ Pushing images to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/smart-campus-backend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/smart-campus-frontend:latest

# Deploy with Terraform
echo "🏗️ Deploying infrastructure with Terraform..."
cd terraform
terraform init
terraform plan
terraform apply -auto-approve

echo "✅ Deployment completed successfully!"
echo "🌐 Your Smart Campus Portal is now live!"