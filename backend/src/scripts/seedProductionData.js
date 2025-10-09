const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const seedProductionData = async () => {
  try {
    console.log('🌱 Starting production data seeding...');

    // Create default admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@smartcampus.edu' },
      update: {},
      create: {
        email: 'admin@smartcampus.edu',
        password: adminPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'ADMIN',
        employeeId: 'ADMIN001'
      }
    });
    console.log('✅ Admin user created');

    // Create sample faculty
    const facultyPassword = await bcrypt.hash('faculty123', 10);
    const faculty = await prisma.user.upsert({
      where: { email: 'faculty@smartcampus.edu' },
      update: {},
      create: {
        email: 'faculty@smartcampus.edu',
        password: facultyPassword,
        firstName: 'John',
        lastName: 'Professor',
        role: 'FACULTY',
        employeeId: 'FAC001'
      }
    });
    console.log('✅ Sample faculty created');

    // Create academic year
    const currentYear = new Date().getFullYear();
    const academicYear = await prisma.academicYear.upsert({
      where: { year: currentYear },
      update: { isActive: true },
      create: {
        year: currentYear,
        name: `${currentYear}-${currentYear + 1}`,
        isActive: true
      }
    });
    console.log('✅ Academic year created');

    // Create sample semesters
    const semesters = [
      {
        name: '1st Semester',
        code: `SEM1_${currentYear}`,
        year: currentYear,
        startDate: new Date(`${currentYear}-08-01`),
        endDate: new Date(`${currentYear}-12-15`)
      },
      {
        name: '2nd Semester',
        code: `SEM2_${currentYear + 1}`,
        year: currentYear,
        startDate: new Date(`${currentYear + 1}-01-15`),
        endDate: new Date(`${currentYear + 1}-05-30`)
      }
    ];

    for (const semesterData of semesters) {
      await prisma.semester.upsert({
        where: { code: semesterData.code },
        update: semesterData,
        create: semesterData
      });
    }
    console.log('✅ Sample semesters created');

    // Create sample courses
    const courses = [
      { name: 'Mathematics I', code: 'MATH101', credits: 4 },
      { name: 'Physics I', code: 'PHY101', credits: 4 },
      { name: 'Programming Fundamentals', code: 'CS101', credits: 3 },
      { name: 'Database Systems', code: 'CS201', credits: 4 },
      { name: 'Web Development', code: 'CS301', credits: 3 }
    ];

    for (const courseData of courses) {
      await prisma.course.upsert({
        where: { code: courseData.code },
        update: courseData,
        create: courseData
      });
    }
    console.log('✅ Sample courses created');

    console.log('🎉 Production data seeding completed!');
    console.log('📧 Admin login: admin@smartcampus.edu / admin123');
    console.log('👨‍🏫 Faculty login: faculty@smartcampus.edu / faculty123');

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await prisma.$disconnect();
  }
};

seedProductionData();