import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch a specific product with the given ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a seller
    if (!session || session.user.type !== 'seller') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sellerId = session.user.id;
    const productId = params.id;

    // Fetch the product with the given ID
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
        sellerId: sellerId, // Ensure the product belongs to the authenticated seller
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
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
    
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT - Update a product with the given ID
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a seller
    if (!session || session.user.type !== 'seller') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sellerId = session.user.id;
    const productId = params.id;

    // Verify product exists and belongs to seller
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: productId,
        sellerId: sellerId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // For a real implementation, we'd need to handle multipart form data
    // This is simplified and assumes JSON data
    const json = await request.json();
    
    const { title, description, price, inventory, isActive } = json;

    // Basic validation
    if (!title || price === undefined) {
      return NextResponse.json(
        { error: 'Title and price are required' },
        { status: 400 }
      );
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        title,
        description,
        price: Number(price),
        inventory: Number(inventory || 0),
        isActive: isActive ?? true,
      },
    });

    // In a real implementation, we'd handle image updates here
    // For example, updating or removing existing images and adding new ones

    return NextResponse.json(updatedProduct);
    
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a product with the given ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a seller
    if (!session || session.user.type !== 'seller') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sellerId = session.user.id;
    const productId = params.id;

    // Verify product exists and belongs to seller
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: productId,
        sellerId: sellerId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // In a real implementation, we would also delete related images
    // This would involve deleting records from the ProductImage table
    // and possibly removing files from a storage service

    // Delete the product
    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
} 