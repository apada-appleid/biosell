import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import authOptions from '@/lib/auth';
import { join } from 'path';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session || session.user.type !== 'seller') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sellerId = session.user.id;
    const imageId = (await params).id;
    
    if (!imageId || typeof imageId !== 'string') {
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
    }
    
    // Find the image and verify it belongs to a product owned by the seller
    const image = await prisma.productImage.findUnique({
      where: {
        id: imageId,
      },
      include: {
        product: {
          select: {
            sellerId: true,
          },
        },
      },
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    if (image.product.sellerId !== sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the physical file if it exists
    try {
      const imagePath = join(process.cwd(), 'public', image.imageUrl);
      
      // Check if file exists before attempting to delete
      if (existsSync(imagePath)) {
        await unlink(imagePath);
      } else {
        console.warn(`Image file not found at path: ${imagePath}`);
      }
    } catch (error) {
      console.error('Error deleting image file:', error);
      // Continue even if the file cannot be deleted
    }

    // Delete the database record
    await prisma.productImage.delete({
      where: {
        id: imageId,
      },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Image deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting product image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
} 