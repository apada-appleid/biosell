import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get the query parameter for username
    const url = new URL(request.url);
    const username = url.searchParams.get('username') || 'siamak_seller_online';
    
    // Debug information
    const debug = {
      seller: null as any,
      shops: null as any,
      shopByInstagram: null as any,
      anyShop: null as any
    };
    
    // Try finding seller
    const seller = await prisma.seller.findFirst({
      where: { 
        username,
      },
      select: {
        id: true,
        username: true,
        isActive: true
      }
    });
    
    debug.seller = seller;
    
    if (seller) {
      // Get all shops for this seller
      const shops = await prisma.sellerShop.findMany({
        where: {
          sellerId: seller.id,
        },
        select: {
          id: true,
          shopName: true,
          instagramId: true,
          isDefault: true,
          isActive: true,
          deletedAt: true
        }
      });
      
      debug.shops = shops;
    }
    
    // Try finding shop by Instagram ID
    const shopByInstagram = await prisma.sellerShop.findFirst({
      where: {
        instagramId: username,
      },
      select: {
        id: true,
        shopName: true,
        sellerId: true,
        instagramId: true,
        isDefault: true,
        isActive: true,
        deletedAt: true
      }
    });
    
    debug.shopByInstagram = shopByInstagram;
    
    // Try finding any shop
    const anyShop = await prisma.sellerShop.findFirst({
      select: {
        id: true,
        shopName: true,
        sellerId: true,
        instagramId: true,
        isDefault: true,
        isActive: true,
        deletedAt: true
      }
    });
    
    debug.anyShop = anyShop;
    
    // Return all debug information
    return NextResponse.json({
      username,
      debug
    });
    
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: String(error) },
      { status: 500 }
    );
  }
} 