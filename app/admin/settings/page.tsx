'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { TbMessageCircle } from 'react-icons/tb';

// Settings items
const settingsItems = [
  {
    name: 'تنظیمات پیامک',
    description: 'پیکربندی سرویس ارسال پیامک، الگوها و تنظیمات آن',
    href: '/admin/settings/sms',
    icon: TbMessageCircle,
  },
];

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Protect this page for admin users only
  useEffect(() => {
    if (status === 'authenticated' && session?.user.type !== 'admin') {
      router.push('/admin/dashboard');
    }
  }, [session, status, router]);

  if (status === 'loading' || (status === 'authenticated' && session?.user.type !== 'admin')) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">تنظیمات سیستم</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-3 rounded-full bg-blue-50 mb-4">
              <item.icon className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold mb-2">{item.name}</h2>
            <p className="text-gray-600 text-center text-sm">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
} 