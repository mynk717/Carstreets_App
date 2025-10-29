import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';

export async function POST(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subdomain } = params;
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: { id: true, email: true },
    });

    if (!dealer || session.user.email !== dealer.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse CSV
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    // Skip header row
    const dataLines = lines.slice(1);
    
    const contacts = [];
    const errors = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const [name, phone, tags] = line.split(',').map(s => s.trim());

      // Validate phone number
      if (!phone || !phone.match(/^\+?[1-9]\d{9,14}$/)) {
        errors.push({ line: i + 2, error: 'Invalid phone', data: line });
        continue;
      }

      contacts.push({
        dealerId: dealer.id,
        name: name || 'Unknown',
        phoneNumber: phone.startsWith('+') ? phone : `+91${phone}`,
        tags: tags ? tags.split(';').map(t => t.trim()) : [],
        optedIn: true,
        source: 'csv_import',
      });
    }

    // Bulk create
    const created = await prisma.whatsAppContact.createMany({
      data: contacts,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      imported: created.count,
      errors: errors.length > 0 ? errors : undefined,
      totalProcessed: dataLines.length,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
