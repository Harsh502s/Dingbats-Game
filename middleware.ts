import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect /room/[roomId]/host routes
  const hostRouteMatch = pathname.match(/^\/room\/([a-f0-9-]+)\/host$/);

  if (hostRouteMatch) {
    const roomId = hostRouteMatch[1];
    const cookieName = `dingbats_host_token_${roomId}`;
    const token = request.cookies.get(cookieName)?.value;

    if (!token) {
      return NextResponse.redirect(new URL(`/room/${roomId}/join`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/room/:roomId/host']
};
