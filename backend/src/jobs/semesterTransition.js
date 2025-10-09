const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Check and transition semesters automatically
const checkSemesterTransitions = async () => {
  try {
    const now = new Date();
    console.log('Checking semester transitions at:', now);

    // Find semesters that have ended
    const endedSemesters = await prisma.semester.findMany({
      where: {
        endDate: { lt: now }
      },
      include: {
        enrollments: {
          include: {
            user: true,
            course: true
          }
        }
      }
    });

    if (endedSemesters.length === 0) {
      console.log('No semesters to transition');
      return;
    }

    for (const semester of endedSemesters) {
      console.log(`Processing ended semester: ${semester.name}`);
      
      // Get all students from this semester
      const students = semester.enrollments.map(e => e.user).filter(u => u.role === 'STUDENT');
      const uniqueStudents = students.reduce((acc, student) => {
        if (!acc.find(s => s.id === student.id)) {
          acc.push(student);
        }
        return acc;
      }, []);

      console.log(`Found ${uniqueStudents.length} students to transition`);

      // Find next semester for these students
      const nextSemester = await prisma.semester.findFirst({
        where: {
          startDate: { gt: semester.endDate },
          year: semester.year // Same academic year or next
        },
        orderBy: { startDate: 'asc' }
      });

      if (nextSemester) {
        console.log(`Next semester found: ${nextSemester.name}`);
        
        // Auto-enroll students in next semester courses
        const nextSemesterCourses = await prisma.course.findMany({
          where: { semesterId: nextSemester.id }
        });

        for (const student of uniqueStudents) {
          for (const course of nextSemesterCourses) {
            try {
              await prisma.enrollment.create({
                data: {
                  userId: student.id,
                  courseId: course.id,
                  semesterId: nextSemester.id
                }
              });
            } catch (error) {
              // Skip if already enrolled
              if (error.code !== 'P2002') {
                console.error(`Error enrolling student ${student.id} in course ${course.id}:`, error);
              }
            }
          }
        }
        
        console.log(`Auto-enrolled ${uniqueStudents.length} students in ${nextSemester.name}`);
      } else {
        console.log(`No next semester found for ${semester.name}`);
      }
    }

  } catch (error) {
    console.error('Semester transition error:', error);
  }
};

// Run semester transition check
const runSemesterTransition = () => {
  console.log('Starting semester transition job...');
  checkSemesterTransitions();
};

module.exports = {
  checkSemesterTransitions,
  runSemesterTransition
};