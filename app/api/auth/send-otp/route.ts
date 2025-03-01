import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Function to generate a random 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export async function POST(request: Request) {
  try {
    const { mobile } = await request.json();

    if (!mobile) {
      return NextResponse.json(
        { error: 'شماره موبایل الزامی است' },
        { status: 400 }
      );
    }

    // Check if mobile is in valid format (simple validation)
    const mobileRegex = /^09\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      return NextResponse.json(
        { error: 'فرمت شماره موبایل نامعتبر است' },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 2); // OTP expires in 2 minutes

    // Check if user exists
    let user = await prisma.customer.findFirst({
      where: { mobile }
    });

    if (!user) {
      // Create new user if not exists
      user = await prisma.customer.create({
        data: {
          mobile,
          fullName: '', // Will be updated later
          email: '', // Will be updated later
        },
      });
    }

    // Save OTP to database (you might use a different table for OTPs)
    await prisma.otp.upsert({
      where: { mobile },
      update: { 
        code: otp,
        expiresAt,
        verified: false,
      },
      create: {
        mobile,
        code: otp,
        expiresAt,
        verified: false,
      },
    });

    // TODO: Integrate with SMS service in the future
    // For now, just log the OTP to console
    console.log(`OTP for ${mobile}: ${otp}`);

    return NextResponse.json(
      { 
        message: 'کد تأیید با موفقیت ارسال شد',
        // In development, return the OTP for testing, in production this should be removed
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: 'خطا در ارسال کد تأیید' },
      { status: 500 }
    );
  }
} 