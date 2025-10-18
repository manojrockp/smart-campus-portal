# Smart Campus Portal - Production Deployment Guide

## Prerequisites

### 1. MongoDB Atlas Setup
1. Create MongoDB Atlas account
2. Create a new cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/smart_campus`
4. Whitelist your server IPs

### 2. AWS Setup
1. Create AWS account
2. Install AWS CLI: `aws configure`
3. Create ECR repositories:
   ```bash
   aws ecr create-repository --repository-name smart-campus-backend
   aws ecr create-repository --repository-name smart-campus-frontend
   ```

### 3. Environment Variables
Create `.env.production` files with:

**Backend (.env.production):**
```env
NODE_ENV=production
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/smart_campus
JWT_SECRET=your_super_secure_jwt_secret_key_here
CORS_ORIGIN=https://your-domain.com
PORT=5000
```

**Frontend (.env.production):**
```env
VITE_API_URL=https://your-api-domain.com/api
VITE_SOCKET_URL=https://your-api-domain.com
```

## Deployment Steps

### 1. Database Setup
```bash
cd backend
npm install
npx prisma generate
npm run seed
```

### 2. Local Testing
```bash
# Test backend
cd backend
npm run start

# Test frontend
cd frontend
npm run build
npm run preview
```

### 3. AWS Deployment

#### Option A: Using Docker Compose
```bash
# Set environment variables
export DATABASE_URL="your_mongodb_url"
export JWT_SECRET="your_jwt_secret"
export CORS_ORIGIN="https://your-domain.com"

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

#### Option B: Using AWS ECS
```bash
# Set AWS variables
export AWS_ACCOUNT_ID=123456789012
export AWS_REGION=us-east-1

# Run deployment script
chmod +x deploy.sh
./deploy.sh
```

#### Option C: Using Terraform
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## Production Checklist

### Security
- [ ] Change default admin password
- [ ] Set strong JWT secret
- [ ] Configure CORS properly
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules

### Performance
- [ ] Enable MongoDB connection pooling
- [ ] Configure Redis for sessions
- [ ] Set up CDN for static assets
- [ ] Enable gzip compression

### Monitoring
- [ ] Set up CloudWatch logs
- [ ] Configure health checks
- [ ] Set up error tracking
- [ ] Monitor database performance

### Backup
- [ ] Configure MongoDB Atlas backups
- [ ] Set up automated snapshots
- [ ] Test restore procedures

## Default Credentials

**Admin Login:**
- Email: `admin@smartcampus.edu`
- Password: `admin123`

⚠️ **IMPORTANT:** Change the admin password immediately after first login!

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MongoDB Atlas connection string
   - Verify IP whitelist settings
   - Ensure network access is configured

2. **CORS Errors**
   - Update CORS_ORIGIN in backend .env
   - Check frontend API URL configuration

3. **Build Failures**
   - Ensure Node.js version >= 18
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall

### Health Checks
- Backend: `https://your-api-domain.com/health`
- Frontend: `https://your-domain.com`

## Scaling

### Horizontal Scaling
- Use AWS ECS with auto-scaling
- Configure load balancer
- Set up multiple availability zones

### Database Scaling
- MongoDB Atlas auto-scaling
- Read replicas for read-heavy workloads
- Sharding for large datasets

## Support

For production support:
- Check logs: `docker logs container_name`
- Monitor metrics in AWS CloudWatch
- Review MongoDB Atlas monitoring

## Version Information
- Node.js: >= 18.0.0
- MongoDB: >= 5.0
- Docker: >= 20.0
- AWS CLI: >= 2.0