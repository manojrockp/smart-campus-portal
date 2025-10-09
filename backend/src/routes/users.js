const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get users (role-based access)
router.get('/', auth, async (req, res) => {
  try {
    const { role, section, year } = req.query;
    let users;

    if (req.user.role === 'STUDENT') {
      // Students can only see their own profile
      users = await prisma.user.findMany({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          studentId: true,
          employeeId: true,
          section: true,
          createdAt: true
        }
      });
    } else {
      // Admin and Faculty can see all users
      const whereClause = {};
      if (role) whereClause.role = role;
      if (section) whereClause.section = section;
      if (year) whereClause.year = parseInt(year);
      
      users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          studentId: true,
          employeeId: true,
          section: true,
          year: true,
          createdAt: true
        }
      });
    }

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user (Admin only)
router.put('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, studentId, employeeId, section, year } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        studentId,
        employeeId,
        section,
        year
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        studentId: true,
        employeeId: true,
        section: true
      }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bulk delete all students (Admin only)
router.delete('/bulk-delete-students', auth, authorize('ADMIN'), async (req, res) => {
  try {
    // Get all students first
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true }
    });

    if (students.length === 0) {
      return res.json({ message: 'No students found to delete', count: 0 });
    }

    const studentIds = students.map(s => s.id);
    console.log(`Deleting ${studentIds.length} students:`, studentIds);

    // Use transaction to ensure all deletions succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Delete leave applications
      const deletedLeaves = await tx.leaveApplication.deleteMany({
        where: { studentId: { in: studentIds } }
      });
      console.log(`Deleted ${deletedLeaves.count} leave applications`);

      // Delete submissions
      const deletedSubmissions = await tx.submission.deleteMany({
        where: { studentId: { in: studentIds } }
      });
      console.log(`Deleted ${deletedSubmissions.count} submissions`);

      // Delete predictions
      const deletedPredictions = await tx.prediction.deleteMany({
        where: { studentId: { in: studentIds } }
      });
      console.log(`Deleted ${deletedPredictions.count} predictions`);

      // Delete sent messages
      const deletedSentMessages = await tx.message.deleteMany({
        where: { senderId: { in: studentIds } }
      });
      console.log(`Deleted ${deletedSentMessages.count} sent messages`);

      // Delete received messages
      const deletedReceivedMessages = await tx.message.deleteMany({
        where: { receiverId: { in: studentIds } }
      });
      console.log(`Deleted ${deletedReceivedMessages.count} received messages`);

      // Delete attendance records
      const deletedAttendance = await tx.attendance.deleteMany({
        where: { userId: { in: studentIds } }
      });
      console.log(`Deleted ${deletedAttendance.count} attendance records`);

      // Delete enrollment records
      const deletedEnrollments = await tx.enrollment.deleteMany({
        where: { userId: { in: studentIds } }
      });
      console.log(`Deleted ${deletedEnrollments.count} enrollment records`);

      // Delete faculty course assignments (in case any students were wrongly marked as faculty)
      const deletedFacultyCourses = await tx.facultyCourse.deleteMany({
        where: { facultyId: { in: studentIds } }
      });
      console.log(`Deleted ${deletedFacultyCourses.count} faculty course assignments`);

      // Finally delete the students
      const deletedStudents = await tx.user.deleteMany({
        where: { id: { in: studentIds } }
      });
      console.log(`Deleted ${deletedStudents.count} students`);

      return deletedStudents;
    });

    res.json({ 
      message: `Successfully deleted ${result.count} students`,
      count: result.count
    });

  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ 
      message: 'Failed to delete students', 
      error: error.message,
      details: error.stack
    });
  }
});

// Delete user (Admin only)
router.delete('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    // Use transaction to ensure all deletions succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Delete leave applications
      await tx.leaveApplication.deleteMany({
        where: { studentId: id }
      });

      // Delete submissions
      await tx.submission.deleteMany({
        where: { studentId: id }
      });

      // Delete predictions
      await tx.prediction.deleteMany({
        where: { studentId: id }
      });

      // Delete sent messages
      await tx.message.deleteMany({
        where: { senderId: id }
      });

      // Delete received messages
      await tx.message.deleteMany({
        where: { receiverId: id }
      });

      // Delete attendance records
      await tx.attendance.deleteMany({
        where: { userId: id }
      });

      // Delete enrollment records
      await tx.enrollment.deleteMany({
        where: { userId: id }
      });

      // Delete faculty course assignments
      await tx.facultyCourse.deleteMany({
        where: { facultyId: id }
      });

      // Delete notices created by user
      await tx.notice.deleteMany({
        where: { authorId: id }
      });

      // Delete assignments created by user
      await tx.assignment.deleteMany({
        where: { creatorId: id }
      });

      // Finally delete the user
      await tx.user.delete({
        where: { id }
      });
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        studentId: true,
        employeeId: true,
        section: true,
        year: true
      }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student details with semester info
router.get('/student-details', auth, async (req, res) => {
  try {
    console.log('Fetching student details for user:', req.user.id);
    
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ message: 'Access denied. Students only.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        studentId: true,
        section: true,
        year: true,
        enrollments: {
          include: {
            semester: {
              select: {
                id: true,
                name: true,
                code: true,
                year: true,
                startDate: true,
                endDate: true
              }
            },
            course: {
              select: {
                name: true,
                code: true,
                credits: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all semesters from student's enrollments
    const allSemesters = [];
    let currentSemester = null;
    let semesterHistory = [];
    
    if (user.enrollments && user.enrollments.length > 0) {
      // Get unique semesters from enrollments
      const uniqueSemesters = user.enrollments
        .map(enrollment => enrollment.semester)
        .filter(semester => semester !== null)
        .reduce((acc, semester) => {
          if (!acc.find(s => s.id === semester.id)) {
            acc.push(semester);
          }
          return acc;
        }, [])
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      
      if (uniqueSemesters.length > 0) {
        const now = new Date();
        
        // Find current active semester (ongoing)
        currentSemester = uniqueSemesters.find(semester => 
          new Date(semester.startDate) <= now && new Date(semester.endDate) >= now
        );
        
        // If no active semester, check if there's a future semester
        if (!currentSemester) {
          const futureSemester = uniqueSemesters.find(semester => 
            new Date(semester.startDate) > now
          );
          
          if (futureSemester) {
            currentSemester = futureSemester;
          } else {
            // Get the latest semester
            currentSemester = uniqueSemesters[uniqueSemesters.length - 1];
          }
        }
        
        // All semesters with end date in the past are history (completed)
        semesterHistory = uniqueSemesters.filter(semester => 
          new Date(semester.endDate) < now
        ).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        
        // Get attendance data for each semester
        for (let semester of semesterHistory) {
          const attendanceData = await prisma.attendance.findMany({
            where: {
              userId: user.id,
              semesterId: semester.id
            },
            include: {
              course: { select: { name: true, code: true } }
            }
          });
          
          const totalClasses = attendanceData.length;
          const presentClasses = attendanceData.filter(a => a.status === 'PRESENT').length;
          const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
          
          semester.attendanceStats = {
            totalClasses,
            presentClasses,
            absentClasses: totalClasses - presentClasses,
            attendancePercentage
          };
        }
      }
    }

    console.log('Student details response:', { ...user, currentSemester, semesterHistory });

    // Get current semester attendance if exists
    if (currentSemester) {
      const currentAttendance = await prisma.attendance.findMany({
        where: {
          userId: user.id,
          semesterId: currentSemester.id
        },
        include: {
          course: { select: { name: true, code: true } }
        }
      });
      
      const totalClasses = currentAttendance.length;
      const presentClasses = currentAttendance.filter(a => a.status === 'PRESENT').length;
      const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
      
      currentSemester.attendanceStats = {
        totalClasses,
        presentClasses,
        absentClasses: totalClasses - presentClasses,
        attendancePercentage
      };
    }
    
    // Check if current semester has ended and needs transition
    const now = new Date();
    const semesterStatus = currentSemester && new Date(currentSemester.endDate) < now ? 'completed' : 'active';
    
    res.json({
      ...user,
      currentSemester,
      semesterHistory,
      totalSemesters: semesterHistory.length + (currentSemester ? 1 : 0),
      semesterStatus,
      needsTransition: semesterStatus === 'completed'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Promote students to next semester (Admin only)
router.post('/promote-semester', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { studentIds, newSemesterId } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || !newSemesterId) {
      return res.status(400).json({ message: 'Student IDs array and new semester ID are required' });
    }

    // Verify semester exists
    const newSemester = await prisma.semester.findUnique({
      where: { id: newSemesterId }
    });

    if (!newSemester) {
      return res.status(404).json({ message: 'New semester not found' });
    }

    // Get students to promote
    const students = await prisma.user.findMany({
      where: {
        id: { in: studentIds },
        role: 'STUDENT'
      }
    });

    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found' });
    }

    let promotedCount = 0;

    // Promote each student
    for (const student of students) {
      // Get current semester courses for this student
      const currentEnrollments = await prisma.enrollment.findMany({
        where: { userId: student.id },
        include: { course: true, semester: true },
        orderBy: { createdAt: 'desc' }
      });

      if (currentEnrollments.length > 0) {
        // Get courses for the new semester
        const newSemesterCourses = await prisma.course.findMany({
          where: { semesterId: newSemesterId }
        });

        // Enroll student in new semester courses
        for (const course of newSemesterCourses) {
          try {
            await prisma.enrollment.create({
              data: {
                userId: student.id,
                courseId: course.id,
                semesterId: newSemesterId
              }
            });
          } catch (error) {
            // Skip if already enrolled
            if (error.code !== 'P2002') {
              throw error;
            }
          }
        }
        promotedCount++;
      }
    }

    res.json({
      message: `Successfully promoted ${promotedCount} students to ${newSemester.name}`,
      promotedCount,
      semesterName: newSemester.name
    });
  } catch (error) {
    console.error('Promote semester error:', error);
    res.status(500).json({ message: 'Failed to promote students', error: error.message });
  }
});

// Get all students semester history (Admin/Faculty only)
router.get('/semester-history', auth, authorize('ADMIN', 'FACULTY'), async (req, res) => {
  try {
    const { semesterId, year, section } = req.query;

    // Get all semesters
    const semesters = await prisma.semester.findMany({
      orderBy: { startDate: 'desc' }
    });

    // Build where clause for students
    const whereClause = { role: 'STUDENT' };
    if (year) whereClause.year = parseInt(year);
    if (section) whereClause.section = section;

    // Get students with their enrollments and attendance
    const students = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentId: true,
        email: true,
        year: true,
        section: true,
        enrollments: {
          include: {
            semester: true,
            course: {
              select: {
                name: true,
                code: true,
                credits: true
              }
            }
          }
        }
      }
    });

    // Process semester-wise data for each student
    const studentsWithSemesterData = await Promise.all(
      students.map(async (student) => {
        const semesterData = {};
        
        // Group enrollments by semester
        const enrollmentsBySemester = student.enrollments.reduce((acc, enrollment) => {
          if (enrollment.semester) {
            const semId = enrollment.semester.id;
            // Filter by selected semester if specified
            if (semesterId && semId !== semesterId) {
              return acc;
            }
            if (!acc[semId]) {
              acc[semId] = {
                semester: enrollment.semester,
                courses: [],
                enrollments: []
              };
            }
            acc[semId].courses.push(enrollment.course);
            acc[semId].enrollments.push(enrollment);
          }
          return acc;
        }, {});

        // Get attendance stats for each semester
        for (const [semId, data] of Object.entries(enrollmentsBySemester)) {
          const attendanceData = await prisma.attendance.findMany({
            where: {
              userId: student.id,
              semesterId: semId
            }
          });

          const totalClasses = attendanceData.length;
          const presentClasses = attendanceData.filter(a => a.status === 'PRESENT').length;
          const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

          semesterData[semId] = {
            ...data,
            attendanceStats: {
              totalClasses,
              presentClasses,
              absentClasses: totalClasses - presentClasses,
              attendancePercentage
            }
          };
        }

        return {
          ...student,
          semesterData
        };
      })
    );

    res.json({
      students: studentsWithSemesterData,
      semesters
    });
  } catch (error) {
    console.error('Semester history error:', error);
    res.status(500).json({ message: 'Failed to get semester history', error: error.message });
  }
});

module.exports = router;