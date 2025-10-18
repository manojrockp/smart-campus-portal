const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Fix existing semesters with null year values
router.post('/fix-semesters', async (req, res) => {
  try {
    console.log('Fixing semesters with null year values...');

    // Get all semesters
    const semesters = await prisma.$queryRaw`db.semesters.find({})`;
    console.log('Found semesters:', semesters.length);

    // Update semesters with null year based on their name or date
    for (const semester of semesters) {
      let year = 2024; // default year
      
      // Try to extract year from name
      if (semester.name) {
        const yearMatch = semester.name.match(/(\d{4})/);
        if (yearMatch) {
          year = parseInt(yearMatch[1]);
        }
      }
      
      // Try to extract year from startDate
      if (semester.startDate) {
        const startYear = new Date(semester.startDate).getFullYear();
        if (startYear > 2020 && startYear < 2030) {
          year = startYear;
        }
      }

      console.log(`Updating semester ${semester.name} with year ${year}`);
      
      await prisma.$queryRaw`
        db.semesters.updateOne(
          { _id: ${semester._id} },
          { $set: { year: ${year} } }
        )
      `;
    }

    res.json({ 
      message: 'Semesters fixed successfully',
      count: semesters.length
    });

  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ message: 'Migration failed', error: error.message });
  }
});

module.exports = router;