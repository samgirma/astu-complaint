const { PrismaClient } = require('@prisma/client');
require('express-async-errors');

// Handle BigInt serialization
BigInt.prototype.toJSON = function() {
  return this.toString();
};

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Test database connection
const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  console.log('📴 Database disconnected');
});

module.exports = { prisma, connectDB };
