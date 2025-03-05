import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signJwtAccessToken } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const { mobile, code } = await request.json();

    if (!mobile || !code) {
      return NextResponse.json(
        { error: 'شماره موبایل و کد تأیید الزامی هستند' },
        { status: 400 }
      );
    }

    // Check if OTP exists and is valid
    const otp = await prisma.otp.findFirst({
      where: {
        mobile,
        code,
        expiresAt: {
          gte: new Date()
        },
        verified: false
      }
    });

    if (!otp) {
      return NextResponse.json(
        { error: 'کد تأیید نامعتبر یا منقضی شده است' },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    await prisma.otp.update({
      where: { id: otp.id },
      data: { verified: true }
    });

    // Get or create customer
    const customer = await prisma.customer.findFirst({
      where: { mobile }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // Generate JWT token with consistent structure including type
    const token = signJwtAccessToken({
      id: customer.id,
      mobile: customer.mobile || '',
      type: 'customer' as const,
      // Include any other fields needed for both systems
    });

    return NextResponse.json(
      {
        message: 'ورود با موفقیت انجام شد',
        token,
        user: {
          id: customer.id,
          name: customer.fullName,
          mobile: customer.mobile,
          email: customer.email || `${customer.mobile}@example.com`,
          type: 'customer'
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'خطا در تأیید کد' },
      { status: 500 }
    );
  }
} 