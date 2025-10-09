const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Dashboard analytics (Admin only)
router.get('/dashboard', auth, async (req, res) => {
  // Allow access for Admin only
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  try {
    // Get total students
    const totalStudents = await prisma.user.count({
      where: { role: 'STUDENT' }
    });

    // Get total faculty
    const totalFaculty = await prisma.user.count({
      where: { role: 'FACULTY' }
    });

    // Get total courses
    const totalCourses = await prisma.course.count();

    // Get recent attendance (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentAttendance = await prisma.attendance.count({
      where: {
        date: {
          gte: sevenDaysAgo
        }
      }
    });

    // Calculate at-risk students (attendance < 75%)
    const allStudents = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        attendance: true
      }
    });

    let atRiskStudents = 0;
    allStudents.forEach(student => {
      const totalClasses = student.attendance.length;
      if (totalClasses > 0) {
        const presentClasses = student.attendance.filter(a => a.status === 'PRESENT').length;
        const attendancePercentage = (presentClasses / totalClasses) * 100;
        if (attendancePercentage < 75) {
          atRiskStudents++;
        }
      }
    });

    // Get enrollment stats
    const totalEnrollments = await prisma.enrollment.count();

    // Get attendance by status
    const attendanceStats = await prisma.attendance.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const attendanceByStatus = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0
    };

    attendanceStats.forEach(stat => {
      attendanceByStatus[stat.status] = stat._count.status;
    });

    res.json({
      totalStudents,
      totalFaculty,
      totalCourses,
      recentAttendance,
      atRiskStudents,
      totalEnrollments,
      attendanceByStatus
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student performance analytics
router.get('/student-performance', auth, async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        attendance: {
          include: {
            course: true
          },
          orderBy: { date: 'desc' }
        },
        enrollments: {
          include: {
            course: true
          }
        }
      }
    });

    const performanceData = students.map(student => {
      const totalClasses = student.attendance.length;
      const presentClasses = student.attendance.filter(a => a.status === 'PRESENT').length;
      const attendancePercentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        studentId: student.studentId,
        totalClasses,
        presentClasses,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100,
        enrolledCourses: student.enrollments.length,
        riskLevel: attendancePercentage < 75 ? 'HIGH' : attendancePercentage < 85 ? 'MEDIUM' : 'LOW',
        attendanceHistory: student.attendance
      };
    });

    res.json(performanceData);

  } catch (error) {
    console.error('Student performance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Date-wise attendance report
router.get('/attendance-report', auth, async (req, res) => {
  try {
    const { studentId, courseId, startDate, endDate, period = 'weekly' } = req.query;

    const whereClause = {};
    if (studentId) whereClause.userId = studentId;
    if (courseId) whereClause.courseId = courseId;
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true
          }
        },
        course: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    // Group by date for chart data
    const dateWiseData = {};
    attendance.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!dateWiseData[dateKey]) {
        dateWiseData[dateKey] = {
          date: dateKey,
          present: 0,
          absent: 0,
          late: 0,
          total: 0
        };
      }
      dateWiseData[dateKey][record.status.toLowerCase()]++;
      dateWiseData[dateKey].total++;
    });

    const chartData = Object.values(dateWiseData);

    // Group by period (weekly/monthly)
    const periodData = {};
    attendance.forEach(record => {
      let periodKey;
      const date = new Date(record.date);
      
      if (period === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
      } else {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!periodData[periodKey]) {
        periodData[periodKey] = {
          period: periodKey,
          present: 0,
          absent: 0,
          late: 0,
          total: 0
        };
      }
      periodData[periodKey][record.status.toLowerCase()]++;
      periodData[periodKey].total++;
    });

    const periodChartData = Object.values(periodData);

    res.json({
      attendance,
      chartData,
      periodChartData,
      summary: {
        totalRecords: attendance.length,
        present: attendance.filter(a => a.status === 'PRESENT').length,
        absent: attendance.filter(a => a.status === 'ABSENT').length,
        late: attendance.filter(a => a.status === 'LATE').length
      }
    });

  } catch (error) {
    console.error('Attendance report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Course analytics
router.get('/course-analytics', auth, async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        enrollments: {
          include: {
            user: true
          }
        },
        attendance: {
          include: {
            user: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            attendance: true
          }
        }
      }
    });

    const courseAnalytics = courses.map(course => {
      const totalEnrollments = course._count.enrollments;
      const totalAttendanceRecords = course._count.attendance;
      
      const presentCount = course.attendance.filter(a => a.status === 'PRESENT').length;
      const absentCount = course.attendance.filter(a => a.status === 'ABSENT').length;
      const lateCount = course.attendance.filter(a => a.status === 'LATE').length;
      
      const averageAttendance = totalAttendanceRecords > 0 ? 
        (presentCount / totalAttendanceRecords) * 100 : 0;

      return {
        id: course.id,
        name: course.name,
        code: course.code,
        credits: course.credits,
        totalEnrollments,
        totalAttendanceRecords,
        presentCount,
        absentCount,
        lateCount,
        averageAttendance: Math.round(averageAttendance * 100) / 100
      };
    });

    res.json(courseAnalytics);

  } catch (error) {
    console.error('Course analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;