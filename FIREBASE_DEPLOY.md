# 🔥 Firebase Deployment Guide

## Firebase Free Tier Benefits
- **Hosting**: 10GB storage, 360MB/day transfer
- **Firestore**: 1GB storage, 50K reads/day, 20K writes/day
- **Functions**: 2M invocations/month, 400K GB-seconds
- **Authentication**: Unlimited users
- **No sleep**: Always available (unlike Render free tier)

## Step 1: Setup Firebase Project

1. Go to https://console.firebase.google.com
2. Create new project: `smart-campus-portal`
3. Enable these services:
   - **Firestore Database** (Native mode)
   - **Authentication** (Email/Password)
   - **Hosting**
   - **Functions**

## Step 2: Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase init
```

Select:
- ✅ Firestore
- ✅ Functions  
- ✅ Hosting
- ✅ Storage

## Step 3: Deploy

```bash
# Build frontend
cd frontend && npm run build

# Deploy everything
firebase deploy
```

## URLs After Deployment
- **Frontend**: https://smart-campus-portal.web.app
- **API**: https://us-central1-smart-campus-portal.cloudfunctions.net/api

## Free Tier Limits
- **Database**: 1GB storage, 50K reads/day
- **Hosting**: 10GB storage, 360MB/day
- **Functions**: 2M invocations/month
- **Always on**: No sleep issues!

Perfect for your Smart Campus Portal! 🚀