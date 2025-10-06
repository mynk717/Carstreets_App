import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json()
    
    const {
      businessName,
      ownerName,
      email,
      phone,
      location,
      subdomain,
      customDomain,
      description,
      selectedPlan
    } = formData

    // Validate required fields
    if (!businessName || !ownerName || !email || !phone || !location || !subdomain) {
      return NextResponse.json({
        success: false,
        error: 'All required fields must be filled'
      }, { status: 400 })
    }

    // Check if email already exists
    const existingDealerByEmail = await prisma.dealer.findUnique({
      where: { email }
    })

    if (existingDealerByEmail) {
      return NextResponse.json({
        success: false,
        error: 'A dealer with this email already exists'
      }, { status: 400 })
    }

    // Check subdomain availability again
    const existingDealerBySubdomain = await prisma.dealer.findUnique({
      where: { subdomain }
    })

    if (existingDealerBySubdomain) {
      return NextResponse.json({
        success: false,
        error: 'This subdomain is no longer available'
      }, { status: 400 })
    }

    // Plan pricing
    const planPricing: Record<string, number> = {
      starter: 2999,
      professional: 4999,
      enterprise: 9999
    }

    const planAmount = planPricing[selectedPlan] || 4999

    // FIXED: Create dealer with correct field names matching your schema
    const newDealer = await prisma.dealer.create({
      data: {
        name: ownerName,
        businessName,
        email,
        phoneNumber: phone,
        location,
        subdomain,
        customDomain: customDomain || null,
        description: description || null,
        plan: selectedPlan,  // FIXED: Use 'plan' instead of 'subscriptionPlan'
        subscriptionStatus: 'pending',  // This field exists in your schema
        // Removed subscriptionAmount since it's not in your current schema
        domainVerified: false,  // Set default value
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Generate payment URL
    const paymentUrl = `/payment/razorpay?dealerId=${newDealer.id}&amount=${planAmount}`

    return NextResponse.json({
      success: true,
      dealerId: newDealer.id,
      paymentUrl: paymentUrl,
      message: 'Dealer account created successfully'
    })

  } catch (error) {
    console.error('Error creating dealer:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create dealer account'
    }, { status: 500 })
  }
}
