import { apiSuccess } from '@/lib/api-response';
import { testConnection } from '@/lib/prisma';

export async function GET() {
  const isConnected = await testConnection();
  return apiSuccess({ 
    status: 'ok', 
    database: isConnected ? 'connected' : 'disconnected' 
  });
}
