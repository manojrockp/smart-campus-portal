# Smart Campus Portal - Render Deployment Guide

## 🚀 Live Deployment on Render

### Step 1: Prepare Repository
1. Push your code to GitHub repository
2. Ensure all configuration files are committed:
   - `render.yaml`
   - `backend/.env.production`
   - `frontend/.env.production`

### Step 2: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub account
3. Connect your repository

### Step 3: Deploy Database
1. Go to Render Dashboard
2. Click "New" → "PostgreSQL"
3. Configure:
   - **Name**: `smart-campus-db`
   - **Database**: `smart_campus_prod`
   - **User**: `smart_campus_user`
   - **Region**: Choose closest to your users
   - **Plan**: Free (for testing) or Starter ($7/month)

### Step 4: Deploy Backend API
1. Click "New" → "Web Service"
2. Connect GitHub repository
3. Configure:
   - **Name**: `smart-campus-api`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install && npx prisma generate`
   - **Start Command**: `cd backend && npx prisma migrate deploy && npm run seed && npm start`
   - **Plan**: Free (for testing) or Starter ($7/month)

4. Add Environment Variables:
   ```
   NODE_ENV=production
   DATABASE_URL=[Copy from PostgreSQL service]
   JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters
   FRONTEND_URL=https://smart-campus-portal.onrender.com
   PORT=5000
   ```

### Step 5: Deploy Frontend
1. Click "New" → "Static Site"
2. Connect same GitHub repository
3. Configure:
   - **Name**: `smart-campus-portal`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`

4. Add Environment Variables:
   ```
   VITE_API_URL=https://smart-campus-api.onrender.com
   ```

### Step 6: Configure Custom Domain (Optional)
1. In frontend service settings
2. Add custom domain
3. Configure DNS records

## 🔗 Live Application URLs

After deployment, your application will be available at:

- **Frontend**: https://smart-campus-portal.onrender.com
- **Backend API**: https://smart-campus-api.onrender.com
- **Database**: Internal connection via DATABASE_URL

## 👥 Default User Accounts

The system will automatically create these accounts:

### 🔑 Admin Account
- **Email**: admin@smartcampus.edu
- **Password**: admin123
- **Role**: Administrator
- **Access**: Full system control

### 👨🏫 Faculty Account
- **Email**: faculty@smartcampus.edu
- **Password**: faculty123
- **Role**: Faculty
- **Access**: Course management, attendance marking

### 👨🎓 Student Accounts
Test student accounts are created with sample data:
- **Email**: kushmithabs@gmail.com
- **Password**: U11KT24S0097
- **Role**: Student (5 semesters of data)

- **Email**: deepub@gmail.com
- **Password**: U11KT24S0163
- **Role**: Student (4 semesters of data)

## 🎯 User Testing Scenarios

### Admin Testing
1. Login with admin credentials
2. Navigate to "Students" → View batch-wise organization
3. Go to "Semester History" → See all students' progress
4. Create new semesters in "Semesters" section
5. Manage faculty assignments

### Faculty Testing
1. Login with faculty credentials
2. Mark attendance for classes
3. View "Semester History" for student monitoring
4. Access analytics and reports
5. Manage course assignments

### Student Testing
1. Login with student credentials
2. View personal dashboard with semester progression
3. Check "Semesters" page for detailed history
4. View attendance statistics
5. Apply for leaves

## 🔧 Troubleshooting

### Common Issues

**Database Connection Error:**
- Check DATABASE_URL environment variable
- Ensure PostgreSQL service is running
- Verify database credentials

**API Not Responding:**
- Check backend service logs in Render dashboard
- Verify environment variables are set
- Ensure build completed successfully

**Frontend Not Loading:**
- Check if VITE_API_URL is correctly set
- Verify build completed without errors
- Check browser console for errors

### Monitoring
- Use Render dashboard to monitor service health
- Check logs for any errors
- Monitor resource usage

## 📈 Scaling for Production

### Performance Optimization
1. Upgrade to paid plans for better performance
2. Enable auto-scaling
3. Add Redis for session management
4. Implement CDN for static assets

### Security Enhancements
1. Change default passwords immediately
2. Set up proper JWT secrets
3. Configure rate limiting
4. Enable HTTPS (automatic on Render)

## 💰 Cost Estimation

### Free Tier (Testing)
- PostgreSQL: Free (1GB storage, 1 month)
- Backend: Free (750 hours/month)
- Frontend: Free (100GB bandwidth)
- **Total**: $0/month

### Production Tier
- PostgreSQL: $7/month (Starter)
- Backend: $7/month (Starter)
- Frontend: Free (Static site)
- **Total**: $14/month

## 🚀 Go Live Checklist

- [ ] Repository pushed to GitHub
- [ ] Database service deployed and running
- [ ] Backend API deployed with correct environment variables
- [ ] Frontend deployed with API URL configured
- [ ] Default admin account accessible
- [ ] Sample data seeded successfully
- [ ] All three user types can login
- [ ] Core features working (attendance, semester management)
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (automatic)

## 📞 Support

For deployment issues:
1. Check Render service logs
2. Verify environment variables
3. Test API endpoints directly
4. Check database connectivity

Your Smart Campus Portal is now live and accessible to users worldwide! 🌍