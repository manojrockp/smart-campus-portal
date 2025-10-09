const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { auth, authorize } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// Get all enrollments with stats
router.get('/', auth, async (req, res) => {
  try {
    const { courseId, studentId } = req.query
    
    const whereClause = {}
    if (courseId) whereClause.courseId = courseId
    if (studentId) whereClause.userId = studentId
    
    const enrollments = await prisma.enrollment.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            email: true,
            year: true,
            section: true
          }
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            credits: true
          }
        },
        semester: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Get stats
    const totalEnrollments = await prisma.enrollment.count()
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } })
    const totalCourses = await prisma.course.count()
    
    res.json({
      enrollments,
      stats: {
        totalEnrollments,
        totalStudents,
        totalCourses
      }
    })
  } catch (error) {
    console.error('Get enrollments error:', error)
    res.status(500).json({ message: 'Failed to get enrollments' })
  }
})

// Bulk enroll student in multiple courses
router.post('/bulk', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { studentId, courseIds } = req.body

    if (!studentId || !courseIds || !Array.isArray(courseIds)) {
      return res.status(400).json({ message: 'Student ID and course IDs array are required' })
    }

    // Check if student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId, role: 'STUDENT' }
    })

    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    // Check if courses exist
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } }
    })

    if (courses.length !== courseIds.length) {
      return res.status(400).json({ message: 'Some courses not found' })
    }

    // Create enrollments (skip duplicates)
    const enrollments = []
    for (const courseId of courseIds) {
      try {
        const enrollment = await prisma.enrollment.create({
          data: {
            userId: studentId,
            courseId: courseId
          },
          include: {
            course: true
          }
        })
        enrollments.push(enrollment)
      } catch (error) {
        // Skip if already enrolled
        if (error.code === 'P2002') {
          continue
        }
        throw error
      }
    }

    res.json({
      message: `Student enrolled in ${enrollments.length} courses`,
      enrollments
    })
  } catch (error) {
    console.error('Bulk enrollment error:', error)
    res.status(500).json({ message: 'Failed to enroll student' })
  }
})

// Enroll entire section in multiple courses
router.post('/section', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { year, section, courseIds, semesterId } = req.body

    if (!year || !section || !courseIds || !Array.isArray(courseIds) || !semesterId) {
      return res.status(400).json({ message: 'Year, section, semester, and course IDs array are required' })
    }

    // Get all students in the specified year and section
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        year: year,
        section: section
      }
    })

    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found in specified year and section' })
    }

    // Check if courses exist
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } }
    })

    if (courses.length !== courseIds.length) {
      return res.status(400).json({ message: 'Some courses not found' })
    }

    // Check if semester exists
    const semester = await prisma.semester.findUnique({
      where: { id: semesterId }
    })

    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' })
    }

    let enrolledCount = 0
    
    // Enroll each student in each course
    for (const student of students) {
      for (const courseId of courseIds) {
        try {
          await prisma.enrollment.create({
            data: {
              userId: student.id,
              courseId: courseId,
              semesterId: semesterId
            }
          })
          enrolledCount++
        } catch (error) {
          // Skip if already enrolled
          if (error.code === 'P2002') {
            continue
          }
          throw error
        }
      }
    }

    res.json({
      message: `Section enrolled successfully`,
      enrolledCount,
      studentsCount: students.length,
      coursesCount: courseIds.length
    })
  } catch (error) {
    console.error('Section enrollment error:', error)
    res.status(500).json({ message: 'Failed to enroll section' })
  }
})

// Get student enrollments
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: studentId },
      include: {
        course: true,
        semester: true
      }
    })

    res.json(enrollments)
  } catch (error) {
    console.error('Get enrollments error:', error)
    res.status(500).json({ message: 'Failed to get enrollments' })
  }
})

module.exports = router