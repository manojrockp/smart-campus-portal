const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Mark attendance (Faculty only)
router.post('/mark', auth, authorize('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const { courseId, studentIds, date, status, attendance } = req.body;

    // For admin marking faculty attendance, courseId is optional
    if (req.user.role !== 'ADMIN' && !courseId) {
      return res.status(400).json({ message: 'Course ID is required for faculty' });
    }

    let course = null;
    if (courseId) {
      course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { semesterId: true }
      });
    }

    // Handle both old format (studentIds + status) and new format (attendance array)
    let attendanceList = [];
    if (attendance && Array.isArray(attendance)) {
      attendanceList = attendance;
    } else if (studentIds && Array.isArray(studentIds)) {
      attendanceList = studentIds.map(id => ({ userId: id, status: status || 'PRESENT' }));
    }

    const attendanceRecords = await Promise.all(
      attendanceList.map(async ({ userId, status: attendanceStatus }) => {
        const attendanceDate = new Date(date);
        
        if (courseId) {
          // Regular course attendance with upsert
          return prisma.attendance.upsert({
            where: {
              userId_courseId_date: {
                userId,
                courseId,
                date: attendanceDate
              }
            },
            update: { status: attendanceStatus },
            create: {
              userId,
              courseId,
              semesterId: course?.semesterId,
              date: attendanceDate,
              status: attendanceStatus
            }
          });
        } else {
          // Faculty attendance without course - check if exists first
          const existing = await prisma.attendance.findFirst({
            where: {
              userId,
              courseId: null,
              date: attendanceDate
            }
          });
          
          if (existing) {
            return prisma.attendance.update({
              where: { id: existing.id },
              data: { status: attendanceStatus }
            });
          } else {
            return prisma.attendance.create({
              data: {
                userId,
                courseId: null,
                semesterId: null,
                date: attendanceDate,
                status: attendanceStatus
              }
            });
          }
        }
      })
    );

    res.json({ message: 'Attendance marked successfully', records: attendanceRecords });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get attendance for student
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId, semesterId } = req.query;

    const whereClause = { userId: studentId };
    if (courseId) whereClause.courseId = courseId;
    if (semesterId) whereClause.semesterId = semesterId;

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        course: { select: { name: true, code: true } },
        semester: { select: { name: true, code: true } }
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

// Get attendance by course (Faculty)
router.get('/course/:courseId', auth, authorize('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date, semesterId } = req.query;

    const whereClause = { courseId };
    if (date) whereClause.date = new Date(date);
    if (semesterId) whereClause.semesterId = semesterId;

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        user: { select: { firstName: true, lastName: true, studentId: true } },
        semester: { select: { name: true, code: true } }
      },
      orderBy: { date: 'desc' }
    });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;