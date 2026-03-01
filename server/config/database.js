const { PrismaClient } = require('@prisma/client');
require('express-async-errors');

// Handle BigInt serialization
BigInt.prototype.toJSON = function() {
  return this.toString();
};

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Test database connection and run migrations
const connectDB = async () => {
  try {
    await prisma.$connect();
    
    // Run database migrations in production
    if (process.env.NODE_ENV === 'production') {
      const { execSync } = require('child_process');
      try {
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      } catch (migrationError) {
        // If migrations fail, try generating client first
        try {
          execSync('npx prisma generate', { stdio: 'inherit' });
          execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        } catch (fallbackError) {
          throw fallbackError;
        }
      }
    }
  } catch (error) {
    process.exit(1);
  }
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = { prisma, connectDB };
