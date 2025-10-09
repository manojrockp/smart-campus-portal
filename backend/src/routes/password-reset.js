const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Submit password reset request
router.post('/request', async (req, res) => {
  try {
    const { email, studentId, employeeId } = req.body;

    // Find user by email, studentId, or employeeId
    let user = null;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    } else if (studentId) {
      user = await prisma.user.findFirst({ where: { studentId } });
    } else if (employeeId) {
      user = await prisma.user.findFirst({ where: { employeeId } });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create password reset request
    const resetRequest = await prisma.passwordResetRequest.create({
      data: {
        userId: user.id,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            studentId: true,
            employeeId: true,
            role: true
          }
        }
      }
    });

    res.json({ 
      message: 'Password reset request submitted successfully. Admin will review and provide new password.',
      requestId: resetRequest.id
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all password reset requests (Admin only)
router.get('/requests', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const requests = await prisma.passwordResetRequest.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            studentId: true,
            employeeId: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(requests);
  } catch (error) {
    console.error('Get reset requests error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Process password reset request (Admin only)
router.post('/process/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword, action } = req.body; // action: 'APPROVE' or 'REJECT'

    if (action === 'APPROVE' && !newPassword) {
      return res.status(400).json({ message: 'New password is required for approval' });
    }

    const resetRequest = await prisma.passwordResetRequest.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!resetRequest) {
      return res.status(404).json({ message: 'Reset request not found' });
    }

    if (resetRequest.status !== 'PENDING') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    if (action === 'APPROVE') {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user password
      await prisma.user.update({
        where: { id: resetRequest.userId },
        data: { password: hashedPassword }
      });

      // Update request status
      await prisma.passwordResetRequest.update({
        where: { id },
        data: { 
          status: 'APPROVED',
          processedAt: new Date(),
          processedBy: req.user.id
        }
      });

      res.json({ 
        message: 'Password reset approved and updated successfully',
        newPassword: newPassword
      });
    } else {
      // Reject request
      await prisma.passwordResetRequest.update({
        where: { id },
        data: { 
          status: 'REJECTED',
          processedAt: new Date(),
          processedBy: req.user.id
        }
      });

      res.json({ message: 'Password reset request rejected' });
    }

  } catch (error) {
    console.error('Process reset request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;