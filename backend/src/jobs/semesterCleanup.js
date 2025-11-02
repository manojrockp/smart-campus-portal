const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Run daily at midnight to check for expired semesters
const semesterCleanupJob = cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Running semester cleanup job...');
    
    const now = new Date();
    
    // Find active semesters that have ended
    const expiredSemesters = await prisma.semester.updateMany({
      where: {
        isActive: true,
        endDate: { lt: now }
      },
      data: {
        isActive: false
      }
    });
    
    if (expiredSemesters.count > 0) {
      console.log(`Marked ${expiredSemesters.count} expired semesters as inactive`);
    }
    
  } catch (error) {
    console.error('Semester cleanup job error:', error);
  }
}, {
  scheduled: false
});

module.exports = semesterCleanupJob;