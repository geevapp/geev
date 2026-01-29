import { NextRequest } from 'next/server';
import { mockEntries } from '@/lib/mock-data';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Filter entries by user ID
    const userEntries = mockEntries.filter((entry: any) => entry.userId === id);

    return apiSuccess(userEntries);

  } catch (error) {
    return apiError('Failed to fetch user entries', 500);
  }
}