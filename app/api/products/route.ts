import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// GET - Fetch products by shop ID or seller ID
export async function GET(request: NextRequest) {
  try {
    const sellerId = request.nextUrl.searchParams.get('sellerId');
    const shopId = request.nextUrl.searchParams.get('shopId');
    
    if (!sellerId && !shopId) {
      return NextResponse.json({ error: 'Either Seller ID or Shop ID is required' }, { status: 400 });
    }
    
    let query: any = {
      isActive: true
    };
    
    // If shopId is provided, use that directly
    if (shopId) {
      query.shopId = shopId;
    } 
    // If only sellerId is provided, find the seller's default shop
    else if (sellerId) {
      const defaultShop = await prisma.sellerShop.findFirst({
        where: {
          sellerId,
          isDefault: true
        }
      });
      
      if (!defaultShop) {
        return NextResponse.json({ 
          error: "Seller's default shop not found",
          products: [] 
        }, { status: 200 });
      }
      
      query.shopId = defaultShop.id;
    }
    
    // Find active products for this shop with their images
    const products = await prisma.product.findMany({
      where: query,
      include: {
        images: {
          orderBy: {
            order: 'asc'
          }
        },
        shop: {
          select: {
            shopName: true,
            seller: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Return the products in the expected format
    return NextResponse.json({
      products: products
    });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
} 