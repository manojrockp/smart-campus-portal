const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const seedSecondStudentData = async () => {
  try {
    console.log('Starting to seed second student data...');

    // Find the student
    const student = await prisma.user.findUnique({
      where: { email: 'deepub@gmail.com' }
    });

    if (!student) {
      console.log('Student not found');
      return;
    }

    console.log('Found student:', student.firstName, student.lastName);

    // For a Year 2 student, they should have completed 3 semesters and be in 4th semester
    const semesters = [
      {
        name: '1st Semester',
        code: 'SEM1_2023',
        year: 2023,
        startDate: new Date('2023-08-01'),
        endDate: new Date('2023-12-15')
      },
      {
        name: '2nd Semester',
        code: 'SEM2_2024',
        year: 2024,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-05-30')
      },
      {
        name: '3rd Semester',
        code: 'SEM3_2024',
        year: 2024,
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-12-15')
      },
      {
        name: '4th Semester',
        code: 'SEM4_2025',
        year: 2025,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-05-30')
      }
    ];

    const coursesBySemester = [
      // 1st Semester
      [
        { name: 'Engineering Mathematics I', code: 'MATH101', credits: 4 },
        { name: 'Engineering Physics', code: 'PHY101', credits: 4 },
        { name: 'Programming in C', code: 'CS101', credits: 3 },
        { name: 'Engineering Graphics', code: 'EG101', credits: 2 }
      ],
      // 2nd Semester
      [
        { name: 'Engineering Mathematics II', code: 'MATH102', credits: 4 },
        { name: 'Engineering Chemistry', code: 'CHEM101', credits: 4 },
        { name: 'Data Structures', code: 'CS102', credits: 4 },
        { name: 'Digital Electronics', code: 'EC101', credits: 3 }
      ],
      // 3rd Semester
      [
        { name: 'Discrete Mathematics', code: 'MATH201', credits: 3 },
        { name: 'Computer Organization', code: 'CS201', credits: 4 },
        { name: 'Object Oriented Programming', code: 'CS202', credits: 4 },
        { name: 'Database Management Systems', code: 'CS203', credits: 4 }
      ],
      // 4th Semester (Current)
      [
        { name: 'Design and Analysis of Algorithms', code: 'CS301', credits: 4 },
        { name: 'Operating Systems', code: 'CS302', credits: 4 },
        { name: 'Computer Networks', code: 'CS303', credits: 4 },
        { name: 'Software Engineering', code: 'CS304', credits: 3 }
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

      // Enroll student in courses
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

      // Generate attendance based on semester status
      const now = new Date();
      const semesterStart = new Date(semester.startDate);
      const semesterEnd = new Date(semester.endDate);
      const isCurrentSemester = i === 3; // 4th semester is current
      const attendanceRates = [0.88, 0.82, 0.91, 0.85]; // Different rates for each semester
      
      if (semesterEnd < now) {
        // Completed semester
        console.log(`Generating attendance for completed semester: ${semester.name}`);
        const totalDays = Math.floor((semesterEnd - semesterStart) / (1000 * 60 * 60 * 24));
        const classDays = Math.floor(totalDays * 0.6);
        
        for (const course of semesterCourses) {
          for (let day = 0; day < classDays; day++) {
            const classDate = new Date(semesterStart);
            classDate.setDate(classDate.getDate() + Math.floor(day * 1.5));
            
            if (classDate <= semesterEnd) {
              const isPresent = Math.random() < attendanceRates[i];
              
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
      } else if (isCurrentSemester) {
        // Current semester - partial attendance
        console.log(`Generating attendance for current semester: ${semester.name}`);
        const daysSinceStart = Math.floor((now - semesterStart) / (1000 * 60 * 60 * 24));
        const classDays = Math.floor(daysSinceStart * 0.6);
        
        for (const course of semesterCourses) {
          for (let day = 0; day < classDays; day++) {
            const classDate = new Date(semesterStart);
            classDate.setDate(classDate.getDate() + Math.floor(day * 1.5));
            
            if (classDate <= now) {
              const isPresent = Math.random() < attendanceRates[i];
              
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

    console.log('Second student data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding second student data:', error);
  } finally {
    await prisma.$disconnect();
  }
};

seedSecondStudentData();