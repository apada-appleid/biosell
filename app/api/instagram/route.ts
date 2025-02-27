import { NextRequest, NextResponse } from 'next/server';
import { instagramClient } from '@/app/lib/instagram';

/**
 * API route to fetch Instagram posts for a specific username
 * 
 * This can be expanded to include authentication and verification
 * to ensure only users with valid plans can access this API
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');
    
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }
    
    // In a real implementation, you would validate that this username
    // belongs to a user with an active plan in your system
    
    // For now, we'll use our mock implementation
    // In production, this would use the actual Instagram username
    const products = await instagramClient.getProductsFromInstagram();
    
    return NextResponse.json({ 
      products,
      username
    });
  } catch (error) {
    console.error('Error fetching Instagram data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Instagram data' }, 
      { status: 500 }
    );
  }
} 