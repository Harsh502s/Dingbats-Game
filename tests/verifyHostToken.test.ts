import { describe, it, expect, beforeAll } from 'vitest';
import { SignJWT, jwtVerify } from 'jose';

describe('Host Token JWT', () => {
  const JWT_SECRET = new TextEncoder().encode('test-secret-key');

  async function signToken(payload: { roomId: string; hostId: string }): Promise<string> {
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(JWT_SECRET);
  }

  async function verifyToken(token: string) {
    return jwtVerify(token, JWT_SECRET);
  }

  it('should sign and verify a valid token', async () => {
    const payload = { roomId: 'room-123', hostId: 'host-456' };
    const token = await signToken(payload);
    const verified = await verifyToken(token);

    expect(verified.payload.roomId).toBe('room-123');
    expect(verified.payload.hostId).toBe('host-456');
  });

  it('should reject an invalid token', async () => {
    const invalidToken = 'invalid.token.here';
    await expect(verifyToken(invalidToken)).rejects.toThrow();
  });

  it('should reject a token signed with wrong secret', async () => {
    const payload = { roomId: 'room-123', hostId: 'host-456' };
    const token = await signToken(payload);

    const wrongSecret = new TextEncoder().encode('wrong-secret');
    await expect(jwtVerify(token, wrongSecret)).rejects.toThrow();
  });

  it('should include correct payload in token', async () => {
    const payload = { roomId: 'abc-def-ghi', hostId: 'xyz-123' };
    const token = await signToken(payload);
    const verified = await verifyToken(token);

    expect(verified.payload).toMatchObject(payload);
  });
});
