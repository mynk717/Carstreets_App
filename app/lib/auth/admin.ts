// lib/auth/admin.ts
import { NextRequest } from 'next/server';

const ADMIN_TOKEN = 'admin-temp-key';

export async function verifyAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${ADMIN_TOKEN}`) {
    return { success: true, user: { role: 'admin' } };
  }
  return { success: false, error: 'Unauthorized' };
}
