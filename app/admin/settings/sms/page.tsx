'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { Loader2, Save, CheckCircle, XCircle } from 'lucide-react';

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
  const [testSmsResult, setTestSmsResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testSmsLoading, setTestSmsLoading] = useState(false);
  const [testMobile, setTestMobile] = useState('');
  const [settings, setSettings] = useState<SmsSettings | null>(null);

  const { control, handleSubmit, watch, reset, formState: { errors, isDirty } } = useForm<FormData>({
    defaultValues: {
      enabled: false,
      from: '',
    }
  });

  const isEnabled = watch('enabled');

  // Protect this page for admin users only
  useEffect(() => {
    if (status === 'authenticated' && session?.user.type !== 'admin') {
      router.push('/admin/dashboard');
    }
  }, [session, status, router]);

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/settings/sms');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(data);
        
        if (data.settings) {
          setSettings(data.settings);
          reset({
            enabled: data.settings.enabled || false,
            from: data.settings.from || '',
          });
        }
      } catch (error) {
        console.error('Error loading SMS settings:', error);
        setError('خطا در بارگیری تنظیمات پیامک');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated' && session?.user.type === 'admin') {
      loadSettings();
    }
  }, [status, session, reset]);

  // Save settings
  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setSaveSuccess(false);
      setError(null);

      const response = await fetch('/api/admin/settings/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(result.message || 'خطا در ذخیره تنظیمات');
      }
    } catch (error) {
      console.error('Error saving SMS settings:', error);
      setError('خطا در ذخیره تنظیمات پیامک');
    } finally {
      setLoading(false);
    }
  };

  // Send test SMS
  const handleSendTestSms = async () => {
    if (!testMobile || !/^09\d{9}$/.test(testMobile)) {
      setTestSmsResult({
        success: false,
        message: 'شماره موبایل نامعتبر است'
      });
      return;
    }

    try {
      setTestSmsLoading(true);
      setTestSmsResult(null);

      const response = await fetch('/api/admin/settings/sms/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile: testMobile }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();

      setTestSmsResult({
        success: result.success,
        message: result.message
      });
    } catch (error) {
      console.error('Error sending test SMS:', error);
      setTestSmsResult({
        success: false,
        message: 'خطا در ارسال پیامک تست'
      });
    } finally {
      setTestSmsLoading(false);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && session?.user.type !== 'admin')) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">تنظیمات سرویس پیامک</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
        {/* Enable/Disable Service */}
        <div className="border-b pb-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">سرویس پیامک</h2>
              <p className="text-sm text-gray-600">فعال یا غیرفعال کردن سرویس ارسال پیامک</p>
            </div>
            <div className="flex items-center">
              <Controller
                name="enabled"
                control={control}
                render={({ field }) => (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                    <div className={`relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 ${field.value ? 'peer-checked:bg-green-600' : 'peer-checked:bg-gray-600'}`}></div>
                    <span className="ms-3 text-sm font-medium text-gray-900">
                      {field.value ? (
                        <span className="text-green-600 font-semibold">فعال</span>
                      ) : (
                        <span className="text-gray-500">غیرفعال</span>
                      )}
                    </span>
                  </label>
                )}
              />
            </div>
          </div>
          
          {/* Environment Variables Info */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>نکته:</strong> توکن احراز هویت از متغیر محیطی خوانده می‌شود.
              <br />
              لطفاً در فایل <code className="text-xs bg-blue-100 px-1 py-0.5 rounded">.env.local</code> 
              مقدار <code className="text-xs bg-blue-100 px-1 py-0.5 rounded ml-1">MELIPAYAMAK_TOKEN</code> را تنظیم کنید.
            </p>
            {settings?.tokenConfigured && (
              <p className="text-sm text-green-700 mt-2 font-semibold">
                ✅ توکن پیکربندی شده است
              </p>
            )}
            {settings?.useEnvVars && (
              <p className="text-sm text-green-700 mt-1">
                ✅ در حال استفاده از متغیرهای محیطی
              </p>
            )}
          </div>
        </div>

        {/* Sender Number Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4">تنظیمات ارسال</h2>
          
          <div>
            <label htmlFor="from" className="block text-sm font-medium text-gray-700 mb-1">
              شماره فرستنده (اختیاری)
            </label>
            <Controller
              name="from"
              control={control}
              render={({ field }) => (
                <input
                  id="from"
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  disabled={loading || !isEnabled}
                  placeholder="5000... (در صورت عدم تکمیل، شماره پیش‌فرض استفاده می‌شود)"
                  {...field}
                />
              )}
            />
            <p className="text-gray-500 text-xs mt-1">
              اگر شماره خط خدماتی اختصاصی دارید، آن را وارد کنید. در غیر این صورت شماره پیش‌فرض استفاده خواهد شد.
            </p>
          </div>
        </div>

        {/* Test SMS Section */}
        <div className="mt-8 p-4 bg-gray-50 rounded-md">
          <h2 className="text-lg font-semibold mb-4">ارسال پیامک تست</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <label htmlFor="testMobile" className="block text-sm font-medium text-gray-700 mb-1">
                شماره موبایل تست
              </label>
              <input
                id="testMobile"
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                disabled={loading || !isEnabled}
                placeholder="09123456789"
                value={testMobile}
                onChange={(e) => setTestMobile(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleSendTestSms}
                disabled={testSmsLoading || !isEnabled || !testMobile}
                className="w-full md:w-auto flex items-center justify-center rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testSmsLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 animate-spin" />
                ) : null}
                ارسال پیامک تست
              </button>
            </div>
          </div>
          
          {testSmsResult && (
            <div className={`mt-4 p-3 rounded-md ${testSmsResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <div className="flex items-center">
                {testSmsResult.success ? (
                  <CheckCircle className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
                ) : (
                  <XCircle className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
                )}
                <p>{testSmsResult.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          {saveSuccess && (
            <div className="flex items-center text-green-600 mr-4 rtl:ml-4 rtl:mr-0">
              <CheckCircle className="w-5 h-5 mr-1 rtl:ml-1 rtl:mr-0" />
              <span>تنظیمات با موفقیت ذخیره شد</span>
            </div>
          )}
          
          {saveError && (
            <div className="flex items-center text-red-600 mr-4 rtl:ml-4 rtl:mr-0">
              <XCircle className="w-5 h-5 mr-1 rtl:ml-1 rtl:mr-0" />
              <span>{saveError}</span>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading || !isDirty}
            className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            )}
            ذخیره تنظیمات
          </button>
        </div>
      </form>
    </div>
  );
} 