const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all semesters
router.get('/', auth, async (req, res) => {
  try {
    console.log('Getting semesters for user:', req.user?.role);
    const { year } = req.query;
    
    const whereClause = year ? { year: parseInt(year) } : {};
    
    const semesters = await prisma.semester.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            enrollments: true,
            courses: true
          }
        }
      },
      orderBy: { startDate: 'desc' }
    });

    console.log('Found semesters:', semesters.length);
    res.json(semesters);
  } catch (error) {
    console.error('Get semesters error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get active year semesters
router.get('/active', auth, async (req, res) => {
  try {
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true }
    });

    if (!activeYear) {
      return res.json([]);
    }

    const activeSemesters = await prisma.semester.findMany({
      where: { year: activeYear.year },
      include: {
        _count: {
          select: {
            enrollments: true,
            courses: true
          }
        }
      },
      orderBy: { startDate: 'asc' }
    });

    res.json(activeSemesters);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bulk create semesters (Admin only)
router.post('/bulk', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { type, year, startDate, endDate } = req.body; // type: 'ODD' or 'EVEN'
    const yearInt = parseInt(year);
    
    console.log('Creating bulk semesters:', { type, year: yearInt, startDate, endDate });

    // Validate semester type
    if (!['EVEN', 'ODD'].includes(type)) {
      return res.status(400).json({ message: 'Semester type must be EVEN or ODD' });
    }

    // Ensure academic year exists
    let academicYear = await prisma.academicYear.findUnique({
      where: { year: yearInt }
    });

    if (!academicYear) {
      academicYear = await prisma.academicYear.create({
        data: {
          year: yearInt,
          name: `${yearInt}-${yearInt + 1}`,
          isActive: true
        }
      });
    }

    const semesters = [];
    const semesterNumbers = type === 'ODD' ? [1, 3, 5] : [2, 4, 6];
    
    for (const semNum of semesterNumbers) {
      const semesterCode = `SEM${semNum}-${yearInt}`;
      const semesterName = `Semester ${semNum}`;
      
      // Check if semester already exists
      const existing = await prisma.semester.findUnique({
        where: { code: semesterCode }
      });
      
      if (!existing) {
        const semester = await prisma.semester.create({
          data: {
            name: semesterName,
            code: semesterCode,
            type: type,
            year: yearInt,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isActive: true
          }
        });
        semesters.push(semester);
      }
    }

    res.status(201).json({
      message: `Created ${semesters.length} ${type} semesters for year ${yearInt}`,
      semesters
    });
  } catch (error) {
    console.error('Bulk semester creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create semester (Admin only)
router.post('/', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, code, type, year, startDate, endDate } = req.body;
    const yearInt = parseInt(year);
    
    console.log('Creating semester with data:', { name, code, type, year: yearInt, startDate, endDate });

    // Validate semester type
    if (!['EVEN', 'ODD'].includes(type)) {
      return res.status(400).json({ message: 'Semester type must be EVEN or ODD' });
    }

    // Ensure academic year exists
    let academicYear = await prisma.academicYear.findUnique({
      where: { year: yearInt }
    });

    if (!academicYear) {
      academicYear = await prisma.academicYear.create({
        data: {
          year: yearInt,
          name: `${yearInt}-${yearInt + 1}`,
          isActive: true
        }
      });
      console.log('Created academic year:', academicYear.name);
    }

    // Check if semester with same code already exists
    const existingSemester = await prisma.semester.findUnique({
      where: { code }
    });

    if (existingSemester) {
      return res.status(400).json({ 
        message: `Semester with code '${code}' already exists. Please use a different code.` 
      });
    }

    // Check date overlap within same semester type only
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    const overlappingSemesters = await prisma.semester.findMany({
      where: {
        type: type, // Only check within same type (EVEN/ODD)
        AND: [
          { startDate: { lte: endDateObj } },
          { endDate: { gte: startDateObj } }
        ]
      }
    });

    if (overlappingSemesters.length > 0) {
      const conflictingSemester = overlappingSemesters[0];
      return res.status(400).json({ 
        message: `Date overlap detected with existing ${type} semester '${conflictingSemester.name}' (${conflictingSemester.code}). ${type} semesters cannot have overlapping dates.` 
      });
    }

    const semester = await prisma.semester.create({
      data: {
        name,
        code,
        type,
        year: yearInt,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true
      }
    });

    console.log('Semester created successfully:', semester);
    res.status(201).json(semester);
  } catch (error) {
    console.error('Semester creation error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Semester code already exists. Please use a unique code.' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update semester (Admin only)
router.put('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, year, startDate, endDate } = req.body;

    const semester = await prisma.semester.update({
      where: { id },
      data: {
        name,
        code,
        year: parseInt(year),
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      }
    });

    res.json(semester);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete semester (Admin only)
router.delete('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if semester has enrollments
    const enrollmentCount = await prisma.enrollment.count({
      where: { semesterId: id }
    });

    if (enrollmentCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete semester with existing enrollments' 
      });
    }

    await prisma.semester.delete({
      where: { id }
    });

    res.json({ message: 'Semester deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Academic Year Management
router.get('/years', auth, async (req, res) => {
  try {
    const years = await prisma.academicYear.findMany({
      orderBy: { year: 'desc' }
    });
    res.json(years);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/years', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { year, name } = req.body;
    
    const academicYear = await prisma.academicYear.create({
      data: { year: parseInt(year), name }
    });
    
    res.status(201).json(academicYear);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/years/:year/activate', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { year } = req.params;
    const yearInt = parseInt(year);
    
    console.log('Activating year:', yearInt);

    // Check if academic year exists, if not create it
    let activeYear = await prisma.academicYear.findUnique({
      where: { year: yearInt }
    });

    if (!activeYear) {
      console.log('Creating new academic year:', yearInt);
      activeYear = await prisma.academicYear.create({
        data: {
          year: yearInt,
          name: `${yearInt}-${yearInt + 1}`,
          isActive: true
        }
      });
    } else {
      console.log('Updating existing academic year:', yearInt);
      activeYear = await prisma.academicYear.update({
        where: { year: yearInt },
        data: { isActive: true }
      });
    }

    console.log('Active year set:', activeYear);
    res.json(activeYear);
  } catch (error) {
    console.error('Set active year error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;