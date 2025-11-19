import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOTPResult {
  success: boolean;
  message: string;
  otpId?: string;
  expiresAt?: Date;
  error?: string;
}

interface VerifyOTPResult {
  success: boolean;
  message: string;
  dealerId?: string;
  error?: string;
}

export class EmailOTPService {
  private static readonly OTP_LENGTH = 6;
  private static readonly OTP_EXPIRY_MINUTES = 10;
  private static readonly MAX_ATTEMPTS = 5;

  private static generateOTP(): string {
    const min = Math.pow(10, this.OTP_LENGTH - 1);
    const max = Math.pow(10, this.OTP_LENGTH) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  static async sendOTP(params: {
    email: string;
    phone?: string;
    dealerId?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<SendEmailOTPResult> {
    const { email, phone, dealerId, ipAddress, userAgent } = params;

    try {
      console.log('📧 [Email OTP] Starting send process...', { email });

      // Rate limiting
      const recentOTPs = await prisma.oTPVerification.count({
        where: {
          email,
          createdAt: {
            gte: new Date(Date.now() - 10 * 60 * 1000),
          },
        },
      });

      if (recentOTPs >= 3) {
        return {
          success: false,
          message: 'Too many OTP requests. Please try again in 10 minutes.',
          error: 'RATE_LIMIT_EXCEEDED',
        };
      }

      // Generate OTP
      const otpCode = this.generateOTP();
      const otpHash = await bcrypt.hash(otpCode, 10);
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

      console.log('🔑 [Email OTP] Generated OTP:', { otpCode });

      // ✅ FIX 1: Send email with better error handling
      let emailResult;
      try {
        emailResult = await resend.emails.send({
          from: process.env.EMAIL_FROM || 'MotoYard <noreply@motoyard.mktgdime.com>',
          to: email,
          subject: 'Your MotoYard Verification Code',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .otp-box { background: white; border: 2px solid #3b82f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>MotoYard Verification</h1>
                </div>
                <div class="content">
                  <p>Hi there,</p>
                  <p>Your verification code for MotoYard is:</p>
                  <div class="otp-box">${otpCode}</div>
                  <p><strong>This code expires in ${this.OTP_EXPIRY_MINUTES} minutes.</strong></p>
                  <p>If you didn't request this code, please ignore this email.</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} MotoYard. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      } catch (emailError: any) {
        console.error('❌ [Email OTP] Resend error:', emailError);
        return {
          success: false,
          message: 'Failed to send email. Please try again.',
          error: 'EMAIL_SEND_FAILED',
        };
      }

      // ✅ FIX 2: Handle both old and new Resend response formats
      const emailId = emailResult?.data?.id || emailResult?.id;
      
      console.log('📨 [Email OTP] Email sent!', { 
        emailId,
        fullResponse: JSON.stringify(emailResult) 
      });

      // ✅ FIX 3: Check if email actually sent
      if (!emailId) {
        console.error('❌ [Email OTP] No email ID returned:', emailResult);
        return {
          success: false,
          message: 'Email sent but unable to confirm delivery',
          error: 'NO_EMAIL_ID',
        };
      }

      // Store in database
      const otpRecord = await prisma.oTPVerification.create({
        data: {
          dealerId,
          phone,
          email,
          otpCode, // ⚠️ For debugging - remove in production
          otpHash,
          expiresAt,
          deliveryMethod: 'email',
          messageId: emailId, // ✅ Use extracted emailId
          deliveryStatus: 'sent',
          maxAttempts: this.MAX_ATTEMPTS,
          ipAddress,
          userAgent,
        },
      });

      console.log('✅ [Email OTP] Success!', { otpId: otpRecord.id, emailId });

      return {
        success: true,
        message: 'OTP sent to your email',
        otpId: otpRecord.id,
        expiresAt,
      };
    } catch (error: any) {
      console.error('💥 [Email OTP] Error:', error);
      return {
        success: false,
        message: 'Failed to send email OTP',
        error: 'INTERNAL_ERROR',
      };
    }
  }

  static async verifyOTP(params: {
    email: string;
    otpCode: string;
  }): Promise<VerifyOTPResult> {
    const { email, otpCode } = params;

    try {
      console.log('🔍 [Email OTP] Verifying...', { email });

      const otpRecord = await prisma.oTPVerification.findFirst({
        where: {
          email,
          verified: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRecord) {
        console.log('❌ [Email OTP] No valid OTP found');
        return {
          success: false,
          message: 'OTP expired or not found. Please request a new one.',
          error: 'OTP_NOT_FOUND',
        };
      }

      if (otpRecord.attempts >= otpRecord.maxAttempts) {
        console.log('❌ [Email OTP] Max attempts exceeded');
        return {
          success: false,
          message: 'Maximum verification attempts exceeded. Please request a new OTP.',
          error: 'MAX_ATTEMPTS_EXCEEDED',
        };
      }

      const isValid = await bcrypt.compare(otpCode, otpRecord.otpHash);

      await prisma.oTPVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });

      if (!isValid) {
        const remainingAttempts = otpRecord.maxAttempts - otpRecord.attempts - 1;
        console.log('❌ [Email OTP] Invalid code', { remainingAttempts });
        return {
          success: false,
          message: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
          error: 'INVALID_OTP',
        };
      }

      await prisma.oTPVerification.update({
        where: { id: otpRecord.id },
        data: {
          verified: true,
          verifiedAt: new Date(),
        },
      });

      console.log('✅ [Email OTP] Verification successful');

      if (otpRecord.dealerId) {
        await prisma.dealer.update({
          where: { id: otpRecord.dealerId },
          data: {
            emailVerified: new Date(),
            isVerified: true,
          },
        });
      }

      return {
        success: true,
        message: 'OTP verified successfully',
        dealerId: otpRecord.dealerId || undefined,
      };
    } catch (error) {
      console.error('💥 [Email OTP] Verify error:', error);
      return {
        success: false,
        message: 'An error occurred while verifying OTP',
        error: 'INTERNAL_ERROR',
      };
    }
  }
}
