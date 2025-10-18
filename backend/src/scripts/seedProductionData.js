const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding production database...');

  try {
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@smartcampus.edu' },
      update: {},
      create: {
        email: 'admin@smartcampus.edu',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'ADMIN',
        employeeId: 'ADMIN001'
      }
    });

    // Create default semester
    const semester = await prisma.semester.upsert({
      where: { code: 'FALL2024' },
      update: {},
      create: {
        name: 'Fall 2024',
        code: 'FALL2024',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-12-15'),
        isActive: true
      }
    });

    // Create sample courses
    const courses = [
      { name: 'Computer Science Fundamentals', code: 'CS101', credits: 3 },
      { name: 'Mathematics for Engineers', code: 'MATH201', credits: 4 },
      { name: 'Database Systems', code: 'CS301', credits: 3 }
    ];

    for (const courseData of courses) {
      await prisma.course.upsert({
        where: { code: courseData.code },
        update: {},
        create: {
          ...courseData,
          semesterId: semester.id
        }
      });
    }

    console.log('✅ Production data seeded successfully');
    console.log('📧 Admin Email: admin@smartcampus.edu');
    console.log('🔑 Admin Password: admin123');
    console.log('⚠️  Please change the admin password after first login');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });