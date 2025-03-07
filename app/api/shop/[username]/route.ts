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
    
    // Find seller by username
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
    
    // Check if seller is active
    if (!seller.isActive) {
      return NextResponse.json({ error: 'This shop is currently not active' }, { status: 403 });
    }
    
    // Return the seller information in the expected format
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