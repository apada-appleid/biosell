import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch products by seller ID
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');
    
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
    
    return NextResponse.json({ 
      products,
      count: products.length 
    });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
} 