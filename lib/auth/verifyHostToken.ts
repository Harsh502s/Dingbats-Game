import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { NextResponse } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
);

export interface HostTokenPayload extends JWTPayload {
  roomId: string;
  hostId: string;
}

export async function signHostToken(payload: HostTokenPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
  return token;
}

export async function verifyHostToken(token: string): Promise<HostTokenPayload> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as HostTokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired host token');
  }
}

export async function verifyHostRequest(
  req: Request,
  routeRoomId: string
): Promise<{ hostId: string } | NextResponse> {
  const token = req.headers.get('x-host-token');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await verifyHostToken(token);

    if (payload.roomId !== routeRoomId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return { hostId: payload.hostId };
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
