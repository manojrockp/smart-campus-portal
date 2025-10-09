const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();
const prisma = new PrismaClient();

// Get student performance prediction
router.get('/predict/:studentId', auth, authorize('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get student data
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        attendanceRecords: {
          include: { course: true }
        },
        submissions: {
          include: { assignment: true }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Calculate attendance rate
    const totalClasses = student.attendanceRecords.length;
    const presentClasses = student.attendanceRecords.filter(a => a.status === 'PRESENT').length;
    const attendanceRate = totalClasses > 0 ? (presentClasses / totalClasses) : 0;

    // Calculate assignment score
    const gradedSubmissions = student.submissions.filter(s => s.marks !== null);
    const totalMarks = gradedSubmissions.reduce((sum, s) => sum + s.marks, 0);
    const maxPossibleMarks = gradedSubmissions.reduce((sum, s) => sum + s.assignment.maxMarks, 0);
    const assignmentScore = maxPossibleMarks > 0 ? (totalMarks / maxPossibleMarks) : 0;

    // Call AI service for prediction
    try {
      const response = await axios.post(`${process.env.AI_SERVICE_URL}/predict-performance`, {
        studentId,
        attendanceRate,
        assignmentScore,
        historicalData: {
          attendance: student.attendanceRecords,
          submissions: student.submissions
        }
      });

      const prediction = await prisma.prediction.create({
        data: {
          studentId,
          predictedGrade: response.data.predictedGrade,
          riskLevel: response.data.riskLevel,
          attendanceRate,
          assignmentScore,
          confidence: response.data.confidence,
          recommendations: response.data.recommendations
        }
      });

      res.json(prediction);
    } catch (aiError) {
      // Fallback prediction logic
      let riskLevel = 'LOW';
      let predictedGrade = 'A';
      
      if (attendanceRate < 0.75 || assignmentScore < 0.6) {
        riskLevel = 'HIGH';
        predictedGrade = 'C';
      } else if (attendanceRate < 0.85 || assignmentScore < 0.8) {
        riskLevel = 'MEDIUM';
        predictedGrade = 'B';
      }

      const prediction = await prisma.prediction.create({
        data: {
          studentId,
          predictedGrade,
          riskLevel,
          attendanceRate,
          assignmentScore,
          confidence: 0.7,
          recommendations: ['Improve attendance', 'Submit assignments on time']
        }
      });

      res.json(prediction);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get analytics dashboard data
router.get('/dashboard', auth, authorize('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const [
      totalStudents,
      totalCourses,
      recentAttendance,
      pendingAssignments,
      atRiskStudents
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.course.count(),
      prisma.attendance.count({
        where: {
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      prisma.assignment.count({
        where: {
          dueDate: {
            gte: new Date()
          }
        }
      }),
      prisma.prediction.count({
        where: {
          riskLevel: {
            in: ['HIGH', 'CRITICAL']
          }
        }
      })
    ]);

    res.json({
      totalStudents,
      totalCourses,
      recentAttendance,
      pendingAssignments,
      atRiskStudents
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;