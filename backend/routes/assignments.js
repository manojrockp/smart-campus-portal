const express = require('express');
const multer = require('multer');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();
const prisma = new PrismaClient();

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/assignments/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Create assignment (Faculty only)
router.post('/', auth, authorize('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const { title, description, courseId, dueDate, maxMarks } = req.body;

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        courseId,
        creatorId: req.user.id,
        dueDate: new Date(dueDate),
        maxMarks: parseInt(maxMarks)
      },
      include: {
        course: { select: { name: true, code: true } }
      }
    });

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get assignments
router.get('/', auth, async (req, res) => {
  try {
    const { courseId } = req.query;
    const whereClause = {};
    
    if (courseId) whereClause.courseId = courseId;
    if (req.user.role === 'FACULTY') whereClause.creatorId = req.user.id;

    const assignments = await prisma.assignment.findMany({
      where: whereClause,
      include: {
        course: { select: { name: true, code: true } },
        creator: { select: { firstName: true, lastName: true } },
        submissions: req.user.role === 'STUDENT' ? {
          where: { studentId: req.user.id }
        } : true
      },
      orderBy: { dueDate: 'asc' }
    });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit assignment (Student only)
router.post('/:id/submit', auth, authorize('STUDENT'), upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    // Check if assignment exists and is not past due
    const assignment = await prisma.assignment.findUnique({
      where: { id }
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const isLate = new Date() > assignment.dueDate;

    // Check for plagiarism if content is provided
    let plagiarismScore = 0;
    if (content) {
      try {
        const response = await axios.post(`${process.env.AI_SERVICE_URL}/check-plagiarism`, {
          text: content,
          assignmentId: id
        });
        plagiarismScore = response.data.score;
      } catch (error) {
        console.log('Plagiarism check failed:', error.message);
      }
    }

    const submission = await prisma.submission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: id,
          studentId: req.user.id
        }
      },
      update: {
        content,
        filePath: req.file?.path,
        status: isLate ? 'LATE' : 'SUBMITTED'
      },
      create: {
        assignmentId: id,
        studentId: req.user.id,
        content,
        filePath: req.file?.path,
        status: isLate ? 'LATE' : 'SUBMITTED'
      }
    });

    res.json({ 
      submission, 
      plagiarismScore,
      isLate 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Grade submission (Faculty only)
router.put('/submissions/:id/grade', auth, authorize('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { marks, feedback } = req.body;

    const submission = await prisma.submission.update({
      where: { id },
      data: {
        marks: parseInt(marks),
        feedback,
        status: 'GRADED',
        gradedAt: new Date()
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
        assignment: { select: { title: true } }
      }
    });

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;