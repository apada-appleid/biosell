import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create super admin user if it doesn't exist
  const superAdminExists = await prisma.user.findUnique({
    where: { email: 'superadmin@shopgram.ir' },
  });

  if (!superAdminExists) {
    const hashedPassword = await bcrypt.hash('Shopgram@1402', 10);
    await prisma.user.create({
      data: {
        email: 'superadmin@shopgram.ir',
        password: hashedPassword,
        name: 'مدیر ارشد سیستم',
        role: 'superadmin',
      },
    });
    console.log('✅ سوپر ادمین با موفقیت ایجاد شد!');
  } else {
    console.log('ℹ️ سوپر ادمین از قبل وجود دارد.');
  }

  // Create regular admin user if it doesn't exist
  const adminExists = await prisma.user.findUnique({
    where: { email: 'admin@shopgram.ir' },
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('Admin@1402', 10);
    await prisma.user.create({
      data: {
        email: 'admin@shopgram.ir',
        password: hashedPassword,
        name: 'مدیر سیستم',
        role: 'admin',
      },
    });
    console.log('✅ ادمین با موفقیت ایجاد شد!');
  } else {
    console.log('ℹ️ ادمین از قبل وجود دارد.');
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
          'پشتیبانی از طریق تیکت',
        ]),
        maxProducts: 20,
      },
    });
    console.log('✅ پلن پایه ایجاد شد!');
  } else {
    console.log('ℹ️ پلن پایه از قبل وجود دارد.');
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
          'پشتیبانی اختصاصی تلفنی',
          'دامنه اختصاصی رایگان',
        ]),
        maxProducts: 100,
      },
    });
    console.log('✅ پلن حرفه‌ای ایجاد شد!');
  } else {
    console.log('ℹ️ پلن حرفه‌ای از قبل وجود دارد.');
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
          'پشتیبانی VIP تلفنی 24/7',
          'دامنه اختصاصی رایگان',
          'اپلیکیشن موبایل اختصاصی',
          'سئوی اختصاصی',
        ]),
        maxProducts: 999999,
      },
    });
    console.log('✅ پلن ویژه ایجاد شد!');
  } else {
    console.log('ℹ️ پلن ویژه از قبل وجود دارد.');
  }

  console.log('🚀 عملیات سیدینگ با موفقیت انجام شد!')
}

main()
  .catch((e) => {
    console.error('❌ خطا در اجرای سیدینگ:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 