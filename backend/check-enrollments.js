const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkEnrollments() {
  try {
    console.log('Checking enrollments in database...')
    
    const enrollments = await prisma.enrollment.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            studentId: true,
            year: true,
            section: true
          }
        },
        course: {
          select: {
            name: true,
            code: true
          }
        }
      }
    })
    
    console.log(`Found ${enrollments.length} enrollments:`)
    
    enrollments.forEach((enrollment, index) => {
      console.log(`${index + 1}. ${enrollment.user.firstName} ${enrollment.user.lastName} (${enrollment.user.studentId}) - ${enrollment.user.year}${enrollment.user.year === 1 ? 'st' : enrollment.user.year === 2 ? 'nd' : enrollment.user.year === 3 ? 'rd' : 'th'} Year Section ${enrollment.user.section}`)
      console.log(`   Course: ${enrollment.course.name} (${enrollment.course.code})`)
      console.log(`   Enrolled: ${enrollment.createdAt}`)
      console.log('')
    })
    
    if (enrollments.length === 0) {
      console.log('No enrollments found in database')
    }
    
  } catch (error) {
    console.error('Error checking enrollments:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkEnrollments()