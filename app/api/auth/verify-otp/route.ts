import { NextRequest, NextResponse } from 'next/server';
import { EmailOTPService } from '@/lib/services/email-otp.service';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otpCode, name, password, subdomain } = body;

    console.log('🔍 [Verify OTP] Request received:', { 
      email, 
      otpCodeLength: otpCode?.length,
      subdomain 
    });

    // Validation
    if (!email || !otpCode) {
      return NextResponse.json(
        { error: 'Email and OTP code are required' },
        { status: 400 }
      );
    }

    // Verify OTP using EmailOTPService
    const verificationResult = await EmailOTPService.verifyOTP({
      email,
      otpCode,
    });

    if (!verificationResult.success) {
      console.log('❌ [Verify OTP] Verification failed:', verificationResult.message);
      return NextResponse.json(
        { 
          error: verificationResult.message,
          code: verificationResult.error,
        },
        { status: 400 }
      );
    }

    console.log('✅ [Verify OTP] OTP verified successfully');

    // Check if this is a new signup or existing dealer verification
    let dealer = await prisma.dealer.findUnique({
      where: { email },
    });

    if (!dealer) {
      // New dealer signup
      if (!name) {
        return NextResponse.json(
          { error: 'Name is required for new signups' },
          { status: 400 }
        );
      }

      if (!subdomain) {
        return NextResponse.json(
          { error: 'Subdomain is required for new signups' },
          { status: 400 }
        );
      }

      // Hash password if provided
      let passwordHash: string | null = null;
      if (password) {
        passwordHash = await bcrypt.hash(password, 12);
      }

      // Use user-selected subdomain (already validated in frontend)
      let finalSubdomain = subdomain;
      let counter = 1;
      
      // Ensure subdomain is unique (safety check, frontend should have validated)
      while (await prisma.dealer.findUnique({ where: { subdomain: finalSubdomain } })) {
        console.log(`⚠️ [Verify OTP] Subdomain ${finalSubdomain} already taken, trying alternative`);
        finalSubdomain = `${subdomain}-${counter}`;
        counter++;
      }

      console.log('🆕 [Verify OTP] Creating dealer with subdomain:', finalSubdomain);

      // Create new dealer
      dealer = await prisma.dealer.create({
        data: {
          name,
          businessName: name,
          email,
          passwordHash,
          emailVerified: new Date(),
          isVerified: true,
          authProviders: ['email'],
          subdomain: finalSubdomain,
        },
      });

      console.log('🎉 [Verify OTP] New dealer created:', { 
        dealerId: dealer.id, 
        email,
        subdomain: finalSubdomain 
      });

      // Log successful signup
      await prisma.loginAudit.create({
        data: {
          dealerId: dealer.id,
          success: true,
          method: 'email_otp',
          ipAddress: req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
        },
      });
    } else {
      // Existing dealer - just verify email
      await prisma.dealer.update({
        where: { id: dealer.id },
        data: {
          emailVerified: new Date(),
          isVerified: true,
          lastLoginAt: new Date(),
        },
      });

      console.log('✅ [Verify OTP] Existing dealer verified:', { 
        dealerId: dealer.id, 
        email 
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      dealer: {
        id: dealer.id,
        name: dealer.name,
        email: dealer.email,
        subdomain: dealer.subdomain,
        isVerified: dealer.isVerified,
      },
    });
  } catch (error) {
    console.error('💥 [Verify OTP] API Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
