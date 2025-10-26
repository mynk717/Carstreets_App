// File: app/api/admin/content/approve/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/[...nextauth]";

import {prisma} from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/[...nextauth]";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/[...nextauth]";


export async function POST(request: NextRequest) {
const session = await getServerSession(authOptions, request);
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
const dealer = await prisma.dealer.findFirst({
  where: { dealerId: dealer.id,  subdomain: params.subdomain, userId: session.user.id }
});
if (!dealer) {
  return NextResponse.json({ error: "Forbidden: Not your dealer" }, { status: 403 });
}

  try {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contentId, scheduledDate } = body;

    if (!contentId) {
      return NextResponse.json({ error: 'contentId is required' }, { status: 400 });
    }

    const content = await prisma.contentCalendar.findUnique({
      where: { dealerId: dealer.id,  id: contentId },
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // ✅ FIXED: Handle "Post Now" vs "Schedule Later"
    let status = 'approved';
    let finalScheduledDate = null;

    if (scheduledDate) {
      const scheduleDateTime = new Date(scheduledDate);
      const now = new Date();
      
      // If scheduled for within 1 minute, treat as "Post Now"
      if (scheduleDateTime <= new Date(now.getTime() + 60000)) {
        status = 'scheduled';
        finalScheduledDate = new Date(); // Schedule immediately
      } else {
        status = 'scheduled';
        finalScheduledDate = scheduleDateTime;
      }
    }

    const updatedContent = await prisma.contentCalendar.update({
      where: { dealerId: dealer.id,  id: contentId },
      data: { dealerId: dealer.id, 
        status: status,
        approvedAt: new Date(),
        scheduledDate: finalScheduledDate,
      },
    });

    return NextResponse.json({ 
      success: true, 
      content: updatedContent,
      message: status === 'scheduled' && finalScheduledDate <= new Date() ? 
               'Content will be posted immediately' : 
               status === 'scheduled' ? 
               'Content scheduled successfully' : 
               'Content approved'
    });
  } catch (error) {
    console.error('Error approving content:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
