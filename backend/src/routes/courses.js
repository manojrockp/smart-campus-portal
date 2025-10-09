const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Create course (Admin only)
router.post('/', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, code, description, credits, semesterId } = req.body;

    // Validate semester if provided
    if (semesterId) {
      const semester = await prisma.semester.findUnique({
        where: { id: semesterId }
      });
      if (!semester) {
        return res.status(400).json({ message: 'Invalid semester ID' });
      }
    }

    const course = await prisma.course.create({
      data: { 
        name, 
        code, 
        description, 
        credits: parseInt(credits),
        semesterId 
      },
      include: {
        semester: true
      }
    });

    res.status(201).json(course);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Course code already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all courses (role-based filtering)
router.get('/', auth, async (req, res) => {
  try {
    const { semesterId } = req.query;
    let courses;
    
    const whereClause = semesterId ? { semesterId } : {};
    
    if (req.user.role === 'STUDENT') {
      // Students only see courses they're enrolled in
      console.log('Student accessing courses, ID:', req.user.id)
      
      const enrollments = await prisma.enrollment.findMany({
        where: { userId: req.user.id },
        include: {
          course: {
            include: {
              semester: true,
              enrollments: { include: { user: true } },
              assignments: true,
              _count: { select: { enrollments: true } }
            }
          }
        }
      });
      
      console.log('Found enrollments for student:', enrollments.length)
      
      // Filter courses based on semester if specified
      let allCourses = enrollments.map(enrollment => enrollment.course).filter(course => course);
      
      if (semesterId) {
        courses = allCourses.filter(course => course.semesterId === semesterId);
      } else {
        courses = allCourses;
      }
      
      console.log('Returning courses for student:', courses.length)
    } else if (req.user.role === 'FACULTY') {
      // Faculty only see courses they're assigned to teach
      console.log('Faculty user ID:', req.user.id)
      
      const facultyCourses = await prisma.facultyCourse.findMany({
        where: { facultyId: req.user.id },
        include: {
          course: {
            include: {
              semester: true,
              enrollments: { include: { user: true } },
              assignments: true,
              _count: { select: { enrollments: true } }
            }
          }
        }
      });
      
      console.log('Found faculty courses:', facultyCourses.length)
      
      courses = facultyCourses.map(fc => fc.course).filter(course => course);
      
      // If no courses assigned, return empty array with message
      if (courses.length === 0) {
        return res.json([])
      }
    } else {
      // Admin sees all courses
      courses = await prisma.course.findMany({
        where: whereClause,
        include: {
          semester: true,
          enrollments: { include: { user: true } },
          assignments: true,
          _count: { select: { enrollments: true } }
        }
      });
    }

    // Return courses array for consistency
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get courses by semester
router.get('/semester/:semesterId', auth, async (req, res) => {
  try {
    const { semesterId } = req.params;

    const courses = await prisma.course.findMany({
      where: { semesterId },
      include: {
        semester: true,
        _count: { select: { enrollments: true } }
      }
    });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get enrolled students for a course
router.get('/:id/students', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const enrolledStudents = await prisma.enrollment.findMany({
      where: { courseId: id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            studentId: true
          }
        }
      }
    });

    const students = enrolledStudents.map(enrollment => enrollment.user);
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Enroll student in course
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { semester, year } = req.body;

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: req.user.id,
        courseId: id
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ 
        message: 'You are already enrolled in this course' 
      });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: req.user.id,
        courseId: id,
        semester: semester || 'I',
        year: year || new Date().getFullYear()
      }
    });

    res.status(201).json(enrollment);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        message: 'You are already enrolled in this course' 
      });
    }
    console.error('Course enrollment error:', error);
    res.status(500).json({ message: 'Failed to enroll in course', error: error.message });
  }
});

// Update course (Admin only)
router.put('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, credits, semesterId } = req.body;

    // Validate semester if provided
    if (semesterId) {
      const semester = await prisma.semester.findUnique({
        where: { id: semesterId }
      });
      if (!semester) {
        return res.status(400).json({ message: 'Invalid semester ID' });
      }
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        name,
        code,
        description,
        credits: parseInt(credits),
        semesterId
      },
      include: {
        semester: true
      }
    });

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete course (Admin only)
router.delete('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    // Delete related records first
    await prisma.attendance.deleteMany({
      where: { courseId: id }
    });

    await prisma.enrollment.deleteMany({
      where: { courseId: id }
    });

    await prisma.assignment.deleteMany({
      where: { courseId: id }
    });

    // Delete the course
    await prisma.course.delete({
      where: { id }
    });

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;