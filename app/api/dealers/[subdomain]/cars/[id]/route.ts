import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
// DELETE - Remove car with dealer ownership validation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const { subdomain, id } = await params;

    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: { id: true, email: true }
    });

    if (!dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      );
    }

    if (session.user.email !== dealer.email) {
      return NextResponse.json(
        { error: 'Forbidden - Not your dealership' },
        { status: 403 }
      );
    }

    const car = await prisma.car.findUnique({
      where: { id },
      select: { id: true, dealerId: true, title: true }
    });

    if (!car) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }

    if (car.dealerId !== dealer.id) {
      return NextResponse.json(
        { error: 'Forbidden - This car does not belong to your dealership' },
        { status: 403 }
      );
    }

    // ✅ Safe to delete - Prisma automatically updates _count
    await prisma.car.delete({ where: { id } });

    console.log(`✅ Car deleted: ${car.title} by dealer: ${dealer.id}`);

    return NextResponse.json({
      success: true,
      message: 'Car deleted successfully'
    });
  } catch (error: any) {
    console.error('❌ Error deleting car:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete car', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update car with dealer ownership validation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const { subdomain, id } = await params;
    const updates = await request.json();

    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: { id: true, email: true }
    });

    if (!dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      );
    }

    if (session.user.email !== dealer.email) {
      return NextResponse.json(
        { error: 'Forbidden - Not your dealership' },
        { status: 403 }
      );
    }

    const existingCar = await prisma.car.findUnique({
      where: { id },
      select: { 
        id: true, 
        dealerId: true, 
        title: true,
        editedFields: true,
        manuallyEdited: true
      }
    });

    if (!existingCar) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }

    if (existingCar.dealerId !== dealer.id) {
      return NextResponse.json(
        { error: 'Forbidden - This car does not belong to your dealership' },
        { status: 403 }
      );
    }

    // Track edited fields
    const currentEditedFields = Array.isArray(existingCar.editedFields) 
      ? (existingCar.editedFields as string[]) 
      : [];
    
    const fieldsToTrack = ['title', 'price', 'description', 'location', 'images', 'kmDriven', 'year', 'owners', 'brand', 'model', 'variant', 'fuelType', 'transmission'];
    const newlyEditedFields = [...currentEditedFields];

    for (const field of fieldsToTrack) {
      if (updates[field] !== undefined) {
        if (!newlyEditedFields.includes(field)) {
          newlyEditedFields.push(field);
        }
      }
    }

    // Convert data to match Prisma schema
    const dbUpdates: any = {
      title: updates.title,
      brand: updates.brand,
      model: updates.model,
      variant: updates.variant || null,
      price: updates.price ? BigInt(typeof updates.price === 'string' ? parseInt(updates.price.replace(/[₹,]/g, ''), 10) || 0 : updates.price) : undefined,
      year: updates.year ? parseInt(updates.year.toString()) : undefined,
      fuelType: updates.fuelType,
      transmission: updates.transmission,
      kmDriven: updates.kmDriven ? parseInt(updates.kmDriven.toString()) : undefined,
      location: updates.location,
      images: updates.images ? (Array.isArray(updates.images) ? updates.images : typeof updates.images === 'string' ? updates.images.split(',').filter((url: string) => url.trim()) : []) : undefined,
      description: updates.description,
      sellerType: updates.sellerType,
      owners: updates.owners ? parseInt(updates.owners.toString()) : undefined,
      isVerified: updates.isVerified,
      isFeatured: updates.isFeatured,
      carStreetsListed: updates.carStreetsListed,
      updatedAt: new Date(),
      manuallyEdited: true,
      editedFields: newlyEditedFields
    };

    // Remove undefined values
    Object.keys(dbUpdates).forEach(key => {
      if (dbUpdates[key] === undefined) delete dbUpdates[key];
    });

    const updatedCar = await prisma.car.update({
      where: { id },
      data: dbUpdates
    });

    console.log(`✅ Car updated: ${updatedCar.title} by dealer: ${dealer.id}`);

    return NextResponse.json({
      success: true,
      message: 'Car updated successfully',
      car: {
        ...updatedCar,
        price: updatedCar.price.toString(),
        images: Array.isArray(updatedCar.images) ? updatedCar.images : []
      }
    });
  } catch (error: any) {
    console.error('❌ Error updating car:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update car', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET - Fetch single car with dealer validation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string; id: string }> }
) {
  try {
    const { subdomain, id } = await params;

    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: { id: true }
    });

    if (!dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      );
    }

    const car = await prisma.car.findUnique({
      where: { id }
    });

    if (!car) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }

    if (car.dealerId !== dealer.id) {
      return NextResponse.json(
        { error: 'Forbidden - This car does not belong to your dealership' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      car: {
        ...car,
        price: car.price.toString(),
        images: Array.isArray(car.images) ? car.images : []
      }
    });
  } catch (error) {
    console.error('❌ Error fetching car:', error);
    return NextResponse.json(
      { error: 'Failed to fetch car' },
      { status: 500 }
    );
  }
}
