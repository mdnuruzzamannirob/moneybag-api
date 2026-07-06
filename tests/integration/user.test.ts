import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/config/db.js';

describe('User Module Integration Tests', () => {
  const testUser = {
    name: 'Frank',
    email: 'frank@example.com',
    password: 'password123',
    currency: 'USD',
  };

  let token: string;
  let userId: string;

  beforeEach(async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);
    token = regRes.body.data.accessToken;
    userId = regRes.body.data.user.id;
  });

  it('should get current user profile', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email);
    expect(res.body.data.name).toBe(testUser.name);
  });

  it('should update user profile', async () => {
    const updateData = {
      name: 'Frank Updated',
      currency: 'EUR',
    };

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Frank Updated');
    expect(res.body.data.currency).toBe('EUR');

    // Verify in db
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(dbUser?.name).toBe('Frank Updated');
    expect(dbUser?.currency).toBe('EUR');
  });

  it('should successfully change user password', async () => {
    await request(app)
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: testUser.password,
        newPassword: 'newPassword12345',
      })
      .expect(200);

    // Verify login with new password works
    await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'newPassword12345',
      })
      .expect(200);
  });

  it('should fail password change with incorrect current password', async () => {
    await request(app)
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'wrongpassword',
        newPassword: 'newPassword12345',
      })
      .expect(401);
  });
});
