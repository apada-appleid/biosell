'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TbArrowRight } from 'react-icons/tb';
import SubscriptionsClient from './SubscriptionsClient';

export default function SubscriptionsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">مدیریت اشتراک‌های فروشندگان</h1>
      <SubscriptionsClient />
    </div>
  );
} 