"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
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
            console.log(`PWA prompt was dismissed on ${new Date(lastDismissed).toLocaleString()}, will not show`);
            // پیام را نمایش نمی‌دهیم
            setShowPrompt(false);
          }
        }
      }
    } catch (err) {
      console.error("Error in initial dismissed check:", err);
    }
    
    // فقط یکبار بررسی می‌کنیم
    setHasCheckedDismissed(true);
  }, []);
  
  // بررسی اولیه وضعیت اپلیکیشن و نمایش پیام
  useEffect(() => {
    // تابع اصلی برای تنظیم وضعیت نمایش
    const setupInstallPrompt = () => {
      try {
        if (typeof window === 'undefined') return;
        
        // بررسی آیا در حالت standalone اجرا می‌شود (قبلاً نصب شده)
        const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches || 
          (window.navigator as any).standalone === true;
        
        setIsStandalone(isInStandaloneMode);
        if (isInStandaloneMode) return;
        
        // تشخیص iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);
        
        // بررسی دقیق آیا قبلاً پیام را رد کرده است
        let isDismissedRecently = false;
        try {
          const dismissedTime = localStorage.getItem("pwa-prompt-dismissed");
          if (dismissedTime) {
            const lastDismissed = parseInt(dismissedTime, 10);
            if (!isNaN(lastDismissed)) {
              // 3 روز به میلی‌ثانیه
              const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
              isDismissedRecently = (Date.now() - lastDismissed) < threeDaysInMs;
              
              if (isDismissedRecently) {
                console.log(`PWA prompt was dismissed recently (${new Date(lastDismissed).toLocaleString()}), suppressing`);
                return; // اگر اخیراً رد شده، هیچ کاری انجام نمی‌دهیم
              }
            }
          }
        } catch (error) {
          console.error("Error checking dismissal state:", error);
        }
        
        // اگر iOS است و اخیراً رد نشده، با تأخیر نمایش می‌دهیم
        if (isIOSDevice && !isDismissedRecently) {
          console.log("PWA prompt shown for iOS device");
          setTimeout(() => setShowPrompt(true), 1000); // تاخیر برای لود شدن صفحه
          return;
        }
        
        // اگر رویداد prompt تا 3 ثانیه پس از لود اتفاق نیفتاد و کاربر قبلاً رد نکرده بود
        if (!isIOSDevice && !isDismissedRecently && !hasPromptEventOccurred) {
          setTimeout(() => {
            if (!hasPromptEventOccurred && !isDismissedRecently) {
              // دوباره بررسی می‌کنیم که در این فاصله کاربر رد نکرده باشد
              const dismissedAgainCheck = localStorage.getItem("pwa-prompt-dismissed");
              if (dismissedAgainCheck) {
                const lastDismissed = parseInt(dismissedAgainCheck, 10);
                if (!isNaN(lastDismissed) && (Date.now() - lastDismissed) < 3 * 24 * 60 * 60 * 1000) {
                  console.log("PWA prompt cancelled after timeout due to recent dismissal");
                  return;
                }
              }
              
              console.log("PWA prompt shown after timeout (no event occurred)");
              setShowPrompt(true);
            }
          }, 3000);
        }
      } catch (error) {
        console.error("Error in PWA setup:", error);
      }
    };
    
    setupInstallPrompt();
    
    // عملکرد فقط در محیط client
    if (typeof window !== 'undefined') {
      console.log("Setting up PWA install handler");
      
      // مدیریت رویداد درخواست نصب
      const handleBeforeInstallPrompt = (e: Event) => {
        // ابتدا بررسی می‌کنیم که آیا کاربر قبلاً پیام را رد کرده است
        try {
          const dismissedTime = localStorage.getItem("pwa-prompt-dismissed");
          if (dismissedTime) {
            const lastDismissed = parseInt(dismissedTime, 10);
            if (!isNaN(lastDismissed) && (Date.now() - lastDismissed) < 3 * 24 * 60 * 60 * 1000) {
              // اگر کمتر از 3 روز از رد کردن پیام گذشته باشد، رویداد را فقط ذخیره می‌کنیم
              // اما پیام را نمایش نمی‌دهیم
              console.log("PWA prompt suppressed due to recent dismissal");
              e.preventDefault(); // جلوگیری از نمایش خودکار مرورگر
              setDeferredPrompt(e as BeforeInstallPromptEvent);
              setHasPromptEventOccurred(true);
              return;
            }
          }
        } catch (error) {
          console.error("Error checking PWA dismissal state:", error);
        }
        
        // پس از بررسی و اگر کاربر پیام را اخیراً رد نکرده باشد، اجازه میدهیم مرورگر پیام را نمایش دهد
        console.log("PWA install prompt event captured and allowed");
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setHasPromptEventOccurred(true);
        setShowPrompt(true);
      };
      
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      
      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }
  }, [hasPromptEventOccurred]);
  
  // ابزارهای دیباگ (فقط در محیط توسعه)
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).debugPWA = {
        showPrompt: () => {
          console.log("DEBUG: Forcing prompt to show");
          setShowPrompt(true);
        },
        hidePrompt: () => {
          console.log("DEBUG: Forcing prompt to hide");
          setShowPrompt(false);
        },
        clearDismissed: () => {
          localStorage.removeItem('pwa-prompt-dismissed');
          console.log('DEBUG: PWA dismissed state cleared');
        },
        checkStatus: () => {
          const status = {
            showPrompt,
            isStandalone,
            isIOS,
            hasPromptEvent: !!deferredPrompt,
            hasPromptEventOccurred,
            dismissedTime: localStorage.getItem('pwa-prompt-dismissed'),
          };
          console.log('DEBUG: PWA Status:', status);
          return status;
        }
      };
    }
  }, [showPrompt, isStandalone, isIOS, deferredPrompt, hasPromptEventOccurred]);
  
  // کلیک روی دکمه نصب
  const handleInstallClick = async () => {
    try {
      if (deferredPrompt) {
        // اگر رویداد نصب در دسترس است، از آن استفاده می‌کنیم
        console.log("Showing native install prompt manually");
        
        try {
          deferredPrompt.prompt();
          console.log("Manual prompt called successfully");
        } catch (err) {
          console.log("Manual prompt failed, but browser might have shown it already", err);
        }
        
        try {
          const choiceResult = await deferredPrompt.userChoice;
          
          if (choiceResult.outcome === "accepted") {
            console.log("User accepted the install prompt");
          } else {
            console.log("User dismissed the install prompt");
            localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
          }
        } catch (choiceErr) {
          console.log("Couldn't get user choice, browser might be handling it", choiceErr);
        }
        
        setDeferredPrompt(null);
      } else if (isIOS) {
        // برای iOS نمی‌توانیم به طور خودکار نصب کنیم
        console.log("iOS devices use 'Add to Home Screen' from the share menu");
        // نمایش راهنمای iOS
        showManualInstallInstructions("ios");
      } else {
        // برای سایر مرورگرها که رویداد را پشتیبانی نمی‌کنند
        console.log("Install prompt not available, showing manual instructions");
        // نمایش راهنمای عمومی
        showManualInstallInstructions("other");
      }
      
      // در هر صورت، پیام اصلی را مخفی می‌کنیم
      setShowPrompt(false);
    } catch (error) {
      console.error("Error during PWA installation:", error);
      setShowPrompt(false);
    }
  };
  
  // کلیک روی دکمه بستن
  const handleDismiss = () => {
    try {
      // پنهان کردن پیام
      setShowPrompt(false);
      
      // ذخیره زمان رد کردن در لوکال استوریج با عملکرد بهتر
      const now = Date.now();
      localStorage.setItem("pwa-prompt-dismissed", now.toString());
      
      // برای اطمینان بیشتر، تأیید می‌کنیم که مقدار به درستی ذخیره شده است
      const savedValue = localStorage.getItem("pwa-prompt-dismissed");
      if (savedValue !== now.toString()) {
        console.warn("PWA dismissed state may not have been saved correctly", {
          expected: now.toString(),
          actual: savedValue
        });
      } else {
        console.log(`PWA prompt dismissed until ${new Date(now + 3 * 24 * 60 * 60 * 1000).toLocaleString()}`);
      }
    } catch (error) {
      console.error("Error dismissing PWA prompt:", error);
      setShowPrompt(false);
    }
  };
  
  // تابع نمایش راهنمای نصب دستی برای مرورگرهای مختلف
  const showManualInstallInstructions = (type: "ios" | "other") => {
    setInstructionType(type);
    setShowInstructions(true);
  };
  
  // کامپوننت راهنمای نصب دستی
  const ManualInstallInstructions = () => {
    if (!showInstructions) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white w-full max-w-md rounded-lg p-5 shadow-lg">
          <h3 className="text-lg font-semibold mb-3">نصب اپلیکیشن بایوسل</h3>
          
          {instructionType === "ios" ? (
            <div className="space-y-3">
              <p className="text-sm">برای نصب اپلیکیشن در iOS:</p>
              <ol className="list-decimal list-inside text-sm space-y-2">
                <li>روی دکمه «اشتراک‌گذاری» <span className="inline-block"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg></span> کلیک کنید.</li>
                <li>در منو باز شده، گزینه «افزودن به صفحه اصلی» را انتخاب کنید.</li>
                <li>روی «افزودن» کلیک کنید.</li>
              </ol>
              <p className="text-xs text-gray-600 mt-3">بعد از این مراحل، آیکون اپلیکیشن بایوسل به صفحه اصلی دستگاه شما اضافه می‌شود.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm">برای نصب اپلیکیشن روی مرورگر خود:</p>
              <ol className="list-decimal list-inside text-sm space-y-2">
                <li>روی دکمه منو (سه نقطه) در گوشه بالای مرورگر کلیک کنید.</li>
                <li>گزینه «نصب برنامه» یا «افزودن به صفحه اصلی» را انتخاب کنید.</li>
                <li>روی «نصب» کلیک کنید.</li>
              </ol>
              <p className="text-xs text-gray-600 mt-3">اگر این گزینه را نمی‌بینید، ممکن است مرورگر شما از این قابلیت پشتیبانی نکند. لطفاً از Chrome یا Edge استفاده کنید.</p>
            </div>
          )}
          
          <div className="mt-5 flex justify-end">
            <button 
              onClick={() => setShowInstructions(false)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // اگر پیام نباید نمایش داده شود، هیچی برنگردان
  if (!showPrompt && !showInstructions) {
    return null;
  }
  
  return (
    <>
      {showPrompt && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white p-3 shadow-lg border-t border-gray-200 animate-slideUpFade">
          <div className="flex items-center justify-between gap-2 max-w-screen-md mx-auto">
            <div className="flex items-center gap-3 flex-1">
              <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 shrink-0">
                <Download className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">استفاده بهتر از بایوسل</h3>
                <p className="text-xs text-gray-600">
                  {isIOS 
                    ? "برای نصب روی دستگاه خود، به «اشتراک‌گذاری» و سپس «افزودن به صفحه اصلی» بزنید"
                    : "با نصب روی دستگاه خود، سریع‌تر و بدون نیاز به مرورگر استفاده کنید"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleDismiss}
                className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
                aria-label="بستن"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                onClick={handleInstallClick}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 focus:outline-none"
              >
                نصب
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* نمایش راهنمای نصب دستی */}
      <ManualInstallInstructions />
    </>
  );
}; 