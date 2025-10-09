const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Assignments route is working!', timestamp: new Date().toISOString() });
});

// Get all assignments
router.get('/', auth, async (req, res) => {
  try {
    const assignments = await prisma.assignment.findMany({
      include: {
        course: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(assignments);
  } catch (error) {
    console.error('Assignments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;