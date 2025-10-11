# 🎨 Render Deployment Guide

## Render Free Tier Benefits
- ✅ **Completely FREE** for 750 hours/month
- ✅ **PostgreSQL database** included
- ✅ **Auto-deploy** from GitHub
- ✅ **Custom domains** supported
- ✅ **Automatic HTTPS**

## Step 1: Create Render Account
1. Go to https://render.com
2. **Sign up with GitHub** (connects repositories)

## Step 2: Deploy Database
1. **New** → **PostgreSQL**
2. **Name**: `smart-campus-db`
3. **Plan**: **Free**
4. **Create Database**
5. **Copy DATABASE_URL** (External Database URL)

## Step 3: Deploy Backend
1. **New** → **Web Service**
2. **Connect GitHub**: `manojrockp/smart-campus-portal`
3. **Settings**:
   - **Name**: `smart-campus-api`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`
   - **Plan**: **Free**

## Step 4: Environment Variables
Add these in your web service:
```
NODE_ENV = production
DATABASE_URL = [paste from step 2]
JWT_SECRET = your-jwt-secret-key
PORT = 10000
```

## Step 5: Deploy Frontend
1. **New** → **Static Site**
2. **Connect same repo**: `manojrockp/smart-campus-portal`
3. **Settings**:
   - **Name**: `smart-campus-portal`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

## Expected Result
- **Backend**: https://smart-campus-api.onrender.com
- **Frontend**: https://smart-campus-portal.onrender.com
- **Cost**: **FREE** (with sleep after 15min inactivity)

Ready to deploy! 🚀