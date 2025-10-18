const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const router = express.Router();
const prisma = new PrismaClient();

// Seed production data endpoint (for remote seeding)
router.post('/production', async (req, res) => {
  try {
    console.log('🌱 Seeding production database...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@smartcampus.edu' }
    });

    if (existingAdmin) {
      return res.json({ message: 'Production data already exists' });
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@smartcampus.edu',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'ADMIN',
        employeeId: 'ADMIN001'
      }
    });

    // Create semesters
    const semester1 = await prisma.semester.create({
      data: {
        name: 'Fall 2024',
        code: 'FALL2024',
        year: 2024,
        startDate: new Date('2024-08-15'),
        endDate: new Date('2024-12-15')
      }
    });

    const semester2 = await prisma.semester.create({
      data: {
        name: 'Spring 2025',
        code: 'SPRING2025',
        year: 2025,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-05-15')
      }
    });

    // Create courses
    const courses = await Promise.all([
      prisma.course.create({
        data: {
          name: 'Computer Science Fundamentals',
          code: 'CS101',
          credits: 3,
          semesterId: semester1.id
        }
      }),
      prisma.course.create({
        data: {
          name: 'Data Structures',
          code: 'CS201',
          credits: 4,
          semesterId: semester2.id
        }
      })
    ]);

    // Create sample students
    const students = await Promise.all([
      prisma.user.create({
        data: {
          email: 'student1@smartcampus.edu',
          password: hashedPassword,
          firstName: 'John',
          lastName: 'Doe',
          role: 'STUDENT',
          studentId: 'STU001',
          section: 'A',
          year: 1
        }
      }),
      prisma.user.create({
        data: {
          email: 'student2@smartcampus.edu',
          password: hashedPassword,
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'STUDENT',
          studentId: 'STU002',
          section: 'B',
          year: 2
        }
      })
    ]);

    console.log('✅ Production data seeded successfully');

    res.json({
      message: 'Production data seeded successfully',
      admin: { email: admin.email },
      semesters: [semester1.name, semester2.name],
      courses: courses.map(c => c.name),
      students: students.map(s => s.firstName + ' ' + s.lastName)
    });

  } catch (error) {
    console.error('Seeding error:', error);
    res.status(500).json({ message: 'Seeding failed', error: error.message });
  }
});

module.exports = router;