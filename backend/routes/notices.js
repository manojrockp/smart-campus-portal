const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Create notice (Faculty/Admin only)
router.post('/', auth, authorize('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const { title, content, priority, targetRole } = req.body;

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        priority: priority || 'MEDIUM',
        targetRole,
        authorId: req.user.id
      },
      include: {
        author: { select: { firstName: true, lastName: true } }
      }
    });

    res.status(201).json(notice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get notices
router.get('/', auth, async (req, res) => {
  try {
    const whereClause = {
      OR: [
        { targetRole: null },
        { targetRole: req.user.role }
      ]
    };

    const notices = await prisma.notice.findMany({
      where: whereClause,
      include: {
        author: { select: { firstName: true, lastName: true } }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;