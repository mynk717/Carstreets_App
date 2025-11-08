import { NextRequest, NextResponse } from 'next/server';
import { EmailOTPService } from '@/lib/services/email-otp.service';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, email } = body;

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check existing dealer
    const existingDealer = await prisma.dealer.findUnique({
      where: { email },
    });

    // Get IP and User Agent
    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Send OTP via Email
    const result = await EmailOTPService.sendOTP({
      email,
      phone,
      dealerId: existingDealer?.id,
      ipAddress,
      userAgent,
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.message,
          code: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      otpId: result.otpId,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error('Send OTP API Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
