# 🚀 Quick Render Deployment Guide

## Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

## Step 2: Deploy on Render

### Database (PostgreSQL)
1. Go to render.com → New → PostgreSQL
2. Name: `smart-campus-db`
3. Plan: Free or Starter
4. Copy DATABASE_URL after creation

### Backend API
1. New → Web Service
2. Connect GitHub repo
3. Settings:
   - Name: `smart-campus-api`
   - Build: `cd backend && npm install && npx prisma generate`
   - Start: `cd backend && npx prisma migrate deploy && npm run seed && npm start`
   - Environment Variables:
     ```
     NODE_ENV=production
     DATABASE_URL=[paste from database]
     JWT_SECRET=your-super-secure-jwt-secret-key
     FRONTEND_URL=https://smart-campus-portal.onrender.com
     ```

### Frontend
1. New → Static Site
2. Connect same repo
3. Settings:
   - Name: `smart-campus-portal`
   - Build: `cd frontend && npm install && npm run build`
   - Publish: `frontend/dist`
   - Environment Variables:
     ```
     VITE_API_URL=https://smart-campus-api.onrender.com
     ```

## Step 3: Test Live Application

**URLs:**
- Frontend: https://smart-campus-portal.onrender.com
- API: https://smart-campus-api.onrender.com

**Test Accounts:**
- Admin: admin@smartcampus.edu / admin123
- Faculty: faculty@smartcampus.edu / faculty123
- Student 1: kushmithabs@gmail.com / U11KT24S0097
- Student 2: deepub@gmail.com / U11KT24S0163

Your Smart Campus Portal is now LIVE! 🌍