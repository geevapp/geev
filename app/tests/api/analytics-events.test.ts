import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/analytics/events/route';
import { createMockRequest, parseResponse } from '../helpers/api';

const mockAuth = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    analyticsEvent: {
      create: mockCreate,
    },
  },
}));

describe('POST /api/analytics/events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({ id: 'evt_1' });
  });

  it('stores userId as null when unauthenticated even if x-user-id is spoofed', async () => {
    mockAuth.mockResolvedValue(null);

    const req = createMockRequest('http://localhost:3000/api/analytics/events', {
      method: 'POST',
      body: { eventType: 'page_view', pageUrl: '/' },
      headers: { 'x-user-id': 'victim-user-id' },
    });

    const res = await POST(req);
    const { data } = await parseResponse(res);

    expect(data.success).toBe(true);
    expect(data.data?.tracked).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: null }),
      }),
    );
  });

  it('attributes events to the authenticated session user, not x-user-id', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'real-user' } });

    const req = createMockRequest('http://localhost:3000/api/analytics/events', {
      method: 'POST',
      body: { eventType: 'page_view', pageUrl: '/feed' },
      headers: { 'x-user-id': 'someone-else' },
    });

    const res = await POST(req);
    const { data } = await parseResponse(res);

    expect(data.success).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'real-user' }),
      }),
    );
  });
});
