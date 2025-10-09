# Smart Campus Portal - Production Deployment Guide

## 🚀 Quick Start Deployment

### Prerequisites
- Docker & Docker Compose installed
- Domain name configured (optional)
- SSL certificate (for HTTPS)

### 1. Environment Setup
```bash
# Clone repository
git clone <your-repo-url>
cd smart-campus-portal

# Copy environment file
cp backend/.env.production backend/.env

# Edit environment variables
nano backend/.env
```

### 2. Configure Environment Variables
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@postgres:5432/smart_campus_prod
FRONTEND_URL=https://your-domain.com
JWT_SECRET=your-super-secure-jwt-secret-key
```

### 3. Deploy with Docker
```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### 4. Access Application
- **Frontend**: http://localhost (or your domain)
- **API**: http://localhost/api
- **Admin Panel**: Login with admin@smartcampus.edu / admin123

## 🔧 Manual Deployment Steps

### Step 1: Database Setup
```bash
# Start PostgreSQL
docker run -d \
  --name smart-campus-db \
  -e POSTGRES_DB=smart_campus_prod \
  -e POSTGRES_USER=smart_campus_user \
  -e POSTGRES_PASSWORD=your_secure_password \
  -p 5432:5432 \
  postgres:15-alpine
```

### Step 2: Build Application
```bash
# Build backend
cd backend
npm install
npx prisma generate
npx prisma migrate deploy

# Build frontend
cd ../frontend
npm install
npm run build
```

### Step 3: Start Services
```bash
# Start with PM2
cd backend
npm install -g pm2
pm2 start ecosystem.config.js --env production
```

## 🌐 Cloud Deployment Options

### AWS EC2 Deployment
1. Launch EC2 instance (t3.medium or larger)
2. Install Docker and Docker Compose
3. Configure security groups (ports 80, 443, 22)
4. Run deployment script

### DigitalOcean Droplet
1. Create 4GB RAM droplet
2. Install Docker
3. Clone repository and deploy

### Heroku Deployment
```bash
# Install Heroku CLI
heroku create smart-campus-portal
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
```

## 📊 Monitoring Setup

### Start Monitoring Stack
```bash
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

### Access Monitoring
- **Grafana**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090

## 🔒 Security Checklist

- [ ] Change default admin password
- [ ] Configure SSL certificates
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure backup strategy
- [ ] Set up monitoring alerts

## 📈 Performance Optimization

### Database Optimization
```bash
# Run optimization script
docker exec smart-campus-db psql -U smart_campus_user -d smart_campus_prod -f /optimize.sql
```

### Application Scaling
```bash
# Scale with PM2
pm2 scale smart-campus-api 4  # 4 instances
```

## 🔄 Maintenance

### Backup Database
```bash
docker exec smart-campus-db pg_dump -U smart_campus_user smart_campus_prod > backup.sql
```

### Update Application
```bash
git pull origin main
docker-compose -f docker-compose.prod.yml up --build -d
```

### View Logs
```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f app

# Database logs
docker-compose -f docker-compose.prod.yml logs -f postgres
```

## 🆘 Troubleshooting

### Common Issues

**Database Connection Error:**
```bash
# Check database status
docker-compose -f docker-compose.prod.yml ps postgres

# Check logs
docker-compose -f docker-compose.prod.yml logs postgres
```

**Application Not Starting:**
```bash
# Check application logs
docker-compose -f docker-compose.prod.yml logs app

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

**High Memory Usage:**
```bash
# Monitor resources
docker stats

# Scale down if needed
pm2 scale smart-campus-api 2
```

## 📞 Support

For deployment issues:
1. Check logs first
2. Verify environment variables
3. Ensure database connectivity
4. Check firewall/security groups

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Monitoring setup complete
- [ ] Backup strategy implemented
- [ ] Security measures in place
- [ ] Performance optimization applied
- [ ] Health checks working
- [ ] Load testing completed
- [ ] Documentation updated