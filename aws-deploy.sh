#!/bin/bash

# AWS Deployment Script for Smart Campus Portal

echo "🚀 Starting AWS deployment..."

# Install AWS CLI if not installed
if ! command -v aws &> /dev/null; then
    echo "Installing AWS CLI..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
fi

# Configure AWS credentials (run once)
echo "Configure AWS credentials:"
aws configure

# Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Create S3 bucket for frontend
BUCKET_NAME="smart-campus-portal-$(date +%s)"
echo "Creating S3 bucket: $BUCKET_NAME"
aws s3 mb s3://$BUCKET_NAME

# Upload frontend to S3
echo "Uploading frontend to S3..."
aws s3 sync frontend/dist/ s3://$BUCKET_NAME --delete

# Enable static website hosting
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html

# Make bucket public
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
    }
  ]
}'

echo "✅ Frontend deployed to: http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"

# Package backend for Elastic Beanstalk
echo "Packaging backend..."
cd backend
zip -r ../backend.zip . -x "node_modules/*" "*.log"
cd ..

echo "📦 Backend packaged as backend.zip"
echo "🎯 Next steps:"
echo "1. Go to AWS Elastic Beanstalk console"
echo "2. Create new application"
echo "3. Upload backend.zip"
echo "4. Set environment variables"

echo "🌟 AWS deployment ready!"