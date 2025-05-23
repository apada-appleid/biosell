import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/settings/debug - Debug API to check if settings table exists
export async function GET(request: Request) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to query directly using Prisma's raw query functionality
    const rawResult = await prisma.$queryRaw`
      SHOW TABLES LIKE 'settings';
    `;

    // List all tables in the database
    const allTables = await prisma.$queryRaw`
      SHOW TABLES;
    `;

    return NextResponse.json({
      success: true,
      rawResult,
      allTables,
      clientModels: Object.keys(prisma),
      prismaClientInfo: {
        hasSettingsTable: typeof prisma.setting !== 'undefined',
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 