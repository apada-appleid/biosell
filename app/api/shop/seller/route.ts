import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch seller information by username
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    
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
    
    return NextResponse.json(seller);
    
  } catch (error) {
    console.error('Error fetching seller:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seller information' },
      { status: 500 }
    );
  }
} 