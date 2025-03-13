"use client";

import { useEffect, useState } from "react";
import { X, Download, Share2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface ExtendedNavigator extends Navigator {
  standalone?: boolean;
}

interface ExtendedWindow extends Window {
  MSStream?: unknown;
}

export const PWAInstallPrompt = () => {
  // به طور پیش‌فرض پیام را نمایش نمی‌دهیم تا بررسی‌های لازم را انجام دهیم
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [hasPromptEventOccurred, setHasPromptEventOccurred] = useState(false);
  const [hasCheckedDismissed, setHasCheckedDismissed] = useState(false);
  // استیت‌های جدید برای مدیریت راهنمای نصب دستی
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionType, setInstructionType] = useState<"ios" | "other">("other");
  
  // بررسی یکبار در شروع برنامه که آیا باید پیام را نمایش دهیم یا خیر
  useEffect(() => {
    // از قبل بررسی شده، پس مجدد بررسی نمی‌کنیم
    if (hasCheckedDismissed) return;
    
    try {
      // بررسی وضعیت رد کردن قبلی
      const dismissedTime = localStorage.getItem("pwa-prompt-dismissed");
      if (dismissedTime) {
        const lastDismissed = parseInt(dismissedTime, 10);
        if (!isNaN(lastDismissed)) {
          const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
          const isDismissedRecently = (Date.now() - lastDismissed) < threeDaysInMs;
          
          if (isDismissedRecently) {
            // پیام را نمایش نمی‌دهیم
            setShowPrompt(false);
          }
        }
      }
    } catch {
      // Silent fail
    }
    
    // فقط یکبار بررسی می‌کنیم
    setHasCheckedDismissed(true);
  }, [hasCheckedDismissed]);
  
  // تنظیم هندلر نصب و بررسی وضعیت standalone
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const setupInstallPrompt = () => {
      // بررسی حالت standalone (نصب شده)
      const isInStandaloneMode = () =>
        'standalone' in window.navigator && (window.navigator as ExtendedNavigator).standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches;
      
      setIsStandalone(isInStandaloneMode());
      
      // بررسی دستگاه iOS
      const isIOSDevice = () => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        return /iphone|ipad|ipod/.test(userAgent) && !(window as ExtendedWindow).MSStream;
      };
      
      setIsIOS(isIOSDevice());
      
      // نمایش خودکار پیام برای نصب بعد از مدت زمان مشخص
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      
      if (!hasPromptEventOccurred && !isInStandaloneMode()) {
        // بررسی کنیم که آیا از قبل رد شده است؟
        try {
          const lastDismissed = parseInt(localStorage.getItem('pwa-prompt-dismissed') || '0', 10);
          if (!isNaN(lastDismissed) && Date.now() - lastDismissed < 3 * 24 * 60 * 60 * 1000) {
            // پیام را نمایش نمی‌دهیم چون اخیراً رد شده است
            setShowPrompt(false);
            return;
          }
        } catch {
          // Silent fail
        }
        
        // دستگاه iOS است
        if (isIOS) {
          setShowPrompt(true);
          setInstructionType("ios");
          return;
        }
        
        // بعد از زمان مشخص، پیام را نمایش می‌دهیم
        timeoutId = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
      }
      
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    };
    
    // تنظیم هندلر برای رویداد نصب PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      
      // رویداد را ذخیره می‌کنیم برای استفاده بعدی
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // ثبت می‌کنیم که رویداد نصب اتفاق افتاده
      setHasPromptEventOccurred(true);
      
      // بررسی آخرین زمان رد پیام
      const lastDismissed = parseInt(localStorage.getItem('pwa-prompt-dismissed') || '0', 10);
      if (!isNaN(lastDismissed) && Date.now() - lastDismissed < 3 * 24 * 60 * 60 * 1000) {
        // پیام را نمایش نمی‌دهیم چون اخیراً رد شده است
        return;
      }
      
      // پیام را نمایش می‌دهیم
      setShowPrompt(true);
    };
    
    // ثبت لیسنر برای رویداد نصب
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    const cleanupTimeoutFn = setupInstallPrompt();
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if (cleanupTimeoutFn) cleanupTimeoutFn();
    };
  }, [hasPromptEventOccurred, isIOS]);
  
  // کلیک روی دکمه نصب
  const handleInstallClick = async () => {
    if (!deferredPrompt && !isIOS) {
      // اگر رویداد نصب موجود نیست، راهنمای دستی را نمایش می‌دهیم
      showManualInstallInstructions("other");
      return;
    }
    
    if (isIOS) {
      // برای iOS راهنمای مخصوص آن را نمایش می‌دهیم
      showManualInstallInstructions("ios");
      return;
    }
    
    try {
      if (deferredPrompt) {
        // نمایش پیام نصب سیستمی
        await deferredPrompt.prompt();
        
        // منتظر پاسخ کاربر می‌مانیم
        const choiceResult = await deferredPrompt.userChoice;
        
        // بستن پیام نصب ما
        setShowPrompt(false);
        
        // اگر کاربر رد کرد، ذخیره می‌کنیم
        if (choiceResult.outcome === "dismissed") {
          localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
        }
        
        // دیگر نمی‌توانیم از این رویداد استفاده کنیم
        setDeferredPrompt(null);
      }
    } catch {
      // Silent fail
      showManualInstallInstructions("other");
    }
  };
  
  // نمایش پیام را پنهان می‌کنیم و در localStorage ثبت می‌کنیم
  const handleDismiss = () => {
    setShowPrompt(false);
    setShowInstructions(false);
    
    // ثبت زمان رد کردن در localStorage برای 3 روز
    try {
      const now = Date.now();
      localStorage.setItem('pwa-prompt-dismissed', now.toString());
    } catch {
      // Silent fail
    }
  };
  
  // نمایش راهنمای نصب دستی
  const showManualInstallInstructions = (type: "ios" | "other") => {
    setShowInstructions(true);
    setInstructionType(type);
  };
  
  // کامپوننت راهنمای نصب دستی
  const ManualInstallInstructions = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">نصب اپلیکیشن</h3>
          <button
            onClick={() => setShowInstructions(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {instructionType === "ios" ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              برای نصب اپلیکیشن در iOS:
            </p>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>در Safari روی دکمه <span className="inline-flex items-center ml-1 mr-1"><Share2 className="h-4 w-4" /></span> کلیک کنید</li>
              <li>گزینه «Add to Home Screen» را انتخاب کنید</li>
              <li>روی «Add» کلیک کنید</li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              برای نصب اپلیکیشن در مرورگر شما:
            </p>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>در نوار آدرس، روی آیکون منو کلیک کنید</li>
              <li>گزینه «Install App» یا «Add to Home Screen» را انتخاب کنید</li>
              <li>مراحل نصب را دنبال کنید</li>
            </ol>
          </div>
        )}
      </div>
    );
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 animate-slide-up">
      <div className="bg-white rounded-lg shadow-xl p-4 mx-auto max-w-md">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-full p-2 mr-3">
              <Download className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">اپلیکیشن بیوسل را نصب کنید</h3>
              <p className="text-sm text-gray-500 mt-1">
                برای دسترسی سریع‌تر و تجربه بهتر
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {showInstructions ? (
          <ManualInstallInstructions />
        ) : (
          <div className="mt-4 flex flex-col md:flex-row md:justify-end space-y-3 md:space-y-0 md:space-x-3 md:space-x-reverse">
            <button
              onClick={handleDismiss}
              className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              بعداً
            </button>
            <button
              onClick={handleInstallClick}
              className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              نصب اپلیکیشن
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 