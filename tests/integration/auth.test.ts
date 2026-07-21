import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/config/db.js';
import { readCookie } from '../helpers/auth.js';

const testUser = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  currency: 'USD',
};

const register = (email = testUser.email) =>
  request(app).post('/api/auth/register').send({ ...testUser, email });

describe('Auth Module Integration Tests', () => {
  it('registers with a 14-day Pro trial and secure auth cookies', async () => {
    const response = await register().expect(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(testUser.email);
    expect(response.body.data.accessToken).toBeUndefined();
    expect(response.body.data.refreshToken).toBeUndefined();
    expect(readCookie(response.headers['set-cookie'], 'accessToken')).toBeTruthy();
    expect(readCookie(response.headers['set-cookie'], 'refreshToken')).toBeTruthy();
    expect(readCookie(response.headers['set-cookie'], 'XSRF-TOKEN')).toBeTruthy();

    const user = await prisma.user.findUnique({
      where: { email: testUser.email },
      include: { subscription: { include: { plan: true } } },
    });
    expect(user?.subscription?.status).toBe('TRIALING');
    expect(user?.subscription?.plan.slug).toBe('pro-monthly');
    expect(user!.trialEndsAt!.getTime()).toBeGreaterThan(Date.now() + 13 * 86400000);
    expect(
      await prisma.category.count({ where: { userId: null } }),
    ).toBeGreaterThan(0);
  });

  it('rejects duplicate registration and bad credentials', async () => {
    await register().expect(201);
    await register().expect(409);
    await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'not-the-password' })
      .expect(401);
  });

  it('logs in and exposes the current user through the access cookie', async () => {
    await register().expect(201);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);
    const cookies = login.headers['set-cookie'] as string[];
    const me = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookies)
      .expect(200);
    expect(me.body.data.email).toBe(testUser.email);
  });

  it('rotates each refresh token once and rejects replay', async () => {
    const registered = await register().expect(201);
    const rawRefresh = readCookie(registered.headers['set-cookie'], 'refreshToken')!;
    const hash = crypto.createHash('sha256').update(rawRefresh).digest('hex');

    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: rawRefresh })
      .expect(200);
    expect(
      (await prisma.refreshToken.findUnique({ where: { token: hash } }))?.revoked,
    ).toBe(true);
    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: rawRefresh })
      .expect(401);
  });

  it('allows exactly one concurrent refresh attempt', async () => {
    const registered = await register().expect(201);
    const rawRefresh = readCookie(registered.headers['set-cookie'], 'refreshToken')!;
    const responses = await Promise.all([
      request(app).post('/api/auth/refresh').send({ refreshToken: rawRefresh }),
      request(app).post('/api/auth/refresh').send({ refreshToken: rawRefresh }),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 401]);
  });

  it('resets a password with a hashed, single-use reset token', async () => {
    const registered = await register('reset@example.com').expect(201);
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await prisma.passwordResetToken.create({
      data: {
        userId: registered.body.data.user.id,
        token: hash,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawToken, password: 'newPassword123' })
      .expect(200);
    await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawToken, password: 'anotherPassword123' })
      .expect(400);
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset@example.com', password: 'newPassword123' })
      .expect(200);
  });
});
