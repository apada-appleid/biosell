import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/settings/sms - Get SMS settings
export async function GET(request: NextRequest) {
  console.log("GET /api/admin/settings/sms called");
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get SMS settings from environment variables (preferred) or database
    const envToken = process.env.MELIPAYAMAK_TOKEN;
    const envFrom = process.env.MELIPAYAMAK_FROM;

    // If env vars are set, use them
    if (envToken) {
      return NextResponse.json({
        success: true,
        settings: {
          enabled: true,
          from: envFrom || '',
          useEnvVars: true,
          tokenConfigured: true
        }
      });
    }

    // Otherwise, get from database
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['melipayamak_enabled', 'melipayamak_token', 'melipayamak_from']
        }
      }
    });

    const settingsMap = settings.reduce((acc: Record<string, string>, setting: any) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({
      success: true,
      settings: {
        enabled: settingsMap.melipayamak_enabled === 'true',
        from: settingsMap.melipayamak_from || '',
        useEnvVars: false,
        tokenConfigured: !!settingsMap.melipayamak_token
      }
    });
  } catch (error) {
    console.error('Error getting SMS settings:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'خطا در دریافت تنظیمات پیامک' 
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings/sms - Save SMS settings
export async function POST(request: Request) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get settings from request body
    const { enabled, from } = await request.json();

    // Validate that token is available in environment variables
    if (enabled) {
      const envToken = process.env.MELIPAYAMAK_TOKEN;
      
      if (!envToken) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'متغیر محیطی MELIPAYAMAK_TOKEN تنظیم نشده است. لطفاً در فایل .env.local مقدار MELIPAYAMAK_TOKEN را تنظیم کنید.' 
          },
          { status: 400 }
        );
      }
    }

    // Save settings to database (only 'enabled' and 'from' since token comes from env)
    await Promise.all([
      prisma.setting.upsert({
        where: { key: 'melipayamak_enabled' },
        update: { value: enabled.toString() },
        create: { 
          key: 'melipayamak_enabled', 
          value: enabled.toString(),
          description: 'فعال/غیرفعال بودن سرویس ملی پیامک'
        }
      }),
      prisma.setting.upsert({
        where: { key: 'melipayamak_from' },
        update: { value: from || '' },
        create: { 
          key: 'melipayamak_from', 
          value: from || '',
          description: 'شماره فرستنده پیش‌فرض ملی پیامک'
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: 'تنظیمات پیامک با موفقیت ذخیره شد'
    });
  } catch (error) {
    console.error('Error saving SMS settings:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'خطا در ذخیره تنظیمات پیامک' 
      },
      { status: 500 }
    );
  }
} 