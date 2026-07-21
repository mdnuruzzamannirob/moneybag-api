import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/config/db.js';
import { readCookie } from '../helpers/auth.js';

describe('Admin Module Integration Tests', () => {
  let userToken: string;
  let adminToken: string;
  let targetUserId: string;

  beforeEach(async () => {
    // Register standard user
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Standard User',
        email: 'user@example.com',
        password: 'password123',
        currency: 'USD',
      })
      .expect(201);
    userToken = readCookie(userRes.headers['set-cookie'], 'accessToken')!;
    targetUserId = userRes.body.data.user.id;

    // Register admin user
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        currency: 'USD',
      })
      .expect(201);
    const adminId = adminRes.body.data.user.id;

    // Manually promote admin user in db
    await prisma.user.update({
      where: { id: adminId },
      data: { role: 'ADMIN' },
    });
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' })
      .expect(200);
    adminToken = readCookie(adminLogin.headers['set-cookie'], 'accessToken')!;
  });

  it('should deny access to standard users', async () => {
    await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('should allow admin to list users', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2); // standard user + admin
  });

  it('should allow admin to update user active status', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${targetUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.isActive).toBe(false);

    // Verify user is inactive in database
    const dbUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    expect(dbUser?.isActive).toBe(false);
  });

  it('should allow admin to view platform-wide stats', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.usersCount).toBe(2);
    expect(res.body.data.transactionsCount).toBeDefined();
    expect(res.body.data.totalVolume).toBeDefined();
  });
});
