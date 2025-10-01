import { NextRequest, NextResponse } from 'next/server';
import { cacheManager } from '@/lib/cache/redis';
import { prisma } from '@/lib/database/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const dealerId = searchParams.get('dealerId') || 'admin';
    
    // Build filters
    const filters = {
      brand: searchParams.get('brand'),
      minPrice: searchParams.get('minPrice'),
      maxPrice: searchParams.get('maxPrice'),
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      search: searchParams.get('search'),
    };
    
    // Try cache first
    const cachedCars = await cacheManager.getCars(dealerId, filters);
    
    if (cachedCars) {
      return NextResponse.json({
        success: true,
        data: cachedCars,
        source: 'cache',
        timestamp: new Date().toISOString()
      });
    }
    
    // Build database query
    const where: any = { dealerId };
    
    if (filters.brand) where.brand = filters.brand;
    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = BigInt(filters.minPrice);
      if (filters.maxPrice) where.price.lte = BigInt(filters.maxPrice);
    }
    if (filters.year) where.year = filters.year;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { brand: { contains: filters.search, mode: 'insensitive' } },
        { model: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    
    // Fetch from database - using only existing fields
    const cars = await prisma.car.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit for performance
      select: {
        id: true,
        title: true,
        brand: true,
        model: true,
        year: true,
        price: true,
        kmDriven: true,
        location: true,
        images: true,
        isVerified: true,
        carStreetsListed: true,
        createdAt: true,
        // Remove these until Prisma client is updated in deployment:
        // viewCount: true,
        // leadCount: true
      }
    });
    
    // Transform price for JSON serialization
    const transformedCars = cars.map(car => ({
      ...car,
      price: car.price.toString(),
      displayPrice: `₹${Number(car.price).toLocaleString('en-IN')}`,
      // Add default values for new fields
      viewCount: 0,
      leadCount: 0
    }));
    
    // Cache the results
    await cacheManager.setCars(dealerId, filters, transformedCars);
    
    return NextResponse.json({
      success: true,
      data: transformedCars,
      source: 'database',
      count: transformedCars.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Enhanced cars API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch cars',
      message: error.message
    }, { status: 500 });
  }
}

// Simple POST for testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dealerId = body.dealerId || 'admin';
    
    // Invalidate cache
    await cacheManager.invalidateDealerCache(dealerId);
    
    return NextResponse.json({
      success: true,
      message: 'Cache invalidated for dealer: ' + dealerId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
