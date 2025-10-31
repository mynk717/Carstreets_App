// app/api/dealers/[subdomain]/whatsapp/templates/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params;
    const body = await req.json();
    const { name, language, category, bodyText, footerText } = body;

    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: {
        id: true,
        whatsappBusinessAccountId: true,
      },
    });

    if (!dealer?.whatsappBusinessAccountId) {
      return NextResponse.json(
        { success: false, error: "WhatsApp not connected" },
        { status: 400 }
      );
    }

    const token = process.env.MOTOYARD_WHATSAPP_PLATFORM_TOKEN;

    // Submit template to Meta for approval
    const components = [
      {
        type: "BODY",
        text: bodyText,
      },
    ];

    if (footerText) {
      components.push({
        type: "FOOTER",
        text: footerText,
      });
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${dealer.whatsappBusinessAccountId}/message_templates`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          language,
          category,
          components,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to create template");
    }

    const metaTemplate = await response.json();

    // Save to database
    await prisma.whatsAppTemplate.create({
      data: {
        dealerId: dealer.id,
        name,
        language,
        category,
        status: "PENDING",
        bodyText,
        footerText,
        metaTemplateId: metaTemplate.id,
      },
    });

    return NextResponse.json({ success: true, templateId: metaTemplate.id });
  } catch (error: any) {
    console.error("Template creation error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
