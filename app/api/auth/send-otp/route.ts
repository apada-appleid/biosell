import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOtpCode } from '@/utils/sms-service';

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

    // Check if user exists
    let user = await prisma.customer.findFirst({
      where: { mobile }
    });

    if (!user) {
      // Create new user if not exists
      try {
        user = await prisma.customer.create({
          data: {
            mobile,
            fullName: '', // Will be updated later
            email: `${mobile}@example.com`, // Use mobile number as part of email to ensure uniqueness
          },
        });
      } catch (createError) {
        console.error('Error creating customer:', createError);
        // If creation fails, try to fetch the user again (in case it was created by a concurrent request)
        user = await prisma.customer.findFirst({
          where: { mobile }
        });
        
        if (!user) {
          throw new Error('Unable to create or retrieve customer');
        }
      }
    }

    // Send OTP using hybrid approach (local in development, Melipayamak in production)
    const smsResult = await sendOtpCode(mobile);
    
    if (!smsResult.success) {
      return NextResponse.json(
        { error: smsResult.message || 'خطا در ارسال کد تأیید' },
        { status: 500 }
      );
    }

    // Get the OTP code from the result
    const otpCode = smsResult.code;
    
    if (!otpCode) {
      return NextResponse.json(
        { error: 'کد تأیید تولید نشد' },
        { status: 500 }
      );
    }

    // Set expiration time (2 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 2);

    // Save OTP to database
    await prisma.otp.upsert({
      where: { mobile },
      update: { 
        code: otpCode,
        expiresAt,
        verified: false,
      },
      create: {
        mobile,
        code: otpCode,
        expiresAt,
        verified: false,
      },
    });

    // Log OTP for development
    console.log(`OTP for ${mobile}: ${otpCode}`);

    const isDevelopment = process.env.NODE_ENV === 'development';

    return NextResponse.json(
      { 
        message: isDevelopment 
          ? 'کد تأیید (محلی) با موفقیت تولید شد' 
          : 'کد تأیید با موفقیت ارسال شد',
        success: true,
        // Return the OTP for development (and display in UI)
        otp: isDevelopment ? otpCode : undefined
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