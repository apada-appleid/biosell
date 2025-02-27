import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch all products for the authenticated seller
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a seller
    if (!session || session.user.type !== 'seller') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sellerId = session.user.id;

    // Fetch all products belonging to this seller
    const products = await prisma.product.findMany({
      where: {
        sellerId: sellerId,
      },
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(products);
    
  } catch (error) {
    console.error('Error fetching seller products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Create a new product for the authenticated seller
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a seller
    if (!session || session.user.type !== 'seller') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sellerId = session.user.id;
    
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

    // Count existing products
    const productCount = await prisma.product.count({
      where: {
        sellerId: sellerId
      }
    });

    // Check if seller has reached product limit
    if (productCount >= subscription.plan.maxProducts) {
      return NextResponse.json(
        { error: 'You have reached the maximum number of products for your subscription' },
        { status: 403 }
      );
    }

    // For a real implementation, we'd need to handle multipart form data
    // This is simplified and assumes JSON data
    const json = await request.json();
    
    const { title, description, price, inventory, isActive } = json;

    // Basic validation
    if (!title || !price) {
      return NextResponse.json(
        { error: 'Title and price are required' },
        { status: 400 }
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
        sellerId
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