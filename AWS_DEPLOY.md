# ☁️ AWS Complete Deployment Guide

## AWS Free Tier Services (12 months free)

### 1. Database - RDS PostgreSQL
- **Free**: 750 hours/month, 20GB storage
- **Setup**: RDS → Create database → PostgreSQL → Free tier

### 2. Backend API - Elastic Beanstalk
- **Free**: 750 hours/month EC2 t2.micro
- **Setup**: Upload Node.js app zip file

### 3. Frontend - S3 + CloudFront
- **Free**: 5GB storage, 20K GET requests
- **Setup**: S3 bucket + CloudFront distribution

### 4. File Storage - S3
- **Free**: 5GB storage, 20K GET/2K PUT requests
- **Perfect for**: Assignment uploads, documents

## Quick Deploy Steps

### Step 1: Create AWS Account
1. Go to https://aws.amazon.com/free
2. Sign up for free tier account
3. Verify with credit card (won't be charged)

### Step 2: Deploy Database
```bash
# RDS PostgreSQL Free Tier
- Engine: PostgreSQL 13+
- Instance: db.t3.micro (free tier)
- Storage: 20GB (free tier)
```

### Step 3: Deploy Backend
```bash
# Elastic Beanstalk
- Platform: Node.js
- Upload: backend.zip
- Environment: Single instance (free tier)
```

### Step 4: Deploy Frontend
```bash
# S3 + CloudFront
- Build: npm run build
- Upload: dist/ folder to S3
- Enable: Static website hosting
```

## Benefits
- ✅ 12 months completely free
- ✅ Professional AWS infrastructure
- ✅ Auto-scaling when needed
- ✅ Global CDN (CloudFront)
- ✅ Integrated file storage (S3)

Ready to deploy on AWS! 🚀