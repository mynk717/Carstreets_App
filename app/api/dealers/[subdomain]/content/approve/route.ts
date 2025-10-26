// File: app/api/dealers/[subdomain]/content/approve/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
// Make sure this import reflects your actual path and that `authOptions` is exported
import { authOptions } from "@/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // No need to pass request to getServerSession for most Next.js setups in handlers
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get subdomain from the URL path (customize/optimize per your real routing)
    const pathParts = request.nextUrl.pathname.split("/");
    const subdomain = pathParts[pathParts.indexOf("dealers") + 1];

    // Fix: Only use fields that actually exist in your Prisma Dealer model!
    const dealer = await prisma.dealer.findFirst({
      where: { subdomain }
    });
    if (!dealer) {
      return NextResponse.json({ error: "Forbidden: Not your dealer" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { contentId, scheduledDate } = body;

    if (!contentId) {
      return NextResponse.json({ error: 'contentId is required' }, { status: 400 });
    }

    const content = await prisma.contentCalendar.findUnique({
      where: { dealerId: dealer.id, id: contentId },
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Handle scheduling status
    let status = 'approved';
    let finalScheduledDate: Date | null = null;

    if (scheduledDate) {
      const scheduleDateTime = new Date(scheduledDate);
      const now = new Date();
      if (scheduleDateTime <= new Date(now.getTime() + 60000)) {
        status = 'scheduled';
        finalScheduledDate = new Date();
      } else {
        status = 'scheduled';
        finalScheduledDate = scheduleDateTime;
      }
    }

    const updatedContent = await prisma.contentCalendar.update({
      where: { dealerId: dealer.id, id: contentId },
      data: {
        dealerId: dealer.id,
        status,
        approvedAt: new Date(),
        scheduledDate: finalScheduledDate,
      },
    });

    return NextResponse.json({
      success: true,
      content: updatedContent,
      message:
        status === 'scheduled' && finalScheduledDate && finalScheduledDate <= new Date()
          ? 'Content will be posted immediately'
          : status === 'scheduled'
          ? 'Content scheduled successfully'
          : 'Content approved',
    });
  } catch (error) {
    console.error('Error approving content:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
