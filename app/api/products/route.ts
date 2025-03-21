import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch products by shop ID or seller ID
export async function GET(request: NextRequest) {
  try {
    // Get shopId and/or sellerId from query parameters
    const url = new URL(request.url);
    const shopId = url.searchParams.get('shopId');
    const sellerId = url.searchParams.get('sellerId');
    
    // Build the product query
    let query: any = {
      deletedAt: null, // Filter out soft-deleted products
      isActive: true // Only include active products
    };
    
    // Add shop filtering if shopId is provided
    if (shopId) {
      // Find products where this is either the main shop or one of the display shops
      query.OR = [
        { shopId },
        { 
          shops: {
            some: {
              shopId
            }
          }
        }
      ];
    }
    // Add seller filtering if sellerId is provided
    else if (sellerId) {
      query.shop = {
        sellerId,
        deletedAt: null // Filter out products from deleted shops
      };
    }
    
    // Fetch products
    const products = await prisma.product.findMany({
      where: query,
      include: {
        images: {
          select: {
            id: true,
            imageUrl: true,
            order: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        shop: {
          select: {
            id: true,
            shopName: true,
            sellerId: true
          }
        },
        shops: {
          select: {
            shopId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Process products to include display shops
    const processedProducts = products.map(product => {
      // Extract shopIds from the product-shop mappings
      const displayShops = product.shops ? product.shops.map((mapping: any) => mapping.shopId) : [];
      
      // Remove the shops array and add displayShops
      const { shops, ...productWithoutShops } = product;
      return {
        ...productWithoutShops,
        displayShops
      };
    });
    
    return NextResponse.json({ products: processedProducts });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
} 