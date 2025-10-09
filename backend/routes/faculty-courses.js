const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all faculty-course assignments
router.get('/', auth, async (req, res) => {
  try {
    const assignments = await prisma.facultyCourse.findMany({
      include: {
        faculty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true
          }
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            credits: true
          }
        }
      }
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assign course to faculty
router.post('/', auth, async (req, res) => {
  try {
    const { facultyId, courseId } = req.body;

    // Check if assignment already exists
    const existing = await prisma.facultyCourse.findUnique({
      where: {
        facultyId_courseId: {
          facultyId,
          courseId
        }
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'Course already assigned to this faculty' });
    }

    const assignment = await prisma.facultyCourse.create({
      data: {
        facultyId,
        courseId
      },
      include: {
        faculty: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        },
        course: {
          select: {
            name: true,
            code: true
          }
        }
      }
    });

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove faculty-course assignment
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.facultyCourse.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Assignment removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test endpoint to verify route is working
router.get('/test', (req, res) => {
  res.json({ message: 'Faculty-courses route is working!', timestamp: new Date().toISOString() });
});

module.exports = router;