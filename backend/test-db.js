const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    console.log('Database URL:', process.env.DATABASE_URL ? 'Set ✓' : 'Not set ✗');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ MongoDB connection successful!');
    
    // Test a simple query
    const result = await prisma.$runCommandRaw({ ping: 1 });
    console.log('✅ Database ping successful:', result);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('DNS resolution')) {
      console.log('\n💡 Possible fixes:');
      console.log('1. Check your cluster name in the connection string');
      console.log('2. Ensure your cluster is running');
      console.log('3. Verify network access settings in MongoDB Atlas');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();