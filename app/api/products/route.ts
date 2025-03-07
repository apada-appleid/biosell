import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// GET - Fetch products by seller ID
export async function GET(request: NextRequest) {
  try {
    const sellerId = request.nextUrl.searchParams.get('sellerId');
    
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller ID is required' }, { status: 400 });
    }
    
    // Find active products for this seller with their images
    const products = await prisma.product.findMany({
      where: { 
        sellerId,
        isActive: true 
      },
      include: {
        images: {
          orderBy: {
            order: 'asc'
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