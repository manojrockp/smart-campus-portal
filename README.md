# Smart Campus Portal with AI-Powered Analytics

A comprehensive college/university management system with AI-powered analytics for student performance prediction and academic insights.

## Features

- **Multi-Role Authentication**: Admin, Faculty, Student access
- **Attendance Management**: Real-time marking and tracking
- **Assignment System**: Upload, submit, and AI plagiarism detection
- **Notice Board**: Real-time notifications
- **Chat System**: One-to-one and group messaging
- **AI Analytics**: Performance prediction and risk assessment

## Tech Stack

- **Frontend**: React.js + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL + Prisma ORM
- **AI/ML**: Python + Scikit-learn + TensorFlow
- **Real-time**: Socket.io
- **Authentication**: JWT

## Quick Start

1. **Backend Setup**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **AI Services**:
   ```bash
   cd ai-services
   pip install -r requirements.txt
   python app.py
   ```

## Project Structure

```
├── frontend/          # React.js application
├── backend/           # Node.js API server
├── ai-services/       # Python ML services
├── database/          # Database schemas and migrations
└── docs/             # Documentation and diagrams
```