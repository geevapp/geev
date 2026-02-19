import { NextRequest } from 'next/server';

export function createMockRequest(
  url: string,
  options?: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  },
): NextRequest {
  const { method = 'GET', body, headers = {}, cookies = {} } = options || {};

  const request = new NextRequest(url, {
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (cookies) {
    Object.entries(cookies).forEach(([key, value]) => {
      request.cookies.set(key, value);
    });
  }

  return request;
}

export async function parseResponse(response: Response) {
  const data = await response.json();
  return {
    status: response.status,
    data,
  };
}
