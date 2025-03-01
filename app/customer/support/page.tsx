'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  TbMailForward, TbLoader, TbCircleCheck, 
  TbMessageDots, TbClock, TbAlertCircle,
  TbChevronDown, TbChevronUp
} from 'react-icons/tb';

// تعریف نوع برای تیکت‌ها
type Ticket = {
  id: string;
  title: string;
  message: string;
  status: 'pending' | 'answered' | 'closed';
  createdAt: string;
  updatedAt: string;
  lastReplyBy: 'user' | 'admin';
  responses: {
    id: string;
    message: string;
    createdAt: string;
    isFromAdmin: boolean;
  }[];
};

// تعریف طرح اعتبارسنجی فرم با zod
const ticketSchema = z.object({
  title: z.string().min(5, 'عنوان باید حداقل ۵ کاراکتر باشد'),
  message: z.string().min(10, 'پیام باید حداقل ۱۰ کاراکتر باشد'),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

export default function CustomerSupport() {
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  // تنظیمات فرم با react-hook-form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
  });

  useEffect(() => {
    // در حالت واقعی، باید درخواست API را برای دریافت تیکت‌ها انجام داد
    // اما در اینجا، از داده‌های شبیه‌سازی شده استفاده می‌کنیم
    setTimeout(() => {
      const mockTickets: Ticket[] = [];
      setTickets(mockTickets);
      setIsLoading(false);
    }, 1000);
  }, []);

  const onSubmit = (data: TicketFormValues) => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    // در حالت واقعی، باید درخواست API را برای ارسال تیکت انجام داد
    // اما در اینجا، از تاخیر شبیه‌سازی شده استفاده می‌کنیم
    setTimeout(() => {
      console.log('تیکت جدید ارسال شد:', data);
      
      // اضافه کردن تیکت جدید به لیست
      const newTicket: Ticket = {
        id: `${tickets.length + 1}`,
        title: data.title,
        message: data.message,
        status: 'pending',
        createdAt: '۱۴۰۳/۱/۳۰', // تاریخ امروز
        updatedAt: '۱۴۰۳/۱/۳۰',
        lastReplyBy: 'user',
        responses: [],
      };
      
      setTickets([newTicket, ...tickets]);
      setIsSubmitting(false);
      setSubmitStatus('success');
      reset();

      // پاک کردن پیام موفقیت پس از چند ثانیه
      setTimeout(() => {
        setSubmitStatus(null);
      }, 3000);
    }, 1500);
  };

  const toggleTicket = (ticketId: string) => {
    if (expandedTicket === ticketId) {
      setExpandedTicket(null);
    } else {
      setExpandedTicket(ticketId);
    }
  };

  // تبدیل وضعیت تیکت به فارسی
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'در انتظار پاسخ';
      case 'answered':
        return 'پاسخ داده شده';
      case 'closed':
        return 'بسته شده';
      default:
        return status;
    }
  };

  // تبدیل وضعیت تیکت به رنگ
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'answered':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // نمایش آیکون وضعیت تیکت
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <TbClock className="h-5 w-5" />;
      case 'answered':
        return <TbMessageDots className="h-5 w-5" />;
      case 'closed':
        return <TbCircleCheck className="h-5 w-5" />;
      default:
        return <TbAlertCircle className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">پشتیبانی و تیکت‌ها</h1>
        <div className="mt-4 md:mt-0">
          <Link
            href="/customer/dashboard"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            بازگشت به داشبورد
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* فرم ارسال تیکت جدید */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">ارسال تیکت جدید</h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    موضوع
                  </label>
                  <input
                    type="text"
                    id="title"
                    className={`block w-full py-2 px-3 border ${
                      errors.title ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm sm:text-sm`}
                    placeholder="موضوع تیکت خود را وارد کنید"
                    {...register('title')}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    متن پیام
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    className={`block w-full py-2 px-3 border ${
                      errors.message ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm sm:text-sm`}
                    placeholder="پیام خود را وارد کنید"
                    {...register('message')}
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  {submitStatus === 'success' && (
                    <div className="flex items-center text-green-600">
                      <TbCircleCheck className="h-5 w-5 ml-1" />
                      <span className="text-sm">تیکت با موفقیت ارسال شد</span>
                    </div>
                  )}
                  {submitStatus === 'error' && (
                    <div className="text-red-600 text-sm">
                      خطا در ارسال تیکت. لطفاً دوباره تلاش کنید.
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed mr-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <TbLoader className="animate-spin ml-2 h-4 w-4" />
                        در حال ارسال...
                      </>
                    ) : (
                      <>
                        <TbMailForward className="ml-2 -mr-1 h-4 w-4" />
                        ارسال تیکت
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* لیست تیکت‌ها */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">تیکت‌های من</h2>
            </div>
            
            <div className="p-0">
              {tickets.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <li key={ticket.id} className="border-b border-gray-200 last:border-b-0">
                      <div 
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                        onClick={() => toggleTicket(ticket.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-start">
                            <div className={`flex-shrink-0 p-1 rounded-md ${getStatusColor(ticket.status)} mr-3`}>
                              {getStatusIcon(ticket.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {ticket.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                تاریخ ایجاد: {ticket.createdAt}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)} ml-2`}>
                              {getStatusText(ticket.status)}
                            </span>
                            {expandedTicket === ticket.id ? (
                              <TbChevronUp className="h-5 w-5 text-gray-500" />
                            ) : (
                              <TbChevronDown className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* جزئیات تیکت */}
                      {expandedTicket === ticket.id && (
                        <div className="bg-gray-50 p-4 border-t border-gray-200">
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">پیام اصلی:</h4>
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                تاریخ: {ticket.createdAt}
                              </p>
                            </div>
                          </div>
                          
                          {/* پاسخ‌ها */}
                          {ticket.responses.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">پاسخ‌ها:</h4>
                              <div className="space-y-3">
                                {ticket.responses.map((response) => (
                                  <div 
                                    key={response.id} 
                                    className={`p-3 rounded-lg border ${
                                      response.isFromAdmin 
                                        ? 'border-blue-200 bg-blue-50 mr-6' 
                                        : 'border-gray-200 bg-white ml-6'
                                    }`}
                                  >
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{response.message}</p>
                                    <div className="flex justify-between mt-2">
                                      <p className="text-xs font-medium text-gray-900">
                                        {response.isFromAdmin ? 'پشتیبانی' : 'شما'}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {response.createdAt}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* فرم پاسخ در صورتی که تیکت باز باشد */}
                          {ticket.status !== 'closed' && (
                            <div className="mt-4">
                              <textarea
                                rows={3}
                                className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="پاسخ خود را بنویسید..."
                              />
                              <div className="mt-2 flex justify-end">
                                <button
                                  type="button"
                                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  ارسال پاسخ
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500">هیچ تیکتی یافت نشد.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* اطلاعات تماس */}
      <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">راه‌های ارتباطی دیگر</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border border-gray-200 rounded-lg text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">تلفن تماس</h3>
              <p className="text-gray-600">۰۲۱-۱۲۳۴۵۶۷۸</p>
              <p className="text-sm text-gray-500 mt-2">شنبه تا چهارشنبه ۹ الی ۱۷</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">ایمیل پشتیبانی</h3>
              <p className="text-gray-600 font-mono">support@example.com</p>
              <p className="text-sm text-gray-500 mt-2">پاسخگویی: ۲۴ ساعته</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">آدرس</h3>
              <p className="text-gray-600">تهران، خیابان ولیعصر، خیابان توانیر</p>
              <p className="text-sm text-gray-500 mt-2">کد پستی: ۱۲۳۴۵۶۷۸۹۰</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 