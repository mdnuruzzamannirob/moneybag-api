import { describe, it, expect } from 'vitest';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  type JwtPayload,
} from '../../src/utils/jwt.js';

describe('JWT Utility', () => {
  const payload: JwtPayload = {
    sub: 'user-id-123',
    email: 'test@example.com',
    role: 'USER',
  };

  it('should sign and verify access token', () => {
    const token = signAccessToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = verifyAccessToken(token);
    expect(decoded).toMatchObject(payload);
  });

  it('should sign and verify refresh token', () => {
    const token = signRefreshToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = verifyRefreshToken(token);
    expect(decoded).toMatchObject(payload);
  });

  it('should throw an error for invalid token verification', () => {
    expect(() => verifyAccessToken('invalid-token')).toThrow();
    expect(() => verifyRefreshToken('invalid-token')).toThrow();
  });
});
