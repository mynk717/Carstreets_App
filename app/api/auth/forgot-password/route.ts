import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find dealer by email
    const dealer = await prisma.dealer.findUnique({
      where: { email },
    });

    // Always return success (security best practice - don't reveal if email exists)
    if (!dealer) {
      return NextResponse.json({
        success: true,
        message: 'If your email exists, you will receive a reset link.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Store token in database
    await prisma.dealer.update({
      where: { id: dealer.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetTokenExpiry,
      },
    });

    // Create reset link
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`;

    // Send email
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: 'Reset Your MotoYard Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .button { display: inline-block; background: #3b82f6; color: white !important; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Reset Your Password</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${dealer.name}</strong>,</p>
              <p>You requested to reset your password for your MotoYard account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p><strong>This link expires in 1 hour.</strong></p>
              <p>If you didn't request this, please ignore this email.</p>
              <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
                Or copy this link: <br/>
                <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} MotoYard. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'If your email exists, you will receive a reset link.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
