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
    
    // DEPRECATED: Use /api/shop/[username] instead
    // For backward compatibility, redirect to the shop API
    
    // First, check if a shop exists with this username as the Instagram ID
    const shopByInstagram = await prisma.sellerShop.findFirst({
      where: {
        instagramId: username,
        isActive: true,
        deletedAt: null
      },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            bio: true,
            profileImage: true,
            isActive: true
          }
        }
      }
    });

    // If shop is found by Instagram ID
    if (shopByInstagram && shopByInstagram.seller) {
      return NextResponse.json({
        seller: {
          id: shopByInstagram.seller.id,
          username: shopByInstagram.seller.username,
          bio: shopByInstagram.seller.bio,
          profileImage: shopByInstagram.seller.profileImage,
          isActive: shopByInstagram.seller.isActive,
          shopId: shopByInstagram.id,
          shopName: shopByInstagram.shopName,
          instagramId: shopByInstagram.instagramId,
          defaultShop: {
            id: shopByInstagram.id,
            shopName: shopByInstagram.shopName,
            instagramId: shopByInstagram.instagramId,
            isActive: shopByInstagram.isActive
          }
        }
      });
    }
    
    // If no shop found by Instagram ID, try finding by seller username
    const seller = await prisma.seller.findUnique({
      where: { 
        username,
        isActive: true
      },
      select: {
        id: true,
        username: true,
        bio: true,
        profileImage: true,
        isActive: true
      }
    });
    
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }
    
    // Find the default shop for this seller
    const shop = await prisma.sellerShop.findFirst({
      where: {
        sellerId: seller.id,
        isDefault: true,
        isActive: true,
        deletedAt: null
      },
      select: {
        id: true,
        shopName: true,
        instagramId: true,
        description: true,
        isActive: true
      }
    });
    
    if (!shop) {
      // If no default shop, try to get any active shop from this seller
      const anyShop = await prisma.sellerShop.findFirst({
        where: {
          sellerId: seller.id,
          isActive: true,
          deletedAt: null
        },
        select: {
          id: true,
          shopName: true,
          instagramId: true,
          description: true,
          isActive: true
        }
      });
      
      if (!anyShop) {
        return NextResponse.json({ error: 'This seller has no active shop' }, { status: 404 });
      }
      
      // Use any available shop
      return NextResponse.json({
        seller: {
          id: seller.id,
          username: seller.username,
          bio: seller.bio,
          profileImage: seller.profileImage,
          isActive: seller.isActive,
          shopId: anyShop.id,
          shopName: anyShop.shopName,
          instagramId: anyShop.instagramId,
          defaultShop: anyShop
        }
      });
    }
    
    // Return the seller information with shop details
    return NextResponse.json({
      seller: {
        id: seller.id,
        username: seller.username,
        bio: seller.bio,
        profileImage: seller.profileImage,
        isActive: seller.isActive,
        shopId: shop.id,
        shopName: shop.shopName,
        instagramId: shop.instagramId,
        defaultShop: shop
      }
    });
    
  } catch (error) {
    console.error('Error fetching shop:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shop information' },
      { status: 500 }
    );
  }
} 