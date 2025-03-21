import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get all sellers
    const sellers = await prisma.seller.findMany({
      select: {
        id: true,
        username: true,
        isActive: true,
        shops: {
          select: {
            id: true,
            shopName: true,
            isDefault: true,
            isActive: true,
            deletedAt: true
          }
        }
      }
    });
    
    return NextResponse.json({ sellers });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
} 