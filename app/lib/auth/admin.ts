// app/lib/auth/admin.ts (create this file)
import { NextRequest } from 'next/server'

export async function verifyAdminAuth(request: NextRequest) {
  // Simple auth for now - replace with proper auth later
  // const authHeader = request.headers.get('authorization')
  
  // if (authHeader === 'Bearer admin-temp-key') {
    return { success: true, user: { role: 'admin' } }
  }
  
//   return { success: false, error: 'Unauthorized' }
// }
