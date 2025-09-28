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

    const updatedContent = await prisma.contentCalendar.update({
      where: { id: contentId },
      data: {
        status: scheduledDate ? 'scheduled' : 'approved',
        approvedBy: authResult.user.id,
        approvedAt: new Date(),
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      },
    });

    return NextResponse.json({ success: true, content: updatedContent });
  } catch (error) {
    console.error('Error approving content:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
