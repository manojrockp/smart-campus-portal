const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');
const sessionAuth = require('../../middleware/sessionAuth');
const Session = require('../../models/Session');

const router = express.Router();
const prisma = new PrismaClient();

// Register (Admin only - for creating student accounts)
router.post('/register', auth, authorize('ADMIN'), async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    console.log('User making request:', req.user);
    
    const { email, firstName, lastName, role, studentId, employeeId, password, section, year } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user already exists by email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Check if studentId already exists (for students)
    if (role === 'STUDENT' && studentId) {
      const existingStudent = await prisma.user.findFirst({
        where: { studentId }
      });

      if (existingStudent) {
        return res.status(400).json({ message: `Student ID '${studentId}' already exists` });
      }
    }

    // Check if employeeId already exists (for faculty/admin)
    if ((role === 'FACULTY' || role === 'ADMIN') && employeeId) {
      const existingEmployee = await prisma.user.findFirst({
        where: { employeeId }
      });

      if (existingEmployee) {
        return res.status(400).json({ message: `Employee ID '${employeeId}' already exists` });
      }
    }

    // Use admin-provided password or generate one
    const generatedPassword = password || studentId || employeeId || 'defaultpass123';
    const hashedPassword = await bcrypt.hash(generatedPassword, 12);

    console.log('Creating user with data:', {
      email,
      firstName,
      lastName,
      role,
      studentId,
      employeeId
    });

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        studentId,
        employeeId,
        section,
        year
      }
    });

    console.log('User created successfully:', user.id);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        studentId: user.studentId,
        employeeId: user.employeeId
      },
      credentials: {
        username: user.studentId || user.employeeId,
        password: generatedPassword,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Registration error details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email OR studentId
    let user = await prisma.user.findUnique({
      where: { email }
    });

    // If not found by email, try to find by studentId
    if (!user) {
      user = await prisma.user.findFirst({
        where: { studentId: email } // Allow login with studentId as username
      });
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Create session
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await Session.create(user.id, token, expiresAt);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        studentId: user.studentId,
        employeeId: user.employeeId
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Logout
router.post('/logout', sessionAuth, async (req, res) => {
  try {
    await Session.invalidate(req.session.token);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Logout all sessions
router.post('/logout-all', sessionAuth, async (req, res) => {
  try {
    await Session.invalidateAllUserSessions(req.user.id);
    res.json({ message: 'All sessions logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', sessionAuth, async (req, res) => {
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
        employeeId: true
      }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bulk create users from Excel (Admin only)
router.post('/bulk-create', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { users } = req.body; // Array of user objects from Excel

    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: 'Users array is required' });
    }

    const results = {
      successful: [],
      failed: [],
      total: users.length
    };

    for (const userData of users) {
      try {
        const { firstName, lastName, email, studentId, password, section, year } = userData;

        // Validate required fields
        if (!firstName || !lastName || !email || !studentId || !password) {
          results.failed.push({
            data: userData,
            error: 'Missing required fields (firstName, lastName, email, studentId, password)'
          });
          continue;
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email },
              { studentId }
            ]
          }
        });

        if (existingUser) {
          results.failed.push({
            data: userData,
            error: `User already exists with email '${email}' or student ID '${studentId}'`
          });
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
          data: {
            firstName,
            lastName,
            email,
            studentId,
            password: hashedPassword,
            role: 'STUDENT',
            section,
            year
          }
        });

        results.successful.push({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          studentId: user.studentId,
          credentials: {
            username: user.studentId,
            password: password
          }
        });

      } catch (error) {
        results.failed.push({
          data: userData,
          error: error.message
        });
      }
    }

    res.status(201).json({
      message: `Bulk upload completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
      results
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;