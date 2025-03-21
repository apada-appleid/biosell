import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all available plans
    const plans = await prisma.plan.findMany({
      orderBy: [
        { price: 'asc' },
        { name: 'asc' }
      ],
    });

    // Process the plans to ensure features is an array
    const processedPlans = plans.map(plan => {
      // Parse features from JSON if it's a string, or use as is if already parsed
      let features = [];
      try {
        if (typeof plan.features === 'string') {
          features = JSON.parse(plan.features);
        } else if (Array.isArray(plan.features)) {
          features = plan.features;
        } else if (plan.features && typeof plan.features === 'object') {
          // If it's a non-null object but not an array, convert to array format
          features = Object.values(plan.features as Record<string, any>);
        }
      } catch (error) {
        console.error(`Error parsing features for plan ${plan.id}:`, error);
        features = [];
      }

      return {
        ...plan,
        features: Array.isArray(features) ? features : [],
      };
    });

    return NextResponse.json(processedPlans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
} 