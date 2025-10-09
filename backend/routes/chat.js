const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Send message
router.post('/send', auth, async (req, res) => {
  try {
    const { content, receiverId, chatType, roomId } = req.body;

    const message = await prisma.message.create({
      data: {
        content,
        senderId: req.user.id,
        receiverId,
        chatType: chatType || 'PRIVATE',
        roomId
      },
      include: {
        sender: { select: { firstName: true, lastName: true } },
        receiver: { select: { firstName: true, lastName: true } }
      }
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages
router.get('/', auth, async (req, res) => {
  try {
    const { receiverId, roomId } = req.query;

    const whereClause = {
      OR: [
        { senderId: req.user.id, receiverId },
        { senderId: receiverId, receiverId: req.user.id }
      ]
    };

    if (roomId) {
      whereClause.roomId = roomId;
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: { select: { firstName: true, lastName: true } },
        receiver: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;