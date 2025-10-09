const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkFacultyCourses() {
  try {
    console.log('Checking faculty course assignments...')
    
    const facultyCourses = await prisma.facultyCourse.findMany({
      include: {
        faculty: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true
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
    
    console.log(`Found ${facultyCourses.length} faculty course assignments:`)
    
    facultyCourses.forEach((assignment, index) => {
      console.log(`${index + 1}. ${assignment.faculty.firstName} ${assignment.faculty.lastName} (${assignment.faculty.employeeId})`)
      console.log(`   Course: ${assignment.course.name} (${assignment.course.code})`)
      console.log(`   Assigned: ${assignment.createdAt}`)
      console.log('')
    })
    
    if (facultyCourses.length === 0) {
      console.log('No faculty course assignments found in database')
    }
    
    // Also check faculty users
    console.log('\nChecking faculty users...')
    const faculty = await prisma.user.findMany({
      where: { role: 'FACULTY' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        employeeId: true
      }
    })
    
    console.log(`Found ${faculty.length} faculty users:`)
    faculty.forEach((f, index) => {
      console.log(`${index + 1}. ${f.firstName} ${f.lastName} (${f.employeeId}) - ID: ${f.id}`)
    })
    
  } catch (error) {
    console.error('Error checking faculty courses:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkFacultyCourses()