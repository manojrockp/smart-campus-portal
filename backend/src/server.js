const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const enrollmentRoutes = require('./routes/enrollments');
const attendanceRoutes = require('./routes/attendance');
const assignmentRoutes = require('./routes/assignments');
const facultyCoursesRoutes = require('./routes/faculty-courses');
const semesterRoutes = require('./routes/semesters');
const healthRoutes = require('./routes/health');

const noticeRoutes = require('./routes/notices');
const passwordResetRoutes = require('./routes/password-reset');
const leaveRoutes = require('./routes/leaves');
const chatRoutes = require('./routes/chat');
const analyticsRoutes = require('./routes/analytics');
const seedRoutes = require('./routes/seed');
const { runSemesterTransition } = require('./jobs/semesterTransition');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ["https://smart-campus-portal-gamma.vercel.app", /https:\/\/.*\.vercel\.app$/]
      : ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ["https://smart-campus-portal-gamma.vercel.app", "https://smartcampus-two.vercel.app", "https://smartcampus-git-main-manojs-projects-87d0f296.vercel.app", process.env.CORS_ORIGIN, process.env.FRONTEND_URL, /https:\/\/.*--smartcamps\.netlify\.app$/, /https:\/\/.*\.netlify\.app$/, /https:\/\/.*\.vercel\.app$/]
    : ["http://localhost:3000", "http://localhost:5173"],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/faculty-courses', facultyCoursesRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/health', healthRoutes);

app.use('/api/notices', noticeRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/seed', seedRoutes);

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('send-message', (data) => {
    socket.to(data.roomId).emit('receive-message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Health check endpoint - updated for CORS fix
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.status(200).json({
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  
  // Run semester transition check on startup
  runSemesterTransition();
  
  // Schedule semester transition check every day at midnight
  setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      runSemesterTransition();
    }
  }, 60000); // Check every minute
});

module.exports = { app, io };