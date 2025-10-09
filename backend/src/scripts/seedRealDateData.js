const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const seedRealDateData = async () => {
  try {
    console.log('Starting to seed real date student data...');

    const student = await prisma.user.findUnique({
      where: { email: 'kushmithabs@gmail.com' }
    });

    if (!student) {
      console.log('Student not found');
      return;
    }

    // Real academic year dates
    const semesters = [
      {
        name: '1st Semester',
        code: 'SEM1_2024',
        year: 2024,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-30')
      },
      {
        name: '2nd Semester', 
        code: 'SEM2_2024',
        year: 2024,
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-08-30')
      },
      {
        name: '3rd Semester',
        code: 'SEM3_2024', 
        year: 2024,
        startDate: new Date('2024-10-01'),
        endDate: new Date('2025-01-30')
      },
      {
        name: '4th Semester',
        code: 'SEM4_2025',
        year: 2025,
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-07-30')
      },
      {
        name: '5th Semester',
        code: 'SEM5_2025',
        year: 2025,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31')
      }
    ];

    const coursesBySemester = [
      [
        { name: 'Mathematics I', code: 'MATH101', credits: 4 },
        { name: 'Physics I', code: 'PHY101', credits: 4 },
        { name: 'Programming Fundamentals', code: 'CS101', credits: 3 }
      ],
      [
        { name: 'Mathematics II', code: 'MATH102', credits: 4 },
        { name: 'Physics II', code: 'PHY102', credits: 4 },
        { name: 'Data Structures', code: 'CS102', credits: 3 }
      ],
      [
        { name: 'Database Systems', code: 'CS201', credits: 3 },
        { name: 'Computer Networks', code: 'CS202', credits: 3 },
        { name: 'Software Engineering', code: 'CS203', credits: 3 }
      ],
      [
        { name: 'Web Development', code: 'CS301', credits: 3 },
        { name: 'Machine Learning', code: 'CS302', credits: 4 },
        { name: 'Operating Systems', code: 'CS303', credits: 3 }
      ],
      [
        { name: 'AI & Deep Learning', code: 'CS401', credits: 4 },
        { name: 'Cloud Computing', code: 'CS402', credits: 3 },
        { name: 'Cybersecurity', code: 'CS403', credits: 3 }
      ]
    ];

    for (let i = 0; i < semesters.length; i++) {
      console.log(`Processing semester: ${semesters[i].name}`);
      
      const semester = await prisma.semester.upsert({
        where: { code: semesters[i].code },
        update: semesters[i],
        create: semesters[i]
      });

      const semesterCourses = [];
      for (const courseData of coursesBySemester[i]) {
        const course = await prisma.course.upsert({
          where: { code: courseData.code },
          update: { ...courseData, semesterId: semester.id },
          create: { ...courseData, semesterId: semester.id }
        });
        semesterCourses.push(course);
      }

      for (const course of semesterCourses) {
        await prisma.enrollment.upsert({
          where: {
            userId_courseId: {
              userId: student.id,
              courseId: course.id
            }
          },
          update: { semesterId: semester.id },
          create: {
            userId: student.id,
            courseId: course.id,
            semesterId: semester.id
          }
        });
      }

      // Check if semester is completed, current, or future
      const now = new Date();
      const semesterStart = new Date(semester.startDate);
      const semesterEnd = new Date(semester.endDate);
      
      if (semesterEnd < now) {
        // Completed semester - generate full attendance
        console.log(`Generating attendance for completed semester: ${semester.name}`);
        const totalDays = Math.floor((semesterEnd - semesterStart) / (1000 * 60 * 60 * 24));
        const classDays = Math.floor(totalDays * 0.6); // 60% are class days
        const attendanceRate = [0.85, 0.78, 0.92, 0.88, 0.75][i];
        
        for (const course of semesterCourses) {
          for (let day = 0; day < classDays; day++) {
            const classDate = new Date(semesterStart);
            classDate.setDate(classDate.getDate() + Math.floor(day * 1.5));
            
            if (classDate <= semesterEnd) {
              const isPresent = Math.random() < attendanceRate;
              
              await prisma.attendance.upsert({
                where: {
                  userId_courseId_date: {
                    userId: student.id,
                    courseId: course.id,
                    date: classDate
                  }
                },
                update: {
                  status: isPresent ? 'PRESENT' : 'ABSENT',
                  semesterId: semester.id
                },
                create: {
                  userId: student.id,
                  courseId: course.id,
                  date: classDate,
                  status: isPresent ? 'PRESENT' : 'ABSENT',
                  semesterId: semester.id
                }
              });
            }
          }
        }
      } else if (semesterStart <= now && now <= semesterEnd) {
        // Current semester - generate partial attendance
        console.log(`Generating attendance for current semester: ${semester.name}`);
        const daysSinceStart = Math.floor((now - semesterStart) / (1000 * 60 * 60 * 24));
        const classDays = Math.floor(daysSinceStart * 0.6);
        const attendanceRate = [0.85, 0.78, 0.92, 0.88, 0.75][i];
        
        for (const course of semesterCourses) {
          for (let day = 0; day < classDays; day++) {
            const classDate = new Date(semesterStart);
            classDate.setDate(classDate.getDate() + Math.floor(day * 1.5));
            
            if (classDate <= now) {
              const isPresent = Math.random() < attendanceRate;
              
              await prisma.attendance.upsert({
                where: {
                  userId_courseId_date: {
                    userId: student.id,
                    courseId: course.id,
                    date: classDate
                  }
                },
                update: {
                  status: isPresent ? 'PRESENT' : 'ABSENT',
                  semesterId: semester.id
                },
                create: {
                  userId: student.id,
                  courseId: course.id,
                  date: classDate,
                  status: isPresent ? 'PRESENT' : 'ABSENT',
                  semesterId: semester.id
                }
              });
            }
          }
        }
      } else {
        // Future semester - no attendance yet
        console.log(`Future semester: ${semester.name} - no attendance generated`);
      }
    }

    console.log('Real date student data seeding completed!');
  } catch (error) {
    console.error('Error seeding real date data:', error);
  } finally {
    await prisma.$disconnect();
  }
};

seedRealDateData();