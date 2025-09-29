// File: app/api/admin/content/approve/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/auth/admin';

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contentId, scheduledDate } = body;

    if (!contentId) {
      return NextResponse.json({ error: 'contentId is required' }, { status: 400 });
    }

    const content = await prisma.contentCalendar.findUnique({
      where: { id: contentId },
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
      where: { id: contentId },
      data: {
        status: status,
        approvedBy: authResult.user?.id || authResult.user?.email || 'admin',
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
