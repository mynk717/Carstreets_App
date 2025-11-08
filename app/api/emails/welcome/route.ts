import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, name, subdomain } = await req.json();

    // FIXED: Correct URL patterns
    const storefrontUrl = `https://${subdomain}.motoyard.mktgdime.com`;
    const dashboardUrl = `https://motoyard.mktgdime.com/dealers/${subdomain}/dashboard`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: 'Welcome to MotoYard!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .button { display: inline-block; background: #3b82f6; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .info-box { background: white; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 32px;">
                <svg style="display: inline-block; width: 32px; height: 32px; vertical-align: middle; margin-right: 8px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Welcome to MotoYard!
              </h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your dealership is ready to go</p>
            </div>
            <div class="content">
              <p>Hi <strong>${name}</strong>,</p>
              <p>Congratulations! Your MotoYard dealership account has been successfully created.</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0;">Your Dealership URLs:</h3>
                <p><strong>Admin Dashboard:</strong><br/>
                <a href="${dashboardUrl}" style="color: #3b82f6; word-break: break-all;">${dashboardUrl}</a></p>
                <p><strong>Public Storefront:</strong><br/>
                <a href="${storefrontUrl}" style="color: #3b82f6; word-break: break-all;">${storefrontUrl}</a></p>
              </div>

              <h3>Quick Start Guide:</h3>
              <ol>
                <li><strong>Access Your Dashboard:</strong> Use the dashboard link above to manage your inventory</li>
                <li><strong>Add Your First Car:</strong> Start listing your inventory</li>
                <li><strong>Customize Your Storefront:</strong> Add your logo, description, and contact info</li>
                <li><strong>Share Your Link:</strong> Start promoting your online dealership</li>
              </ol>

              <div style="text-align: center;">
                <a href="${dashboardUrl}" class="button">Access Dashboard</a>
              </div>

              <p>If you have any questions, feel free to reach out to our support team.</p>
              
              <p>Best regards,<br><strong>The MotoYard Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} MotoYard. All rights reserved.</p>
              <p>Need help? <a href="mailto:support@mktgdime.com" style="color: #3b82f6;">Contact Support</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Welcome email error:', error);
    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    );
  }
}
