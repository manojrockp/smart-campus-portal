const { PrismaClient } = require('@prisma/client');

async function diagnoseSemesterIssue() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking database connection...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if semesters table exists and has data
    const semesterCount = await prisma.semester.count();
    console.log(`📊 Found ${semesterCount} semesters in database`);
    
    // Check if academic years exist
    const yearCount = await prisma.academicYear.count();
    console.log(`📅 Found ${yearCount} academic years in database`);
    
    // Get all semesters
    const semesters = await prisma.semester.findMany({
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
    
    console.log('📋 Semesters in database:');
    semesters.forEach(semester => {
      console.log(`  - ${semester.name} (${semester.code}) - Year ${semester.year}`);
      console.log(`    Courses: ${semester._count.courses}, Enrollments: ${semester._count.enrollments}`);
    });
    
    // If no semesters exist, create sample data
    if (semesterCount === 0) {
      console.log('🔧 Creating sample semester data...');
      
      // Create academic year
      const currentYear = new Date().getFullYear();
      await prisma.academicYear.upsert({
        where: { year: currentYear },
        update: { isActive: true },
        create: {
          year: currentYear,
          name: `${currentYear}-${currentYear + 1}`,
          isActive: true
        }
      });
      
      // Create sample semesters
      const sampleSemesters = [
        {
          name: 'Fall 2024',
          code: 'FALL2024',
          year: currentYear,
          startDate: new Date(`${currentYear}-08-15`),
          endDate: new Date(`${currentYear}-12-15`)
        },
        {
          name: 'Spring 2025',
          code: 'SPRING2025',
          year: currentYear,
          startDate: new Date(`${currentYear + 1}-01-15`),
          endDate: new Date(`${currentYear + 1}-05-15`)
        }
      ];
      
      for (const semesterData of sampleSemesters) {
        await prisma.semester.create({ data: semesterData });
        console.log(`  ✅ Created ${semesterData.name}`);
      }
    }
    
    console.log('✅ Semester diagnosis complete!');
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error.message);
    
    if (error.code === 'P1001') {
      console.log('💡 Database connection failed. Make sure PostgreSQL is running.');
    } else if (error.code === 'P2021') {
      console.log('💡 Table does not exist. Run: npx prisma migrate dev');
    }
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseSemesterIssue();