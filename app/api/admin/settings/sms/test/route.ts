import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { sendOtpCode } from '@/utils/sms-service';

// POST /api/admin/settings/sms/test - Send test SMS
export async function POST(request: Request) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get mobile number from request
    const { mobile } = await request.json();
    
    if (!mobile) {
      return NextResponse.json(
        { success: false, message: 'شماره موبایل الزامی است' },
        { status: 400 }
      );
    }

    // Check mobile format
    const mobileRegex = /^09\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      return NextResponse.json(
        { success: false, message: 'فرمت شماره موبایل نامعتبر است' },
        { status: 400 }
      );
    }

    // Send test OTP using hybrid approach (local in development, Melipayamak in production)
    const result = await sendOtpCode(mobile);
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (result.success) {
      const message = isDevelopment 
        ? `کد تست (محلی) با موفقیت تولید شد: ${result.code}`
        : `پیامک تست با موفقیت ارسال شد${result.code ? ` - کد: ${result.code}` : ''}`;
        
      return NextResponse.json({
        success: true,
        message,
        code: result.code
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message || 'خطا در ارسال پیامک تست'
      });
    }
  } catch (error) {
    console.error('Error in SMS test:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در سرور' 
      },
      { status: 500 }
    );
  }
} 