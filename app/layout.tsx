import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Biosell - بایوسل | فروشگاه‌ساز آنلاین برای صفحات اینستاگرام",
  description: "فروشگاه‌ساز آنلاین برای صفحات اینستاگرام - بایوسل",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Biosell - بایوسل",
    startupImage: [
      {
        url: "/icons/ios/1024.png",
        media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
      }
    ]
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/ios/180.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/ios/152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/ios/120.png', sizes: '120x120', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
          rel="stylesheet"
          type="text/css"
        />
        {/* PWA meta tags */}
        <meta name="application-name" content="بایوسل" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="بایوسل" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#FFFFFF" />
        <meta name="pwa-features" content="installable,dismissable" />
        
        <link rel="apple-touch-icon" href="/images/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <footer className="bg-white border-t border-gray-200 mt-10">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* لوگو و توضیحات */}
                <div className="col-span-1 md:col-span-1">
                  <h2 className="text-xl font-bold text-blue-600 mb-4">بایوسل</h2>
                  <p className="text-gray-600 text-sm">
                    فروشگاه‌ساز آنلاین برای صفحات اینستاگرام - با بایوسل به راحتی محصولات خود را به مشتریان‌تان بفروشید.
                  </p>
                </div>

                {/* لینک‌های دسترسی سریع */}
                <div className="col-span-1">
                  <h3 className="text-sm font-semibold text-gray-900 tracking-wider mb-4">
                    دسترسی سریع
                  </h3>
                  <ul className="space-y-3">
                    <li>
                      <a href="/" className="text-gray-600 hover:text-blue-600 text-sm">
                        صفحه اصلی
                      </a>
                    </li>
                    <li>
                      <a href="/products" className="text-gray-600 hover:text-blue-600 text-sm">
                        محصولات
                      </a>
                    </li>
                    <li>
                      <a href="/seller/register" className="text-gray-600 hover:text-blue-600 text-sm">
                        ثبت‌نام فروشندگان
                      </a>
                    </li>
                  </ul>
                </div>

                {/* لینک‌های قانونی */}
                <div className="col-span-1">
                  <h3 className="text-sm font-semibold text-gray-900 tracking-wider mb-4">
                    اطلاعات
                  </h3>
                  <ul className="space-y-3">
                    <li>
                      <a href="/legal/terms-of-service" className="text-gray-600 hover:text-blue-600 text-sm">
                        قوانین و مقررات
                      </a>
                    </li>
                    <li>
                      <a href="/legal/privacy-policy" className="text-gray-600 hover:text-blue-600 text-sm">
                        حریم خصوصی
                      </a>
                    </li>
                    <li>
                      <a href="/contact" className="text-gray-600 hover:text-blue-600 text-sm">
                        تماس با ما
                      </a>
                    </li>
                  </ul>
                </div>

                {/* اینماد */}
                <div className="col-span-1 flex justify-start md:justify-center items-start">
                  <a
                    referrerPolicy="origin"
                    target="_blank"
                    href="https://trustseal.enamad.ir/?id=608402&Code=EGm4eCnfOat2Z39mbJ4XAuWxTqvieN7u"
                    aria-label="نماد اعتماد الکترونیکی"
                    tabIndex={0}
                    className="inline-block"
                  >
                    <img
                      referrerPolicy="origin"
                      src="https://trustseal.enamad.ir/logo.aspx?id=608402&Code=EGm4eCnfOat2Z39mbJ4XAuWxTqvieN7u"
                      alt="نماد اعتماد الکترونیکی"
                      style={{ cursor: "pointer" }}
                      width={100}
                      height={100}
                      loading="lazy"
                    />
                  </a>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-500 text-sm">
                  &copy; {new Date().getFullYear()} بایوسل. تمامی حقوق محفوظ است.
                </p>
                <div className="mt-4 md:mt-0 flex flex-col items-end">
                  <p className="text-gray-500 text-sm">
                    <a 
                      href="tel:061-42555049" 
                      className="text-blue-600 hover:text-blue-800"
                    >
                      061-42555049
                    </a>
                  </p>
                  <p className="text-gray-500 text-sm">
                    <a 
                      href="mailto:info@biosell.me" 
                      className="text-blue-600 hover:text-blue-800"
                    >
                      info@biosell.me
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
