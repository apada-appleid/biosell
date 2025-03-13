import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// این API درخواست‌ها را به API اصلی فروشگاه هدایت می‌کند
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }
    
    // یافتن فروشنده با نام کاربری
    const seller = await prisma.seller.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        shopName: true,
        bio: true,
        profileImage: true,
        isActive: true
      }
    });
    
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }
    
    // بررسی فعال بودن فروشگاه
    if (!seller.isActive) {
      return NextResponse.json({ error: 'This shop is currently not active' }, { status: 403 });
    }
    
    // بازگرداندن اطلاعات فروشنده با فرمت مورد انتظار
    return NextResponse.json({
      seller: seller
    });
    
  } catch (error) {
    console.error('Error fetching seller:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seller information' },
      { status: 500 }
    );
  }
} 