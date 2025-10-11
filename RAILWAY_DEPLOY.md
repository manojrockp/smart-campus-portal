# 🚂 Railway Deployment Guide

## Step 1: Create Railway Account
1. Go to https://railway.app
2. Click **"Start a New Project"**
3. **Sign up with GitHub** (connects automatically)

## Step 2: Deploy Backend
1. **New Project** → **Deploy from GitHub repo**
2. **Select repository**: `manojrockp/smart-campus-portal`
3. **Root Directory**: `/backend`
4. **Auto-deploy**: Enable (deploys on every git push)

## Step 3: Add PostgreSQL Database
1. In your project dashboard
2. **+ New** → **Database** → **Add PostgreSQL**
3. Railway will create database automatically

## Step 4: Configure Environment Variables
In your backend service settings, add:
```
DATABASE_URL = ${{Postgres.DATABASE_URL}}
NODE_ENV = production
JWT_SECRET = ae1a01e58f58bcc952f60eb6e5b467af89afaa5a1b87c411bbdb1e7ed09af7f3875b9a78f1cd0a822f1ec2ca60421be88cd8059791720e116882f67ba6f32557
PORT = ${{PORT}}
FRONTEND_URL = https://your-frontend-domain.com
```

## Step 5: Deploy Frontend (Separate)
1. **New Project** → **Deploy from GitHub repo**
2. **Select same repository**: `manojrockp/smart-campus-portal`
3. **Root Directory**: `/frontend`
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`

## Expected Costs
- **Backend**: ~$5/month
- **Database**: ~$5/month
- **Frontend**: ~$0-5/month
- **Total**: ~$10-15/month

## Benefits
- ✅ Simple deployment
- ✅ Auto-scaling
- ✅ Built-in database
- ✅ Custom domains
- ✅ Automatic HTTPS

Ready to deploy! 🚀