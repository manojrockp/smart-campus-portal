const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testStudentCourses() {
  try {
    console.log('Testing student course visibility...')
    
    // Get a sample student
    const student = await prisma.user.findFirst({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentId: true
      }
    })
    
    if (!student) {
      console.log('No students found')
      return
    }
    
    console.log(`Testing for student: ${student.firstName} ${student.lastName} (${student.studentId})`)
    console.log(`Student ID: ${student.id}`)
    
    // Get student's enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: student.id },
      include: {
        course: {
          include: {
            semester: true,
            _count: { select: { enrollments: true } }
          }
        }
      }
    })
    
    console.log(`\nFound ${enrollments.length} enrollments for this student:`)
    
    enrollments.forEach((enrollment, index) => {
      console.log(`${index + 1}. Course: ${enrollment.course.name} (${enrollment.course.code})`)
      console.log(`   Semester: ${enrollment.course.semester?.name || 'Not assigned'}`)
      console.log(`   Credits: ${enrollment.course.credits}`)
      console.log(`   Total enrollments: ${enrollment.course._count.enrollments}`)
      console.log('')
    })
    
    if (enrollments.length === 0) {
      console.log('This student is not enrolled in any courses')
    }
    
  } catch (error) {
    console.error('Error testing student courses:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testStudentCourses()