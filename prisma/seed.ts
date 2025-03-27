import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create super admin user if it doesn't exist
  const superAdminExists = await prisma.user.findUnique({
    where: { email: 'superadmin@biosell.me' },
  });

  if (!superAdminExists) {
    const hashedPassword = await bcrypt.hash('Biosell@1402', 10);
    await prisma.user.create({
      data: {
        email: 'superadmin@biosell.me',
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
    where: { email: 'admin@biosell.me' },
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('Admin@1402', 10);
    await prisma.user.create({
      data: {
        email: 'admin@biosell.me',
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
    where: { name: 'یک ماهه' },
  });

  if (!basicPlanExists) {
    await prisma.plan.create({
      data: {
        name: 'یک ماهه',
        price: 500000,
        features: JSON.stringify([
          'آپلود تا 100 محصول',
          'گالری تصاویر محصول',
          'صفحه فروش اختصاصی',
          'پشتیبانی از طریق تیکت',
          'گزارش فروش پیشرفته',
          'پشتیبانی تلفنی',
          'اعتبار: 1 ماه',
        ]),
        maxProducts: 100,
      },
    });
    console.log('✅ پلن یک ماهه ایجاد شد!');
  } else {
    console.log('ℹ️ پلن یک ماهه از قبل وجود دارد.');
  }

  const proPlanExists = await prisma.plan.findFirst({
    where: { name: 'سه ماهه' },
  });

  if (!proPlanExists) {
    await prisma.plan.create({
      data: {
        name: 'سه ماهه',
        price: 1400000,
        features: JSON.stringify([
          'آپلود تا 100 محصول',
          'گالری تصاویر محصول',
          'صفحه فروش اختصاصی',
          'گزارش فروش پیشرفته',
          'پشتیبانی تلفنی',
          'دامنه اختصاصی رایگان',
          'اعتبار: 3 ماه',
          '7% تخفیف نسبت به پلن ماهانه',
        ]),
        maxProducts: 100,
      },
    });
    console.log('✅ پلن سه ماهه ایجاد شد!');
  } else {
    console.log('ℹ️ پلن سه ماهه از قبل وجود دارد.');
  }

  const premiumPlanExists = await prisma.plan.findFirst({
    where: { name: 'یک ساله' },
  });

  if (!premiumPlanExists) {
    await prisma.plan.create({
      data: {
        name: 'یک ساله',
        price: 5000000,
        features: JSON.stringify([
          'آپلود نامحدود محصول',
          'گالری تصاویر محصول',
          'صفحه فروش اختصاصی',
          'گزارش فروش پیشرفته',
          'پشتیبانی VIP تلفنی 24/7',
          'دامنه اختصاصی رایگان',
          'اپلیکیشن موبایل اختصاصی',
          'سئوی اختصاصی',
          'اعتبار: 12 ماه',
          '17% تخفیف نسبت به پلن ماهانه',
        ]),
        maxProducts: 999999,
      },
    });
    console.log('✅ پلن یک ساله ایجاد شد!');
  } else {
    console.log('ℹ️ پلن یک ساله از قبل وجود دارد.');
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