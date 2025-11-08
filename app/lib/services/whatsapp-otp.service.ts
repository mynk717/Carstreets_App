import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// ============================================================================
// WhatsApp OTP Service (AUTH-001)
// ============================================================================

interface SendOTPResult {
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

export class WhatsAppOTPService {
  private static readonly API_BASE_URL = process.env.WHATSAPP_API_BASE_URL!;
  private static readonly PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  private static readonly ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;
  private static readonly TEMPLATE_NAME = process.env.WHATSAPP_OTP_TEMPLATE_NAME!;
  private static readonly OTP_LENGTH = parseInt(process.env.WHATSAPP_OTP_LENGTH || '6');
  private static readonly OTP_EXPIRY_MINUTES = parseInt(process.env.WHATSAPP_OTP_EXPIRY_MINUTES || '10');
  private static readonly MAX_ATTEMPTS = parseInt(process.env.WHATSAPP_OTP_MAX_ATTEMPTS || '5');

  /**
   * Generate a random 6-digit OTP
   */
  private static generateOTP(): string {
    const min = Math.pow(10, this.OTP_LENGTH - 1);
    const max = Math.pow(10, this.OTP_LENGTH) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  /**
   * Send OTP via WhatsApp Cloud API
   */
  static async sendOTP(params: {
    phone: string;
    email?: string;
    dealerId?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<SendOTPResult> {
    const { phone, email, dealerId, ipAddress, userAgent } = params;

    try {
      console.log('📱 [WhatsApp OTP] Starting send process...', { phone, email });

      // Rate limiting check
      const recentOTPs = await prisma.oTPVerification.count({
        where: {
          phone,
          createdAt: {
            gte: new Date(Date.now() - 10 * 60 * 1000),
          },
        },
      });

      console.log('⏱️ [WhatsApp OTP] Rate limit check:', { recentOTPs });

      if (recentOTPs >= 3) {
        console.log('⚠️ [WhatsApp OTP] Rate limit exceeded');
        return {
          success: false,
          message: 'Too many OTP requests. Please try again later.',
          error: 'RATE_LIMIT_EXCEEDED',
        };
      }

      // Generate OTP
      const otpCode = this.generateOTP();
      const otpHash = await bcrypt.hash(otpCode, 10);
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

      console.log('🔑 [WhatsApp OTP] Generated OTP:', { otpCode, expiresAt });
      console.log('🌐 [WhatsApp OTP] API Config:', {
        apiUrl: this.API_BASE_URL,
        phoneNumberId: this.PHONE_NUMBER_ID,
        templateName: this.TEMPLATE_NAME,
        accessTokenLength: this.ACCESS_TOKEN?.length,
      });

      // Prepare WhatsApp payload
      const whatsappPayload = {
        messaging_product: 'whatsapp',
        to: phone.replace(/^\+/, ''),
        type: 'template',
        template: {
          name: this.TEMPLATE_NAME,
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: otpCode }],
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [{ type: 'text', text: otpCode }],
            },
          ],
        },
      };

      console.log('📤 [WhatsApp OTP] Sending payload:', JSON.stringify(whatsappPayload, null, 2));

      // Send via WhatsApp Cloud API
      const whatsappResponse = await fetch(
        `${this.API_BASE_URL}/${this.PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(whatsappPayload),
        }
      );

      const whatsappData = await whatsappResponse.json();

      console.log('📥 [WhatsApp OTP] API Response:', {
        status: whatsappResponse.status,
        statusText: whatsappResponse.statusText,
        ok: whatsappResponse.ok,
        data: JSON.stringify(whatsappData, null, 2),
      });

      if (!whatsappResponse.ok || whatsappData.error) {
        console.error('❌ [WhatsApp OTP] API Error:', whatsappData.error);
        return {
          success: false,
          message: `WhatsApp API Error: ${whatsappData.error?.message || 'Unknown error'}`,
          error: 'WHATSAPP_API_ERROR',
        };
      }

      // Store OTP in database
      const otpRecord = await prisma.oTPVerification.create({
        data: {
          dealerId,
          phone,
          email,
          otpCode,
          otpHash,
          expiresAt,
          deliveryMethod: 'whatsapp',
          messageId: whatsappData.messages?.[0]?.id,
          deliveryStatus: 'sent',
          maxAttempts: this.MAX_ATTEMPTS,
          ipAddress,
          userAgent,
        },
      });

      console.log('✅ [WhatsApp OTP] Success!', {
        otpId: otpRecord.id,
        messageId: whatsappData.messages?.[0]?.id,
      });

      return {
        success: true,
        message: 'OTP sent successfully via WhatsApp',
        otpId: otpRecord.id,
        expiresAt,
      };
    } catch (error: any) {
      console.error('💥 [WhatsApp OTP] Critical error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      return {
        success: false,
        message: 'An error occurred while sending OTP',
        error: 'INTERNAL_ERROR',
      };
    }
  }


  /**
   * Verify OTP code
   */
  static async verifyOTP(params: {
    phone: string;
    otpCode: string;
  }): Promise<VerifyOTPResult> {
    const { phone, otpCode } = params;

    try {
      // Find the most recent unverified OTP for this phone
      const otpRecord = await prisma.oTPVerification.findFirst({
        where: {
          phone,
          verified: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRecord) {
        return {
          success: false,
          message: 'OTP expired or not found. Please request a new one.',
          error: 'OTP_NOT_FOUND',
        };
      }

      // Check max attempts
      if (otpRecord.attempts >= otpRecord.maxAttempts) {
        return {
          success: false,
          message: 'Maximum verification attempts exceeded. Please request a new OTP.',
          error: 'MAX_ATTEMPTS_EXCEEDED',
        };
      }

      // Verify OTP
      const isValid = await bcrypt.compare(otpCode, otpRecord.otpHash);

      // Increment attempts
      await prisma.oTPVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });

      if (!isValid) {
        const remainingAttempts = otpRecord.maxAttempts - otpRecord.attempts - 1;
        return {
          success: false,
          message: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
          error: 'INVALID_OTP',
        };
      }

      // Mark as verified
      await prisma.oTPVerification.update({
        where: { id: otpRecord.id },
        data: {
          verified: true,
          verifiedAt: new Date(),
        },
      });

      // If dealer exists, mark phone as verified
      if (otpRecord.dealerId) {
        await prisma.dealer.update({
          where: { id: otpRecord.dealerId },
          data: {
            phoneVerified: new Date(),
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
      console.error('Verify OTP Error:', error);
      return {
        success: false,
        message: 'An error occurred while verifying OTP',
        error: 'INTERNAL_ERROR',
      };
    }
  }
}
