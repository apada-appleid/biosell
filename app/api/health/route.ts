import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Health check endpoint for monitoring
 * This endpoint checks if the application and database are running
 */
export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Return success response
    return NextResponse.json(
      { 
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Service unavailable',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
} 