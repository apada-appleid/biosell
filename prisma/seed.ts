import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user if it doesn't exist
  const adminExists = await prisma.user.findUnique({
    where: { email: 'admin@admin' },
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await prisma.user.create({
      data: {
        email: 'admin@admin',
        password: hashedPassword,
        name: 'مدیر سیستم',
        role: 'admin',
      },
    });
    console.log('Admin user created!');
  } else {
    console.log('Admin user already exists.');
  }

  // Create subscription plans
  const basicPlanExists = await prisma.plan.findFirst({
    where: { name: 'پایه' },
  });

  if (!basicPlanExists) {
    await prisma.plan.create({
      data: {
        name: 'پایه',
        price: 99000,
        features: JSON.stringify([
          'آپلود تا 20 محصول',
          'گالری تصاویر محصول',
          'صفحه فروش اختصاصی',
        ]),
        maxProducts: 20,
      },
    });
    console.log('Basic plan created!');
  }

  const proPlanExists = await prisma.plan.findFirst({
    where: { name: 'حرفه‌ای' },
  });

  if (!proPlanExists) {
    await prisma.plan.create({
      data: {
        name: 'حرفه‌ای',
        price: 199000,
        features: JSON.stringify([
          'آپلود تا 100 محصول',
          'گالری تصاویر محصول',
          'صفحه فروش اختصاصی',
          'گزارش فروش پیشرفته',
          'پشتیبانی اختصاصی',
        ]),
        maxProducts: 100,
      },
    });
    console.log('Pro plan created!');
  }

  const premiumPlanExists = await prisma.plan.findFirst({
    where: { name: 'ویژه' },
  });

  if (!premiumPlanExists) {
    await prisma.plan.create({
      data: {
        name: 'ویژه',
        price: 299000,
        features: JSON.stringify([
          'آپلود نامحدود محصول',
          'گالری تصاویر محصول',
          'صفحه فروش اختصاصی',
          'گزارش فروش پیشرفته',
          'پشتیبانی اختصاصی',
          'اپلیکیشن موبایل اختصاصی',
        ]),
        maxProducts: 999999,
      },
    });
    console.log('Premium plan created!');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 