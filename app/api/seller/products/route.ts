import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helpers';

// GET - Fetch all products for the authenticated seller
export async function GET(request: NextRequest) {
  try {
    // Try session-based auth first
    const session = await getServerSession(authOptions);
    let sellerId: string | null = null;
    
    // Check if user is authenticated and is a seller via session
    if (session?.user?.id && session.user.type === 'seller') {
      sellerId = session.user.id;
    } 
    // Fall back to token-based auth
    else {
      const user = await getAuthenticatedUser(request);
      if (user && user.type === 'seller') {
        sellerId = user.userId;
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (!sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameter for shop filtering
    const shopId = request.nextUrl.searchParams.get('shopId');

    // Get all shops for this seller
    const shops = await prisma.sellerShop.findMany({
      where: {
        sellerId
      },
      select: {
        id: true
      }
    });

    // Extract shop IDs
    const shopIds = shops.map(shop => shop.id);
    
    if (shopIds.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Build the query
    const query: any = {
      shop: {
        sellerId
      }
    };
    
    // If shopId is provided and belongs to the seller, use it for filtering
    if (shopId && shopIds.includes(shopId)) {
      query.shopId = shopId;
    }

    // Fetch all products belonging to this seller's shops
    const products = await prisma.product.findMany({
      where: query,
      include: {
        images: {
          select: {
            id: true,
            imageUrl: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        shop: {
          select: {
            id: true,
            shopName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ products });
    
  } catch (error) {
    console.error('Error fetching seller products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Create a new product for the authenticated seller
export async function POST(request: NextRequest) {
  try {
    // Try session-based auth first
    const session = await getServerSession(authOptions);
    let sellerId: string | null = null;
    
    // Check if user is authenticated and is a seller via session
    if (session?.user?.id && session.user.type === 'seller') {
      sellerId = session.user.id;
    } 
    // Fall back to token-based auth
    else {
      const user = await getAuthenticatedUser(request);
      if (user && user.type === 'seller') {
        sellerId = user.userId;
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (!sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get subscription to check product limits
    const subscription = await prisma.subscription.findFirst({
      where: {
        sellerId: sellerId,
        isActive: true,
        endDate: {
          gte: new Date()
        }
      },
      include: {
        plan: true
      }
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 403 }
      );
    }

    // Get all shops for this seller
    const shops = await prisma.sellerShop.findMany({
      where: { sellerId },
      select: { id: true }
    });
    
    const shopIds = shops.map(shop => shop.id);

    // Count existing products across all shops
    const productCount = await prisma.product.count({
      where: {
        shopId: {
          in: shopIds
        }
      }
    });

    // Check if seller has reached product limit
    if (productCount >= subscription.plan.maxProducts) {
      return NextResponse.json(
        { error: 'You have reached the maximum number of products for your subscription' },
        { status: 403 }
      );
    }

    // Parse request body
    const json = await request.json();
    const { title, description, price, inventory, isActive, shopId } = json;

    // Basic validation
    if (!title || !price) {
      return NextResponse.json(
        { error: 'Title and price are required' },
        { status: 400 }
      );
    }

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    // Verify the shop belongs to this seller
    const shopBelongsToSeller = shopIds.includes(shopId);
    if (!shopBelongsToSeller) {
      return NextResponse.json(
        { error: 'The specified shop does not belong to you' },
        { status: 403 }
      );
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        title,
        description,
        price: Number(price),
        inventory: Number(inventory || 0),
        isActive: isActive ?? true,
        shopId
      }
    });

    // In a real implementation, we'd handle image uploads here
    // For example, saving images to a storage service and creating records in the ProductImage table

    return NextResponse.json(product, { status: 201 });
    
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
} 