import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    // Transform the features from JSON to array for a plan
    const transformPlan = (plan: any) => ({
      ...plan,
      features: typeof plan.features === 'string' 
        ? JSON.parse(plan.features as string) 
        : plan.features
    });
    
    // If ID is provided, get a specific plan
    if (id) {
      const plan = await prisma.plan.findUnique({
        where: { id }
      });
      
      if (!plan) {
        return NextResponse.json({ 
          success: false, 
          message: 'Plan not found' 
        }, { status: 404 });
      }
      
      return NextResponse.json({ 
        success: true, 
        plan: transformPlan(plan)
      });
    }
    
    // Otherwise, get all active plans
    const plans = await prisma.plan.findMany({
      orderBy: {
        price: 'asc'
      }
    });

    // Transform the features from JSON to array for all plans
    const transformedPlans = plans.map(transformPlan);

    return NextResponse.json({ 
      success: true, 
      plans: transformedPlans 
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown server error' 
      },
      { status: 500 }
    );
  }
} 