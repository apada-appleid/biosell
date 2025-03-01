import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';

export async function GET() {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all plans
    const plans = await prisma.plan.findMany({
      orderBy: {
        price: 'asc',
      },
    });

    // Format the plans for the response
    const formattedPlans = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      features: Array.isArray(plan.features) 
        ? plan.features 
        : JSON.parse(plan.features as string),
      maxProducts: plan.maxProducts,
    }));

    return NextResponse.json(formattedPlans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 