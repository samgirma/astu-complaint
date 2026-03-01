const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create departments
  const departments = [
    { name: 'ICT', description: 'Information and Communication Technology' },
    { name: 'Maintenance', description: 'Facility Maintenance and Repairs' },
    { name: 'Library', description: 'Library Services and Resources' },
    { name: 'Cafeteria', description: 'Food Services and Cafeteria' },
    { name: 'Dormitory', description: 'Student Housing and Dormitories' },
    { name: 'Laboratory', description: 'Lab Equipment and Services' }
  ];

  console.log('Creating departments...');
  for (const dept of departments) {
    await prisma.staffDepartment.upsert({
      where: { name: dept.name },
      update: dept,
      create: dept
    });
  }

  // Create admin user
  console.log('Creating admin user...');
  const adminEmail = 'admin.user@astu.edu.et';
  const adminPassword = 'admin123456';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      fullName: 'System Administrator',
      role: 'ADMIN'
    }
  });

  console.log('Database seeding completed!');
  console.log(`Admin user created: ${adminEmail} / ${adminPassword}`);

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
