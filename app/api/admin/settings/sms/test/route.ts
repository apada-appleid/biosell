import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { sendOtpSms } from '@/utils/sms-service';

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

    // Check if mobile is in valid format
    const mobileRegex = /^09\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      return NextResponse.json(
        { success: false, message: 'فرمت شماره موبایل نامعتبر است' },
        { status: 400 }
      );
    }

    // Generate test code
    const testCode = '123456';

    // Send test SMS
    const result = await sendOtpSms(mobile, testCode);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      code: result.code
    });
  } catch (error) {
    console.error('Error sending test SMS:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'خطا در ارسال پیامک تست' 
      },
      { status: 500 }
    );
  }
} 