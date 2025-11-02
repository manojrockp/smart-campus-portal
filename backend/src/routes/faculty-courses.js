const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Assign course to faculty (Admin only)
router.post('/assign', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { facultyId, courseId } = req.body;

    const assignment = await prisma.facultyCourse.create({
      data: { facultyId, courseId },
      include: {
        faculty: { select: { firstName: true, lastName: true } },
        course: { select: { name: true, code: true } }
      }
    });

    res.json({ message: 'Course assigned successfully', assignment });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Faculty already assigned to this course' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove course assignment (Admin only)
router.delete('/unassign', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { facultyId, courseId } = req.body;

    const assignment = await prisma.facultyCourse.findFirst({
      where: { facultyId, courseId }
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    await prisma.facultyCourse.delete({
      where: { id: assignment.id }
    });

    res.json({ message: 'Course assignment removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get faculty's assigned courses
router.get('/faculty/:facultyId', auth, async (req, res) => {
  try {
    const { facultyId } = req.params;

    // Faculty can only see their own courses
    if (req.user.role === 'FACULTY' && req.user.id !== facultyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const assignments = await prisma.facultyCourse.findMany({
      where: { facultyId },
      include: { course: true }
    });

    res.json(assignments.map(a => a.course));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all faculty-course assignments (Admin only)
router.get('/assignments', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const assignments = await prisma.facultyCourse.findMany({
      include: {
        faculty: { select: { firstName: true, lastName: true, employeeId: true } },
        course: { select: { name: true, code: true } }
      }
    });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unassigned courses (Admin only)
router.get('/unassigned', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const unassignedCourses = await prisma.course.findMany({
      where: {
        facultyCourses: {
          none: {}
        }
      },
      select: {
        id: true,
        name: true,
        code: true
      }
    });

    res.json(unassignedCourses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;