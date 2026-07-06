import { beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/config/db.js';

describe('Savings Goal Module Integration Tests', () => {
  const testUser = {
    name: 'David',
    email: 'david@example.com',
    password: 'password123',
    currency: 'USD',
  };

  let token: string;

  beforeEach(async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);
    token = regRes.body.data.accessToken;
  });

  it('should successfully create a savings goal', async () => {
    const goalData = {
      title: 'New Car',
      targetAmount: 5000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const res = await request(app)
      .post('/api/savings-goals')
      .set('Authorization', `Bearer ${token}`)
      .send(goalData)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('New Car');
    expect(res.body.data.targetAmount).toBe(5000);
    expect(res.body.data.currentAmount).toBe(0);
  });

  it('should list savings goals', async () => {
    await request(app)
      .post('/api/savings-goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'New Car',
        targetAmount: 5000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    const res = await request(app)
      .get('/api/savings-goals?page=1&limit=20')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('New Car');
  });

  it('should contribute toward a savings goal', async () => {
    const createRes = await request(app)
      .post('/api/savings-goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Vacation Fund',
        targetAmount: 1000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    const goalId = createRes.body.data.id;

    const res = await request(app)
      .patch(`/api/savings-goals/${goalId}/contribute`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 250 })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.currentAmount).toBe(250);

    // Verify database update
    const dbGoal = await prisma.savingsGoal.findUnique({
      where: { id: goalId },
    });
    expect(dbGoal?.currentAmount).toBe(250);
  });

  it('should delete a savings goal', async () => {
    const createRes = await request(app)
      .post('/api/savings-goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Short Term Goal',
        targetAmount: 100,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    const goalId = createRes.body.data.id;

    await request(app)
      .delete(`/api/savings-goals/${goalId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const dbGoal = await prisma.savingsGoal.findUnique({
      where: { id: goalId },
    });
    expect(dbGoal).toBeNull();
  });
});
