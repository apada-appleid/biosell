import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// GET - Fetch seller information by username from the URL path
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }
    
    // Find seller by username with default shop
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
    
    // Check if seller is active
    if (!seller.isActive) {
      return NextResponse.json({ error: 'This seller is currently not active' }, { status: 403 });
    }
    
    // Check if seller has a default shop
    if (!seller.shops || seller.shops.length === 0) {
      return NextResponse.json({ error: 'This seller has no active shop' }, { status: 404 });
    }
    
    // Get the default shop
    const defaultShop = seller.shops[0];
    
    // Check if the shop is active
    if (!defaultShop.isActive) {
      return NextResponse.json({ error: 'This shop is currently not active' }, { status: 403 });
    }
    
    // Return the seller information with shop details
    return NextResponse.json({
      seller: {
        id: seller.id,
        username: seller.username,
        bio: seller.bio,
        profileImage: seller.profileImage,
        isActive: seller.isActive,
        shopId: defaultShop.id,
        shopName: defaultShop.shopName,
        instagramId: defaultShop.instagramId
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