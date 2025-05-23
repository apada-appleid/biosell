import MelipayamakService from '../lib/sms/melipayamak';
import { prisma } from '@/lib/prisma';

interface MelipayamakSettings {
  enabled: boolean;
  from?: string; // Optional since it's not used in the new API
}

// Default template for OTP message
const DEFAULT_OTP_TEMPLATE = 'کد تایید شما: {code}';

// Helper function to generate local OTP code
function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to get Melipayamak settings with environment variables priority
async function getMelipayamakSettings(): Promise<MelipayamakSettings & { token?: string }> {
  // First check environment variables
  const envToken = process.env.MELIPAYAMAK_TOKEN;
  
  if (envToken) {
    return {
      enabled: true,
      token: envToken,
      from: process.env.MELIPAYAMAK_FROM || undefined
    };
  }

  // Fallback to database settings
  try {
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

    return {
      enabled: settingsMap.melipayamak_enabled === 'true',
      token: settingsMap.melipayamak_token || undefined,
      from: settingsMap.melipayamak_from || undefined
    };
  } catch (error) {
    console.error('Error fetching Melipayamak settings from database:', error);
    return {
      enabled: false
    };
  }
}

/**
 * Save Melipayamak settings to database
 * @param settings MelipayamakSettings object
 * @returns boolean indicating success
 */
export const saveMelipayamakSettings = async (settings: MelipayamakSettings): Promise<boolean> => {
  try {
    await prisma.setting.upsert({
      where: { key: 'melipayamak' },
      update: { value: JSON.stringify(settings) },
      create: { 
        key: 'melipayamak', 
        value: JSON.stringify(settings),
        description: 'تنظیمات سرویس پیامک ملی پیامک'
      }
    });
    return true;
  } catch (error) {
    console.error('Error saving Melipayamak settings:', error);
    return false;
  }
};

export async function sendSms(to: string, message: string, from?: string): Promise<{ success: boolean; message: string; code?: string }> {
  try {
    const settings = await getMelipayamakSettings();
    
    if (!settings.enabled) {
      throw new Error('SMS service is not enabled');
    }

    if (!settings.token) {
      throw new Error('Melipayamak token is not configured');
    }

    const melipayamakService = new MelipayamakService(settings.token);
    const result = await melipayamakService.sendSMS(to, message, from || settings.from);
    
    // Handle the new API response format: { code: 'xxx', status: 'message' }
    if (result && result.status) {
      // Check if status indicates success
      const isSuccess = result.status.includes('موفق') || result.status.includes('ارسال شد');
      
      return {
        success: isSuccess,
        message: result.status,
        code: result.code
      };
    }
    
    // Fallback for unexpected response format
    return {
      success: false,
      message: 'پاسخ نامعتبر از سرویس پیامک'
    };
  } catch (error) {
    console.error('Error in sendSms:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'خطا در ارسال پیامک'
    };
  }
}

export async function sendOtpSms(to: string, otp: string): Promise<{ success: boolean; message: string; code?: string }> {
  try {
    const message = `کد تایید شما: ${otp}`;
    return await sendSms(to, message);
  } catch (error) {
    console.error('Error in sendOtpSms:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'خطا در ارسال پیامک کد تایید'
    };
  }
}

/**
 * Send OTP using Melipayamak's generated code (for OTP endpoint)
 * This function sends an OTP request to Melipayamak and returns the generated code
 */
export async function sendMelipayamakOtp(to: string): Promise<{ success: boolean; message: string; code?: string }> {
  try {
    const settings = await getMelipayamakSettings();
    
    if (!settings.enabled) {
      throw new Error('SMS service is not enabled');
    }

    if (!settings.token) {
      throw new Error('Melipayamak token is not configured');
    }

    const melipayamakService = new MelipayamakService(settings.token);
    const result = await melipayamakService.sendSMS(to, '', ''); // Empty message since Melipayamak generates OTP
    
    // Handle the new API response format: { code: 'xxx', status: 'message' }
    if (result && result.status) {
      // Check if status indicates success
      const isSuccess = result.status.includes('موفق') || result.status.includes('ارسال شد');
      
      return {
        success: isSuccess,
        message: result.status,
        code: result.code // This is the OTP code generated by Melipayamak
      };
    }
    
    // Fallback for unexpected response format
    return {
      success: false,
      message: 'پاسخ نامعتبر از سرویس پیامک'
    };
  } catch (error) {
    console.error('Error in sendMelipayamakOtp:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'خطا در ارسال کد تایید'
    };
  }
}

/**
 * Send OTP using local generation for development or Melipayamak for production
 * This is a hybrid function that chooses the appropriate method based on environment
 */
export async function sendOtpCode(to: string): Promise<{ success: boolean; message: string; code?: string }> {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    // In development, generate local OTP code
    const localOtpCode = generateOtpCode();
    console.log(`Development mode: Generated local OTP for ${to}: ${localOtpCode}`);
    
    return {
      success: true,
      message: 'کد تایید (محلی) ایجاد شد',
      code: localOtpCode
    };
  } else {
    // In production, use Melipayamak
    return await sendMelipayamakOtp(to);
  }
}

export async function checkSmsService(): Promise<{ enabled: boolean; configured: boolean }> {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      // In development, always consider it enabled and configured
      return {
        enabled: true,
        configured: true
      };
    }
    
    // In production, check actual settings
    const settings = await getMelipayamakSettings();
    
    return {
      enabled: settings.enabled,
      configured: !!settings.token
    };
  } catch (error) {
    console.error('Error checking SMS service:', error);
    return {
      enabled: false,
      configured: false
    };
  }
} 