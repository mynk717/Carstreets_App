'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Server Action to update dealer settings
export async function updateDealerSettings(dealerId: string, settings: Record<string, any>) {
  try {
    await prisma.dealer.update({
      where: { id: dealerId },
      data: settings,
    });
    // Revalidate paths that depend on this data
    revalidatePath('/dealers/[subdomain]/dashboard/settings', 'page');
    return { success: true };
  } catch (error) {
    console.error('Failed to update dealer settings:', error);
    return { success: false, error: 'Could not save settings.' };
  }
}
