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
    
    // یافتن فروشنده با نام کاربری و فروشگاه پیش‌فرض او
    const seller = await prisma.seller.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        bio: true,
        profileImage: true,
        isActive: true,
        shops: {
          where: {
            isDefault: true,
          },
          select: {
            id: true,
            shopName: true,
            description: true,
            instagramId: true,
            isActive: true,
          },
          take: 1
        }
      }
    });
    
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }
    
    // بررسی فعال بودن فروشنده
    if (!seller.isActive) {
      return NextResponse.json({ error: 'This seller is currently not active' }, { status: 403 });
    }
    
    // بررسی وجود فروشگاه پیش‌فرض
    if (!seller.shops || seller.shops.length === 0) {
      return NextResponse.json({ error: 'This seller has no active shop' }, { status: 404 });
    }
    
    // بررسی فعال بودن فروشگاه پیش‌فرض
    if (!seller.shops[0].isActive) {
      return NextResponse.json({ error: 'This shop is currently not active' }, { status: 403 });
    }
    
    // استخراج اطلاعات فروشگاه پیش‌فرض
    const defaultShop = seller.shops[0];
    
    // بازگرداندن اطلاعات فروشنده با فرمت مورد انتظار
    return NextResponse.json({
      seller: {
        id: seller.id,
        username: seller.username,
        bio: seller.bio,
        profileImage: seller.profileImage,
        isActive: seller.isActive,
        shopId: defaultShop.id,
        shopName: defaultShop.shopName,
      }
    });
    
  } catch (error) {
    console.error('Error fetching seller:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seller information' },
      { status: 500 }
    );
  }
} 