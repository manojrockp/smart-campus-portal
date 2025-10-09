const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const seedStudentData = async () => {
  try {
    console.log('Starting to seed student data...');

    // Find the student
    const student = await prisma.user.findUnique({
      where: { email: 'kushmithabs@gmail.com' }
    });

    if (!student) {
      console.log('Student not found');
      return;
    }

    console.log('Found student:', student.firstName, student.lastName);

    // Create semesters
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
        startDate: new Date('2025-08-01'),
        endDate: new Date('2025-12-31')
      }
    ];

    // Create courses for each semester
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
      console.log(`Creating semester: ${semesters[i].name}`);
      
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

      const isCurrentSemester = i === 4;
      const attendanceRate = [0.85, 0.78, 0.92, 0.88, 0.75][i];
      
      if (!isCurrentSemester) {
        const totalDays = Math.floor((semester.endDate - semester.startDate) / (1000 * 60 * 60 * 24));
        const classDays = Math.floor(totalDays * 0.7);
        
        for (const course of semesterCourses) {
          for (let day = 0; day < classDays; day++) {
            const classDate = new Date(semester.startDate);
            classDate.setDate(classDate.getDate() + day * 1.4);
            
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
      } else {
        const daysSinceStart = Math.floor((new Date() - semester.startDate) / (1000 * 60 * 60 * 24));
        const classDays = Math.floor(daysSinceStart * 0.7);
        
        for (const course of semesterCourses) {
          for (let day = 0; day < classDays; day++) {
            const classDate = new Date(semester.startDate);
            classDate.setDate(classDate.getDate() + day * 1.4);
            
            if (classDate <= new Date()) {
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
      }

      console.log(`Completed semester: ${semesters[i].name}`);
    }

    console.log('Student data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding student data:', error);
  } finally {
    await prisma.$disconnect();
  }
};

seedStudentData();