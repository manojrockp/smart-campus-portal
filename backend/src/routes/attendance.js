const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Mark attendance (Faculty/Admin only)
router.post('/mark', auth, authorize('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const { courseId, date, attendance } = req.body;

    console.log('Marking attendance:', { courseId, date, attendance });

    // Check if faculty is assigned to this course (skip for admin)
    if (req.user.role === 'FACULTY') {
      const facultyCourse = await prisma.facultyCourse.findFirst({
        where: {
          facultyId: req.user.id,
          courseId: courseId
        }
      });

      if (!facultyCourse) {
        return res.status(403).json({ 
          message: 'Access denied. You are not assigned to teach this course.' 
        });
      }
    }

    // Delete existing attendance for this course and date
    await prisma.attendance.deleteMany({
      where: {
        courseId,
        date: new Date(date)
      }
    });

    // Create new attendance records
    const attendanceRecords = await prisma.attendance.createMany({
      data: attendance.map(({ userId, status }) => ({
        userId,
        courseId,
        date: new Date(date),
        status
      }))
    });

    console.log('Attendance saved:', attendanceRecords.count, 'records');
    res.json({ 
      message: 'Attendance marked successfully', 
      count: attendanceRecords.count
    });
  } catch (error) {
    console.error('Attendance marking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get attendance for student
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId } = req.query;

    // Students can only access their own attendance
    if (req.user.role === 'STUDENT' && req.user.id !== studentId) {
      return res.status(403).json({ message: 'Access denied. You can only view your own attendance.' });
    }

    const whereClause = { userId: studentId };
    if (courseId) whereClause.courseId = courseId;

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        course: { select: { name: true, code: true } }
      },
      orderBy: { date: 'desc' }
    });

    // Calculate attendance percentage
    const totalClasses = attendance.length;
    const presentClasses = attendance.filter(a => a.status === 'PRESENT').length;
    const attendancePercentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

    res.json({
      attendance,
      stats: {
        totalClasses,
        presentClasses,
        absentClasses: totalClasses - presentClasses,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get attendance by course
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date } = req.query;

    const whereClause = { courseId };
    if (date) whereClause.date = new Date(date);

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        user: { select: { firstName: true, lastName: true, studentId: true } }
      },
      orderBy: { date: 'desc' }
    });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get calendar attendance data
router.get('/calendar', auth, async (req, res) => {
  try {
    const { studentId, courseId, month, year } = req.query;
    console.log('Calendar request params:', { studentId, courseId, month, year });
    
    let whereClause = {};
    
    // Only add date filter if month and year are provided
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      whereClause.date = {
        gte: startDate,
        lte: endDate
      };
    }
    
    if (studentId) whereClause.userId = studentId;
    if (courseId) whereClause.courseId = courseId;
    
    console.log('Calendar where clause:', whereClause);
    
    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, studentId: true } },
        course: { select: { id: true, name: true, code: true } }
      },
      orderBy: { date: 'asc' }
    });
    
    console.log('Calendar attendance found:', attendance.length, 'records');
    res.json(attendance);
  } catch (error) {
    console.error('Calendar endpoint error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;