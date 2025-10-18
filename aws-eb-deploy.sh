#!/bin/bash

# AWS Elastic Beanstalk Deployment Script

echo "🚀 Preparing Elastic Beanstalk deployment..."

# Create deployment package
cd backend
zip -r ../smart-campus-backend.zip . -x "node_modules/*" "*.git*" "*.env*"

echo "✅ Backend package created: smart-campus-backend.zip"
echo ""
echo "📋 Next Steps:"
echo "1. Go to AWS Console → Elastic Beanstalk"
echo "2. Create New Application → 'Smart Campus Portal'"
echo "3. Create Environment → Web server environment"
echo "4. Platform: Node.js"
echo "5. Upload: smart-campus-backend.zip"
echo "6. Instance type: t3.micro (free tier)"
echo ""
echo "🔧 Environment Variables to add:"
echo "- NODE_ENV=production"
echo "- DATABASE_URL=your-rds-postgresql-url"
echo "- JWT_SECRET=your-jwt-secret"
echo ""
echo "Ready for deployment! 🎉"