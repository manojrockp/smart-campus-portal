# Smart Campus Portal - Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- PostgreSQL database
- Git

## Installation Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd "Smart Campus Portal with AI-Powered Analytics"
```

### 2. Database Setup
```bash
# Install PostgreSQL and create database
createdb smart_campus

# Update database URL in backend/.env
DATABASE_URL="postgresql://username:password@localhost:5432/smart_campus"
```

### 3. Backend Setup
```bash
cd backend
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Start backend server
npm run dev
```

### 4. AI Services Setup
```bash
cd ai-services
pip install -r requirements.txt

# Start AI services
python app.py
```

### 5. Frontend Setup
```bash
cd frontend
npm install

# Start frontend development server
npm run dev
```

## Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DATABASE_URL="postgresql://username:password@localhost:5432/smart_campus"
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
AI_SERVICE_URL=http://localhost:8000
MAX_FILE_SIZE=10485760
```

## Default Access

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- AI Services: http://localhost:8000

## Default Users

Create users through the registration form or use the following test accounts:

**Admin User:**
- Email: admin@smartcampus.edu
- Password: admin123
- Role: ADMIN

**Faculty User:**
- Email: faculty@smartcampus.edu
- Password: faculty123
- Role: FACULTY

**Student User:**
- Email: student@smartcampus.edu
- Password: student123
- Role: STUDENT

## Features Overview

### Core Modules
1. **Authentication & User Management**
   - JWT-based secure login
   - Role-based access control (Admin, Faculty, Student)

2. **Attendance Management**
   - Real-time attendance marking
   - Attendance percentage tracking
   - Shortage alerts for students

3. **Assignment System**
   - Assignment creation and submission
   - File upload support
   - AI-powered plagiarism detection

4. **Notice Board**
   - Priority-based notices
   - Role-specific targeting
   - Real-time notifications

5. **Chat & Collaboration**
   - One-to-one messaging
   - Real-time communication via WebSockets

6. **AI Analytics Dashboard**
   - Student performance prediction
   - Risk assessment
   - Actionable insights and recommendations

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check database URL in .env file
   - Verify database exists

2. **AI Services Not Working**
   - Check if Python dependencies are installed
   - Ensure AI service is running on port 8000
   - Verify AI_SERVICE_URL in backend .env

3. **File Upload Issues**
   - Create uploads/assignments/ directory in backend
   - Check file size limits
   - Verify file permissions

4. **Socket.io Connection Issues**
   - Ensure backend server is running
   - Check CORS configuration
   - Verify frontend proxy settings

## Development

### Adding New Features
1. Backend: Add routes in `backend/routes/`
2. Frontend: Add components in `frontend/src/components/`
3. Database: Update schema in `database/schema.prisma`
4. AI: Add models in `ai-services/models/`

### Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Deployment

### Production Build
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm start

# AI Services
cd ai-services
python app.py
```

### Environment Setup
- Set NODE_ENV=production
- Use production database
- Configure proper JWT secrets
- Set up SSL certificates
- Configure reverse proxy (nginx)

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check the GitHub issues
4. Contact the development team