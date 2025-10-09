const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearAllCourses() {
  try {
    console.log('Starting to clear all courses...')
    
    // Delete related records first to avoid foreign key constraints
    console.log('Deleting enrollments...')
    await prisma.enrollment.deleteMany({})
    
    console.log('Deleting attendance records...')
    await prisma.attendance.deleteMany({})
    
    console.log('Deleting assignments...')
    await prisma.assignment.deleteMany({})
    
    console.log('Deleting faculty course assignments...')
    await prisma.facultyCourse.deleteMany({})
    
    console.log('Deleting timetable entries...')
    await prisma.timetable.deleteMany({})
    
    console.log('Deleting all courses...')
    const result = await prisma.course.deleteMany({})
    
    console.log(`✅ Successfully deleted ${result.count} courses and all related data`)
    
  } catch (error) {
    console.error('❌ Error clearing courses:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearAllCourses()