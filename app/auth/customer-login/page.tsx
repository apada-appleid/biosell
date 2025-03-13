"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  TbPhone,
  TbShieldCheck,
  TbLoader,
  TbAlertCircle,
} from "react-icons/tb";
import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";

// تبدیل اعداد فارسی به انگلیسی
const convertPersianToEnglish = (input: string): string => {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const englishDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

  let result = input;
  for (let i = 0; i < 10; i++) {
    const regex = new RegExp(persianDigits[i], "g");
    result = result.replace(regex, englishDigits[i]);
  }

  return result;
};

// تعریف طرح اعتبارسنجی فرم شماره موبایل با zod
const mobileSchema = z.object({
  mobile: z.string().regex(/^09[0-9]{9}$/, "شماره موبایل معتبر نیست"),
});

// تعریف طرح اعتبارسنجی فرم کد تأیید با zod
const otpSchema = z.object({
  code: z.string().regex(/^[0-9]{6}$/, "کد تأیید باید 6 رقم باشد"),
});

type MobileFormValues = z.infer<typeof mobileSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

export default function CustomerLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [userMobile, setUserMobile] = useState("");
  const [tempOTP, setTempOTP] = useState<string | null>(null);
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);
  const { data: sessionData, status: sessionStatus } = useSession();

  // دریافت پارامتر callbackUrl از URL
  useEffect(() => {
    // نمایش پیام خطا اگر نیاز باشد کاربر به عنوان مشتری لاگین کند
    const params = new URLSearchParams(window.location.search);
    const callbackUrl = params.get("callbackUrl");
    const messageParam = params.get("message");

    if (callbackUrl) {
      setRedirectUrl(callbackUrl);
    }

    if (messageParam === "customer_required") {
      setError("لطفا با حساب کاربری خریدار وارد شوید.");
    }
  }, []);

  // بررسی وجود توکن و انتقال به صفحه مقصد در صورت وجود توکن
  useEffect(() => {
    // فقط یک بار ریدایرکت انجام شود
    if (hasRedirected) return;

    // بررسی هم توکن محلی و هم session
    const token = localStorage.getItem("auth_token");
    const hasValidSession = sessionStatus === "authenticated" && !!sessionData;

    if (token || hasValidSession) {
      setHasRedirected(true);

      // لاگ کردن وضعیت ورود کاربر برای اشکال‌زدایی
      console.log("Login detected:", {
        hasToken: !!token,
        hasSession: hasValidSession,
        redirectUrl,
      });

      // اگر آدرس بازگشت داریم، به آن آدرس برویم، در غیر این صورت به داشبورد
      if (redirectUrl) {
        console.log("User already logged in, redirecting to:", redirectUrl);
        router.push(redirectUrl);
      } else {
        router.push("/customer/dashboard");
      }
    }
  }, [router, redirectUrl, hasRedirected, sessionData, sessionStatus]);

  // فوکوس روی اولین فیلد کد تأیید وقتی به مرحله OTP می‌رویم
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // تنظیمات فرم شماره موبایل با react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MobileFormValues>({
    resolver: zodResolver(mobileSchema),
  });

  // تنظیمات فرم کد تأیید با react-hook-form
  const {
    register: registerOtp,
    handleSubmit: handleSubmitOtp,
    formState: { errors: otpErrors },
    setValue: setOtpValue,
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
  });

  // شمارنده معکوس برای زمان اعتبار کد تأیید
  useEffect(() => {
    if (remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingTime]);

  // فرمت کردن زمان باقی‌مانده
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // ارسال شماره موبایل و دریافت کد تأیید
  const onSubmitMobile = async (data: MobileFormValues) => {
    // تبدیل اعداد فارسی به انگلیسی در شماره موبایل
    const englishMobile = convertPersianToEnglish(data.mobile);

    setIsLoading(true);
    setError(null);
    setUserMobile(englishMobile);

    try {
      // ارسال درخواست به API
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ mobile: englishMobile }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "خطا در ارسال کد تأیید");
        setIsLoading(false);
        return;
      }

      // ذخیره OTP موقت برای نمایش
      if (result.otp) {
        setTempOTP(result.otp);
      }

      setStep("otp");
      setRemainingTime(120); // 2 دقیقه زمان اعتبار کد
    } catch (error) {
      console.error("Error sending OTP:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  // هندل کردن تغییر در فیلدهای کد تأیید
  const handleOtpChange = (index: number, value: string) => {
    // تبدیل اعداد فارسی به انگلیسی
    const englishValue = convertPersianToEnglish(value);

    // فقط اعداد را قبول کن
    if (englishValue && !/^\d*$/.test(englishValue)) return;

    const newOtpValues = [...otpValues];

    // فقط آخرین رقم را نگه دار
    newOtpValues[index] = englishValue.slice(-1);
    setOtpValues(newOtpValues);

    // آپدیت کردن مقدار در react-hook-form
    const otpCode = newOtpValues.join("");
    setOtpValue("code", otpCode);

    // انتقال به فیلد بعدی اگر مقدار وارد شده است
    if (englishValue && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // ارسال فرم در صورت تکمیل همه فیلدها
    if (newOtpValues.every((val) => val !== "") && newOtpValues.length === 6) {
      handleSubmitOtp(onSubmitOtp)();
    }
  };

  // هندل کردن کلید backspace
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      // اگر فیلد فعلی خالی است، به فیلد قبلی برو و آن را خالی کن
      if (otpValues[index] === "" && index > 0) {
        e.preventDefault();
        otpInputsRef.current[index - 1]?.focus();

        const newOtpValues = [...otpValues];
        newOtpValues[index - 1] = "";
        setOtpValues(newOtpValues);

        // آپدیت کردن مقدار در react-hook-form
        const otpCode = newOtpValues.join("");
        setOtpValue("code", otpCode);
      }
      // اگر فیلد فعلی دارای مقدار است، فقط آن را خالی کن
      else if (otpValues[index] !== "") {
        const newOtpValues = [...otpValues];
        newOtpValues[index] = "";
        setOtpValues(newOtpValues);

        // آپدیت کردن مقدار در react-hook-form
        const otpCode = newOtpValues.join("");
        setOtpValue("code", otpCode);
      }
    }
    // حرکت با کلیدهای جهت چپ و راست بین فیلدها
    else if (e.key === "ArrowLeft" && index < 5) {
      e.preventDefault();
      otpInputsRef.current[index + 1]?.focus();
    } else if (e.key === "ArrowRight" && index > 0) {
      e.preventDefault();
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // هندل کردن paste برای کد تأیید
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    let pastedData = e.clipboardData.getData("text");

    // تبدیل اعداد فارسی به انگلیسی
    pastedData = convertPersianToEnglish(pastedData);

    // بررسی کنیم که فقط اعداد باشد
    if (!/^\d*$/.test(pastedData)) return;

    // حداکثر 6 رقم را استخراج کنیم
    const digits = pastedData.slice(0, 6).split("");

    // پر کردن فیلدها با اعداد پیست شده
    const newOtpValues = [...otpValues];
    digits.forEach((digit, index) => {
      if (index < 6) {
        newOtpValues[index] = digit;
      }
    });

    setOtpValues(newOtpValues);

    // آپدیت کردن مقدار در react-hook-form
    const otpCode = newOtpValues.join("");
    setOtpValue("code", otpCode);

    // انتقال فوکوس به آخرین فیلد پر شده یا فیلد بعدی
    const focusIndex = Math.min(digits.length, 5);
    otpInputsRef.current[focusIndex]?.focus();

    // ارسال فرم در صورت تکمیل همه فیلدها
    if (newOtpValues.every((val) => val !== "") && newOtpValues.length === 6) {
      handleSubmitOtp(onSubmitOtp)();
    }
  };

  // تأیید کد و ورود به سیستم
  const onSubmitOtp = async (data: OtpFormValues) => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          mobile: userMobile,
          code: data.code,
        }),
      });

      const result = await response.json();

      console.log("result", result);

      if (!response.ok) {
        throw new Error(result.error || "خطا در تایید کد");
      }

      // ذخیره اطلاعات کاربر
      if (result.token) {
        localStorage.setItem("auth_token", result.token);

        if (result.user) {
          localStorage.setItem(
            "user_info",
            JSON.stringify({
              id: result.user.id,
              name: result.user.name,
              mobile: result.user.mobile,
            })
          );

          // تلاش برای احراز هویت با NextAuth
          try {
            signIn("credentials", {
              redirect: false,
              email: result.user.email || userMobile + "@example.com",
              password: result.token,
              type: "customer", // Explicitly set the user type for NextAuth
            }).then((signInResult) => {
              if (signInResult?.error) {
                console.warn("NextAuth signin returned an error:", signInResult.error);
                // Still continue with token-based auth as fallback
              } else {
                console.log("NextAuth signin successful");
              }
            }).catch((err) => {
              console.error("NextAuth signin failed but we continue:", err);
              // ادامه می‌دهیم حتی اگر خطا رخ دهد
            });
          } catch (authError) {
            console.error("Error during NextAuth signin:", authError);
            // ادامه می‌دهیم حتی اگر خطا رخ دهد
          }
        }

        // تنظیم پرچم ریدایرکت برای جلوگیری از حلقه
        setHasRedirected(true);

        // در هر صورت، وقتی توکن دریافت کردیم مستقیماً به صفحه تکمیل سفارش برویم
        // صفحه checkout خودش session را چک می‌کند
        console.log("Login successful, redirecting to checkout directly");

        // یک تاخیر کوتاه برای اطمینان از ذخیره توکن
        setTimeout(() => {
          // اگر redirectUrl داریم به آن آدرس برویم، در غیر این صورت به checkout
          const finalRedirectUrl = redirectUrl || "/customer/dashboard";
          router.push(finalRedirectUrl);
        }, 300);
      } else {
        throw new Error("توکن دریافت نشد");
      }
    } catch (err: Error | unknown) {
      console.error("Error verifying OTP:", err);
      const errorMessage = err instanceof Error ? err.message : "خطا در ورود. لطفا دوباره تلاش کنید.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ارسال مجدد کد تأیید
  const handleResendOtp = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // ارسال درخواست به API
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ mobile: userMobile }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "خطا در ارسال مجدد کد تأیید");
        setIsLoading(false);
        return;
      }

      // ذخیره OTP موقت برای نمایش
      if (result.otp) {
        setTempOTP(result.otp);
      }

      setRemainingTime(120); // 2 دقیقه زمان اعتبار کد
    } catch (error) {
      console.error("Error resending OTP:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link
            href="/"
            className="text-2xl font-bold text-blue-600 hover:text-blue-500"
          >
            بایوسل
          </Link>
          <h2 className="mt-3 text-xl font-semibold text-gray-900">
            ورود به پنل کاربری
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === "mobile"
              ? "لطفاً شماره موبایل خود را وارد کنید"
              : `کد تأیید به شماره ${userMobile} ارسال شد`}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === "mobile" ? (
            <form onSubmit={handleSubmit(onSubmitMobile)} className="space-y-6">
              <div>
                <label
                  htmlFor="mobile"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  شماره موبایل
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <TbPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="mobile"
                    type="text"
                    className="block w-full pr-10 py-3 pl-4 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    placeholder="مثال: 09123456789"
                    {...register("mobile", {
                      onChange: (e) => {
                        const englishValue = convertPersianToEnglish(
                          e.target.value
                        );
                        if (englishValue !== e.target.value) {
                          e.target.value = englishValue;
                        }
                      },
                    })}
                    dir="ltr"
                  />
                </div>
                {errors.mobile && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <TbAlertCircle className="h-4 w-4 ml-1" />
                    {errors.mobile.message}
                  </p>
                )}
              </div>

              {error && (
                <div
                  className="rounded bg-red-50 p-3 flex items-center justify-between"
                  role="alert"
                >
                  <p className="text-sm text-red-700">{error}</p>
                  <TbAlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <TbLoader className="animate-spin h-5 w-5 ml-2" />
                      در حال ارسال کد...
                    </span>
                  ) : (
                    "دریافت کد تأیید"
                  )}
                </button>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    href="/auth/login"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    ورود فروشندگان و مدیران
                  </Link>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitOtp(onSubmitOtp)} className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label
                    htmlFor="otp-input-0"
                    className="block text-sm font-medium text-gray-700"
                  >
                    کد تأیید
                  </label>
                  <span className="text-sm text-gray-500 flex items-center">
                    {remainingTime > 0 ? (
                      <>
                        <TbShieldCheck className="h-4 w-4 ml-1 text-green-500" />
                        زمان باقی‌مانده: {formatTime(remainingTime)}
                      </>
                    ) : (
                      "زمان به پایان رسید"
                    )}
                  </span>
                </div>

                {/* باکس‌های 6 تایی برای ورود کد تأیید */}
                <div className="flex flex-row gap-2 mb-2" dir="ltr">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <div key={index} className="w-full">
                      <input
                        ref={(el) => {
                          otpInputsRef.current[index] = el;
                        }}
                        id={`otp-input-${index}`}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={otpValues[index]}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handleOtpPaste : undefined}
                        className="block w-full h-12 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-lg"
                        aria-label={`رقم ${index + 1} از کد تأیید`}
                        tabIndex={0}
                      />
                    </div>
                  ))}
                </div>

                {/* فیلد مخفی برای react-hook-form */}
                <input type="hidden" {...registerOtp("code")} />

                {otpErrors.code && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <TbAlertCircle className="h-4 w-4 ml-1" />
                    {otpErrors.code.message}
                  </p>
                )}
              </div>

              {/* نمایش موقت کد تأیید */}
              {tempOTP && (
                <div
                  className="rounded-md bg-yellow-50 p-3 flex items-center"
                  role="alert"
                >
                  <p className="text-sm text-yellow-700">
                    <strong>کد تأیید موقت:</strong> {tempOTP}
                  </p>
                </div>
              )}

              {error && (
                <div
                  className="rounded bg-red-50 p-3 flex items-center justify-between"
                  role="alert"
                >
                  <p className="text-sm text-red-700">{error}</p>
                  <TbAlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <TbLoader className="animate-spin h-5 w-5 ml-2" />
                      در حال بررسی...
                    </span>
                  ) : (
                    "تأیید و ورود"
                  )}
                </button>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={remainingTime > 0 || isLoading}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  ارسال مجدد کد
                </button>
                <button
                  type="button"
                  onClick={() => setStep("mobile")}
                  className="text-sm font-medium text-gray-600 hover:text-gray-500"
                >
                  تغییر شماره موبایل
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            با ورود به سایت، شما{" "}
            <Link href="/terms" className="text-blue-600 hover:text-blue-500">
              شرایط و قوانین
            </Link>{" "}
            استفاده از خدمات ما را می‌پذیرید.
          </p>
        </div>
      </div>
    </div>
  );
}
