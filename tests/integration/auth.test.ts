import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/config/db.js';

const testUser = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  currency: 'USD',
};

// Helper: pull a named cookie out of a Set-Cookie header. supertest
// returns the raw header which may contain several `name=value;` pairs.
function readCookie(
  setCookieHeader: string | string[] | undefined,
  name: string,
) {
  if (!setCookieHeader) return null;
  const list = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];
  for (const entry of list) {
    const [pair] = entry.split(';');
    const [key, value] = pair.split('=');
    if (key === name) return value;
  }
  return null;
}

describe('Auth Module Integration Tests', () => {
  it('should successfully register a user and set HttpOnly auth cookies', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email);
    // Tokens must NOT be in the body anymore.
    expect(res.body.data.accessToken).toBeUndefined();
    expect(res.body.data.refreshToken).toBeUndefined();

    // Tokens must be in HttpOnly cookies.
    const access = readCookie(res.headers['set-cookie'], 'accessToken');
    const refresh = readCookie(res.headers['set-cookie'], 'refreshToken');
    expect(access).toBeTruthy();
    expect(refresh).toBeTruthy();

    // Verify categories are seeded
    const categories = await prisma.category.findMany({
      where: { userId: res.body.data.user.id },
    });
    expect(categories.length).toBeGreaterThan(0);
    expect(categories.some((c) => c.name === 'Salary')).toBe(true);
  });

  it('should set an XSRF-TOKEN cookie on auth responses', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    const csrf = readCookie(res.headers['set-cookie'], 'XSRF-TOKEN');
    expect(csrf).toBeTruthy();
  });

  it('should not allow registering with an existing email', async () => {
    await request(app).post('/api/auth/register').send(testUser).expect(201);

    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Email is already registered');
  });

  it('should successfully login and set HttpOnly auth cookies', async () => {
    await request(app).post('/api/auth/register').send(testUser).expect(201);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.accessToken).toBeUndefined();
    expect(res.body.data.refreshToken).toBeUndefined();

    const access = readCookie(res.headers['set-cookie'], 'accessToken');
    const refresh = readCookie(res.headers['set-cookie'], 'refreshToken');
    expect(access).toBeTruthy();
    expect(refresh).toBeTruthy();
  });

  it('should reject login with wrong password', async () => {
    await request(app).post('/api/auth/register').send(testUser).expect(201);

    await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' })
      .expect(401);
  });

  it('should refresh using body refresh token (back-compat) and rotate tokens', async () => {
    await request(app).post('/api/auth/register').send(testUser).expect(201);
    const dbTokens = await prisma.refreshToken.findMany();
    const refreshToken = dbTokens[0]!.token;

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeUndefined();
    expect(res.body.data.refreshToken).toBeUndefined();

    // Old refresh token should be revoked.
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    expect(stored?.revoked).toBe(true);

    // New cookies should be set.
    const newAccess = readCookie(res.headers['set-cookie'], 'accessToken');
    const newRefresh = readCookie(res.headers['set-cookie'], 'refreshToken');
    expect(newAccess).toBeTruthy();
    expect(newRefresh).toBeTruthy();
  });

  it('should refresh using cookie refresh token', async () => {
    // Register and capture cookies.
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ ...testUser, email: 'cookie-refresh@example.com' })
      .expect(201);

    const cookieHeader = regRes.headers['set-cookie'] as string | string[];

    // Send the refresh request with just the cookie.
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookieHeader as string[])
      .expect(200);

    expect(res.body.success).toBe(true);
    const newAccess = readCookie(res.headers['set-cookie'], 'accessToken');
    expect(newAccess).toBeTruthy();
  });

  it('should reject refresh with no token (cookie or body) and clear stale cookies', async () => {
    const res = await request(app).post('/api/auth/refresh').expect(401);

    expect(res.body.success).toBe(false);
    // No new cookies should be set in response, but the server should
    // have attempted to clear the previous ones if they were sent.
    const access = readCookie(res.headers['set-cookie'], 'accessToken');
    expect(access).toBeFalsy();
  });

  it('should fail refresh with a revoked token and revoke all user refresh tokens', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ ...testUser, email: 'revoke-all@example.com' })
      .expect(201);

    const dbTokens = await prisma.refreshToken.findMany();
    const refreshToken = dbTokens[0]!.token;

    // Logout to revoke it.
    await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken })
      .expect(200);

    // Try refreshing.
    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(401);

    // All tokens for this user should be revoked.
    const remaining = await prisma.refreshToken.findMany({
      where: { revoked: false },
    });
    expect(remaining.length).toBe(0);
  });

  it('should expose /auth/me with a valid access cookie', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ ...testUser, email: 'me-test@example.com' })
      .expect(201);

    const cookies = regRes.headers['set-cookie'] as string | string[];

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookies as string[])
      .expect(200);

    expect(res.body.data.user.email).toBe('me-test@example.com');
  });

  it('should reject /auth/me without a cookie', async () => {
    await request(app).get('/api/auth/me').expect(401);
  });

  it('should clear auth cookies on logout', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ ...testUser, email: 'logout-test@example.com' })
      .expect(201);

    const cookies = regRes.headers['set-cookie'] as string | string[];

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookies as string[])
      .expect(200);

    // The set-cookie should include a cookie that expires immediately.
    const setCookie = logoutRes.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    // Verify one of the cookies is being cleared (Max-Age=0 or Expires in the past).
    const list = Array.isArray(setCookie) ? setCookie : [setCookie!];
    const clearedAny = list.some((entry) =>
      /Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(entry),
    );
    expect(clearedAny).toBe(true);
  });

  it('should allow requesting a password reset and resetting the password', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ ...testUser, email: 'reset-test@example.com' })
      .expect(201);

    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reset-test@example.com' })
      .expect(200);

    const resetTokenRecord = await prisma.passwordResetToken.findFirst({
      where: { userId: regRes.body.data.user.id },
    });
    expect(resetTokenRecord).toBeDefined();
    const token = resetTokenRecord!.token;

    const newPassword = 'newPassword123';
    await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: newPassword })
      .expect(200);

    await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset-test@example.com', password: newPassword })
      .expect(200);

    // After a password reset, all existing refresh tokens for the user
    // should be revoked.
    const stored = await prisma.refreshToken.findMany({
      where: { revoked: false },
    });
    expect(stored.length).toBe(0);
  });
});
