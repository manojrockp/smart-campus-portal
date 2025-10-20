const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get leave statistics
router.get('/stats', auth, async (req, res) => {
  try {
    let whereClause = {}
    
    if (req.user.role === 'STUDENT') {
      whereClause.studentId = req.user.id
    }

    const [total, pending, approved, rejected, facultyApproved] = await Promise.all([
      prisma.leaveApplication.count({ where: whereClause }),
      prisma.leaveApplication.count({ where: { ...whereClause, status: 'PENDING' } }),
      prisma.leaveApplication.count({ where: { ...whereClause, status: 'APPROVED' } }),
      prisma.leaveApplication.count({ where: { ...whereClause, status: 'REJECTED' } }),
      prisma.leaveApplication.count({ where: { ...whereClause, status: 'FACULTY_APPROVED' } })
    ])

    // Get leave type breakdown
    const typeBreakdown = await prisma.leaveApplication.groupBy({
      by: ['leaveType'],
      where: whereClause,
      _count: { leaveType: true }
    })

    res.json({
      total,
      pending,
      approved,
      rejected,
      facultyApproved,
      typeBreakdown
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// Get all leave applications
router.get('/', auth, async (req, res) => {
  try {
    const { semesterId } = req.query;
    let whereClause = {};
    
    if (req.user.role === 'STUDENT') {
      whereClause.studentId = req.user.id;
    }
    
    if (semesterId) {
      whereClause.semesterId = semesterId;
    }

    const leaves = await prisma.leaveApplication.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentId: true,
            email: true
          }
        },

        approvedByFaculty: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        },
        approvedByAdmin: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create leave application (Student only)
router.post('/', auth, authorize('STUDENT'), async (req, res) => {
  try {
    console.log('Leave application request:', req.body);
    console.log('Student ID:', req.user.id);
    
    const { startDate, endDate, reason, leaveType, semesterId } = req.body;

    if (!startDate || !endDate || !reason || !leaveType) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Set semester to null for now to avoid dependency issues
    let finalSemesterId = null;
    console.log('Final semester ID:', finalSemesterId);

    const leave = await prisma.leaveApplication.create({
      data: {
        studentId: req.user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        leaveType,
        status: 'PENDING'
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentId: true,
            email: true
          }
        },

      }
    });

    console.log('Leave application created successfully:', leave.id);
    res.status(201).json(leave);
  } catch (error) {
    console.error('Leave application error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Faculty approve leave
router.put('/:id/faculty-approve', auth, authorize('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'APPROVE' or 'REJECT'

    const leave = await prisma.leaveApplication.findUnique({
      where: { id }
    });

    if (!leave) {
      return res.status(404).json({ message: 'Leave application not found' });
    }

    if (leave.status !== 'PENDING') {
      return res.status(400).json({ message: 'Leave application already processed' });
    }

    const updatedLeave = await prisma.leaveApplication.update({
      where: { id },
      data: {
        facultyStatus: action,
        facultyApprovedById: action === 'APPROVE' ? req.user.id : null,
        facultyApprovedAt: action === 'APPROVE' ? new Date() : null,
        status: action === 'APPROVE' ? 'FACULTY_APPROVED' : 'REJECTED'
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentId: true
          }
        },
        approvedByFaculty: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        }
      }
    });

    res.json(updatedLeave);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin approve leave
router.put('/:id/admin-approve', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'APPROVE' or 'REJECT'

    const leave = await prisma.leaveApplication.findUnique({
      where: { id }
    });

    if (!leave) {
      return res.status(404).json({ message: 'Leave application not found' });
    }

    if (leave.status !== 'FACULTY_APPROVED' && action === 'APPROVE') {
      return res.status(400).json({ message: 'Leave must be faculty approved first' });
    }

    const updatedLeave = await prisma.leaveApplication.update({
      where: { id },
      data: {
        adminStatus: action,
        adminApprovedById: action === 'APPROVE' ? req.user.id : null,
        adminApprovedAt: action === 'APPROVE' ? new Date() : null,
        status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentId: true
          }
        },
        approvedByFaculty: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        },
        approvedByAdmin: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json(updatedLeave);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;