const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Import your existing routes
const authRoutes = require('../backend/src/routes/auth');
const userRoutes = require('../backend/src/routes/users');
const courseRoutes = require('../backend/src/routes/courses');
const enrollmentRoutes = require('../backend/src/routes/enrollments');
const attendanceRoutes = require('../backend/src/routes/attendance');
const noticeRoutes = require('../backend/src/routes/notices');
const chatRoutes = require('../backend/src/routes/chat');
const analyticsRoutes = require('../backend/src/routes/analytics');
const facultyCoursesRoutes = require('../backend/src/routes/faculty-courses');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/courses', courseRoutes);
app.use('/enrollments', enrollmentRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/notices', noticeRoutes);
app.use('/chat', chatRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/faculty-courses', facultyCoursesRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);