const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateSemesterData() {
  try {
    console.log('Starting year-based semester migration...');

    const currentYear = new Date().getFullYear();
    
    // Create or get active academic year
    let activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true }
    });

    if (!activeYear) {
      console.log('Creating default academic year...');
      activeYear = await prisma.academicYear.create({
        data: {
          year: currentYear,
          name: `${currentYear}-${currentYear + 1}`,
          isActive: true
        }
      });
      console.log(`Created academic year: ${activeYear.name}`);
    }

    // Update existing semesters to include year
    const allSemesters = await prisma.semester.findMany();
    const semestersWithoutYear = allSemesters.filter(s => !s.year);

    if (semestersWithoutYear.length > 0) {
      console.log(`Found ${semestersWithoutYear.length} semesters without year`);
      
      for (const semester of semestersWithoutYear) {
        // Extract year from semester name or code
        const yearMatch = semester.name?.match(/\d{4}/) || semester.code?.match(/\d{4}/);
        const semesterYear = yearMatch ? parseInt(yearMatch[0]) : currentYear;
        
        await prisma.semester.update({
          where: { id: semester.id },
          data: { year: semesterYear }
        });
        
        console.log(`Updated ${semester.name} with year ${semesterYear}`);
      }
    } else {
      console.log('All semesters already have year assigned');
    }

    // Update existing attendance records to include semester from active year
    const attendanceCount = await prisma.attendance.count({
      where: { semesterId: null }
    });

    if (attendanceCount > 0) {
      console.log(`Updating ${attendanceCount} attendance records with semester...`);
      
      // Get a semester from active year to assign
      const activeSemester = await prisma.semester.findFirst({
        where: { year: activeYear.year }
      });
      
      if (activeSemester) {
        await prisma.attendance.updateMany({
          where: { semesterId: null },
          data: { semesterId: activeSemester.id }
        });
        console.log('Attendance records updated successfully');
      }
    }

    // Update existing leave applications to include semester from active year
    const leaveCount = await prisma.leaveApplication.count({
      where: { semesterId: null }
    });

    if (leaveCount > 0) {
      console.log(`Updating ${leaveCount} leave applications with semester...`);
      
      const activeSemester = await prisma.semester.findFirst({
        where: { year: activeYear.year }
      });
      
      if (activeSemester) {
        await prisma.leaveApplication.updateMany({
          where: { semesterId: null },
          data: { semesterId: activeSemester.id }
        });
        console.log('Leave applications updated successfully');
      }
    }

    // Update existing courses to include semester from active year
    const courseCount = await prisma.course.count({
      where: { semesterId: null }
    });

    if (courseCount > 0) {
      console.log(`Updating ${courseCount} courses with semester...`);
      
      const activeSemester = await prisma.semester.findFirst({
        where: { year: activeYear.year }
      });
      
      if (activeSemester) {
        await prisma.course.updateMany({
          where: { semesterId: null },
          data: { semesterId: activeSemester.id }
        });
        console.log('Courses updated successfully');
      }
    }

    // Update existing enrollments to include semester from active year
    const enrollmentCount = await prisma.enrollment.count({
      where: { semesterId: null }
    });

    if (enrollmentCount > 0) {
      console.log(`Updating ${enrollmentCount} enrollments with semester...`);
      
      const activeSemester = await prisma.semester.findFirst({
        where: { year: activeYear.year }
      });
      
      if (activeSemester) {
        await prisma.enrollment.updateMany({
          where: { semesterId: null },
          data: { semesterId: activeSemester.id }
        });
        console.log('Enrollments updated successfully');
      }
    }

    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateSemesterData();
}

module.exports = migrateSemesterData;