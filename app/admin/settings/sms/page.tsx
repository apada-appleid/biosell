'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { Loader2, Save, CheckCircle, XCircle, Info, Code, Cloud } from 'lucide-react';

interface SmsSettings {
  enabled: boolean;
  from?: string;
  useEnvVars?: boolean;
  tokenConfigured?: boolean;
}

interface FormData {
  enabled: boolean;
  from: string;
}

export default function SmsSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setError] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [testMobile, setTestMobile] = useState('09123456789');
  const [isDevelopment, setIsDevelopment] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      enabled: false,
      from: '',
    }
  });

  const isEnabled = watch('enabled');

  // Check if we're in development mode
  useEffect(() => {
    setIsDevelopment(process.env.NODE_ENV === 'development');
  }, []);

  // Authentication check
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.type !== 'admin') {
      router.push('/auth/login');
      return;
    }
  }, [session, status, router]);

  // Load settings on component mount
  useEffect(() => {
    if (session?.user.type === 'admin') {
      loadSettings();
    }
  }, [session]);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/sms');
      if (response.ok) {
        const settings: SmsSettings = await response.json();
        setValue('enabled', settings.enabled);
        setValue('from', settings.from || '');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const response = await fetch('/api/admin/settings/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'خطا در ذخیره تنظیمات');
      }
    } catch (error) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSms = async () => {
    if (!testMobile.trim()) {
      setTestError('لطفا شماره موبایل را وارد کنید');
      return;
    }

    setTestLoading(true);
    setTestSuccess(false);
    setTestError(null);

    try {
      const response = await fetch('/api/admin/settings/sms/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile: testMobile }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setTestSuccess(true);
        setTestError(null);
        setTimeout(() => setTestSuccess(false), 5000);
      } else {
        setTestError(result.message || 'خطا در ارسال پیامک تست');
      }
    } catch (error) {
      setTestError('خطا در ارتباط با سرور');
    } finally {
      setTestLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">تنظیمات پیامک</h1>
        <p className="mt-1 text-sm text-gray-600">
          مدیریت سرویس ارسال پیامک ملی پیامک
        </p>
      </div>

      {/* Development Mode Notice */}
      {isDevelopment && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <Code className="h-5 w-5 text-yellow-600 mt-0.5 ml-2" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                حالت توسعه (Development Mode)
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                در حالت توسعه، کدهای تایید به‌صورت محلی تولید می‌شوند و پیامک ارسال نمی‌شود. 
                این کار برای کاهش هزینه‌ها در طول توسعه انجام می‌شود.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Production Mode Notice */}
      {!isDevelopment && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Cloud className="h-5 w-5 text-blue-600 mt-0.5 ml-2" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                حالت تولید (Production Mode)
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                در حالت تولید، پیامک‌ها از طریق سرویس ملی‌پیامک ارسال می‌شوند.
                کدهای احراز هویت از متغیرهای محیطی خوانده می‌شوند.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Environment Variables Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 ml-2" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">
              اطلاعات متغیرهای محیطی
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              {isDevelopment ? (
                'در حالت توسعه نیازی به تنظیم متغیرهای محیطی نیست، اما برای تست در محیط واقعی می‌توانید آن‌ها را تنظیم کنید:'
              ) : (
                'اطلاعات احراز هویت ملی‌پیامک از متغیرهای محیطی زیر خوانده می‌شوند:'
              )}
            </p>
            <ul className="mt-2 text-sm text-blue-600 space-y-1">
              <li><code className="bg-blue-100 px-1 rounded">MELIPAYAMAK_TOKEN</code> - توکن احراز هویت</li>
              <li><code className="bg-blue-100 px-1 rounded">MELIPAYAMAK_FROM</code> - شماره فرستنده (اختیاری)</li>
            </ul>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Service Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  فعال‌سازی سرویس پیامک
                </label>
                <p className="text-sm text-gray-500">
                  {isDevelopment 
                    ? 'فعال‌سازی تولید کد محلی (توسعه) یا ارسال واقعی (تولید)'
                    : 'فعال‌سازی ارسال پیامک از طریق ملی‌پیامک'
                  }
                </p>
              </div>
              <Controller
                name="enabled"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      ${field.value ? 'bg-green-600' : 'bg-gray-200'}
                    `}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${field.value ? 'translate-x-6' : 'translate-x-1'}
                      `}
                    />
                  </button>
                )}
              />
            </div>

            {/* From Number */}
            <div>
              <label htmlFor="from" className="block text-sm font-medium text-gray-700 mb-1">
                شماره فرستنده (اختیاری)
              </label>
              <Controller
                name="from"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="from"
                    type="text"
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="مثال: 10008566"
                    dir="ltr"
                  />
                )}
              />
              <p className="mt-1 text-sm text-gray-500">
                در صورت خالی بودن از شماره پیش‌فرض استفاده می‌شود
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Save className="h-4 w-4 ml-2" />
              )}
              ذخیره تنظیمات
            </button>

            {saveSuccess && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-5 w-5 ml-1" />
                <span className="text-sm">تنظیمات با موفقیت ذخیره شد</span>
              </div>
            )}

            {saveError && (
              <div className="flex items-center text-red-600">
                <XCircle className="h-5 w-5 ml-1" />
                <span className="text-sm">{saveError}</span>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Test SMS Section */}
      {isEnabled && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">تست ارسال پیامک</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="testMobile" className="block text-sm font-medium text-gray-700 mb-1">
                شماره موبایل برای تست
              </label>
              <input
                id="testMobile"
                type="text"
                value={testMobile}
                onChange={(e) => setTestMobile(e.target.value)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="09123456789"
                dir="ltr"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleTestSms}
                disabled={testLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {testLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <Save className="h-4 w-4 ml-2" />
                )}
                {isDevelopment ? 'تولید کد تست (محلی)' : 'ارسال پیامک تست'}
              </button>

              {testSuccess && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 ml-1" />
                  <span className="text-sm">
                    {isDevelopment ? 'کد تست با موفقیت تولید شد' : 'پیامک تست با موفقیت ارسال شد'}
                  </span>
                </div>
              )}

              {testError && (
                <div className="flex items-center text-red-600">
                  <XCircle className="h-5 w-5 ml-1" />
                  <span className="text-sm">{testError}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 