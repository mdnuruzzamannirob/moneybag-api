import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/config/db.js';

describe('Auth Module Integration Tests', () => {
  const testUser = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    currency: 'USD',
  };

  it('should successfully register a user and seed default categories', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();

    // Verify categories are seeded
    const categories = await prisma.category.findMany({
      where: { userId: res.body.data.user.id },
    });
    expect(categories.length).toBeGreaterThan(0);
    expect(categories.some((c) => c.name === 'Salary')).toBe(true);
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

  it('should successfully login and issue tokens', async () => {
    // Register first
    await request(app).post('/api/auth/register').send(testUser).expect(201);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    await request(app).post('/api/auth/register').send(testUser).expect(201);

    await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword',
      })
      .expect(401);
  });

  it('should refresh access token using valid refresh token', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    const refreshToken = registerRes.body.data.refreshToken;

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('should fail refresh with a revoked/invalid token', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    const refreshToken = registerRes.body.data.refreshToken;

    // Logout to revoke it
    await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken })
      .expect(200);

    // Try refreshing
    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(401);
  });

  it('should allow requesting a password reset and resetting the password', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    // Request forgot password
    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email })
      .expect(200);

    // Get the reset token from database since mail was mocked
    const resetTokenRecord = await prisma.passwordResetToken.findFirst({
      where: { userId: regRes.body.data.user.id },
    });
    expect(resetTokenRecord).toBeDefined();
    const token = resetTokenRecord!.token;

    // Reset password
    const newPassword = 'newPassword123';
    await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: newPassword })
      .expect(200);

    // Try logging in with new password
    await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: newPassword })
      .expect(200);
  });
});
