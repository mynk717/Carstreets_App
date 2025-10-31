// app/api/dealers/[subdomain]/whatsapp/templates/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params;

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

    // Fetch templates from Meta
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${dealer.whatsappBusinessAccountId}/message_templates`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch templates from Meta");
    }

    const data = await response.json();
    const metaTemplates = data.data || [];

    // Sync to database
    let synced = 0;
    for (const metaTemplate of metaTemplates) {
      await prisma.whatsAppTemplate.upsert({
        where: {
          dealerId_name: {
            dealerId: dealer.id,
            name: metaTemplate.name,
          },
        },
        update: {
          status: metaTemplate.status,
          metaTemplateId: metaTemplate.id,
          language: metaTemplate.language,
          category: metaTemplate.category,
          bodyText: metaTemplate.components?.find((c: any) => c.type === "BODY")?.text || "",
          footerText:
            metaTemplate.components?.find((c: any) => c.type === "FOOTER")?.text || null,
        },
        create: {
          dealerId: dealer.id,
          name: metaTemplate.name,
          status: metaTemplate.status,
          metaTemplateId: metaTemplate.id,
          language: metaTemplate.language,
          category: metaTemplate.category,
          bodyText: metaTemplate.components?.find((c: any) => c.type === "BODY")?.text || "",
          footerText:
            metaTemplate.components?.find((c: any) => c.type === "FOOTER")?.text || null,
        },
      });
      synced++;
    }

    return NextResponse.json({ success: true, synced });
  } catch (error: any) {
    console.error("Template sync error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
