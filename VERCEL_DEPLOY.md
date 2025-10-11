# ▲ Vercel Deployment Guide

## Vercel Benefits
- ✅ **Completely FREE** for hobby projects
- ✅ **Serverless functions** for backend
- ✅ **PostgreSQL database** via Vercel Postgres
- ✅ **Auto-deploy** from GitHub
- ✅ **No sleep issues**
- ✅ **Better Prisma support**

## Step 1: Deploy to Vercel
1. Go to https://vercel.com
2. **Sign up with GitHub**
3. **Import Project** → Select `manojrockp/smart-campus-portal`
4. **Framework Preset**: Other
5. **Root Directory**: Leave empty (/)

## Step 2: Add Vercel Postgres
1. In your Vercel dashboard
2. **Storage** tab → **Create Database**
3. **Postgres** → **Continue**
4. **Create** → Copy connection string

## Step 3: Environment Variables
In Vercel project settings → Environment Variables:
```
NODE_ENV = production
DATABASE_URL = [paste from Vercel Postgres]
JWT_SECRET = your-jwt-secret-key
```

## Step 4: Configure Build
Create `vercel.json` in root:
```json
{
  "builds": [
    {
      "src": "backend/src/server.js",
      "use": "@vercel/node"
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "backend/src/server.js" },
    { "src": "/(.*)", "dest": "frontend/dist/$1" }
  ]
}
```

## Expected Result
- **Full-stack app**: https://your-project.vercel.app
- **API**: https://your-project.vercel.app/api
- **Cost**: **FREE**

Much better than Render! 🚀