import { beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/config/db.js';

describe('Budget Module Integration Tests', () => {
  const testUser = {
    name: 'Charlie',
    email: 'charlie@example.com',
    password: 'password123',
    currency: 'USD',
  };

  let token: string;
  let userId: string;
  let categoryIdFood: string;

  beforeEach(async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);
    token = regRes.body.data.accessToken;
    userId = regRes.body.data.user.id;

    const categories = await prisma.category.findMany({
      where: { userId },
    });
    categoryIdFood = categories.find((c) => c.type === 'EXPENSE')!.id;
  });

  it('should successfully create a budget', async () => {
    const now = new Date();
    const budgetData = {
      limit: 500,
      alertThreshold: 90,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      categoryId: categoryIdFood,
    };

    const res = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send(budgetData)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.limit).toBe(500);
    expect(res.body.data.alertThreshold).toBe(90);
    expect(res.body.data.categoryId).toBe(categoryIdFood);
  });

  it('should list budgets with filters', async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        limit: 500,
        alertThreshold: 90,
        month,
        year,
        categoryId: categoryIdFood,
      })
      .expect(201);

    const res = await request(app)
      .get(`/api/budgets?month=${month}&year=${year}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].limit).toBe(500);
  });

  it('should trigger alert when threshold is crossed', async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Create budget: limit 100, threshold 80% (i.e. >= 80 spent)
    await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        limit: 100,
        alertThreshold: 80,
        month,
        year,
        categoryId: categoryIdFood,
      })
      .expect(201);

    // Get current alerts (should be empty)
    const emptyAlertsRes = await request(app)
      .get('/api/budgets/alerts')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(emptyAlertsRes.body.data).toHaveLength(0);

    // Spend 85 (threshold crossed)
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 85,
        type: 'EXPENSE',
        categoryId: categoryIdFood,
        date: now.toISOString(),
      })
      .expect(201);

    // Check alerts again
    const alertsRes = await request(app)
      .get('/api/budgets/alerts')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(alertsRes.body.success).toBe(true);
    expect(alertsRes.body.data).toHaveLength(1);
    expect(alertsRes.body.data[0].thresholdCrossed).toBe(true);
    expect(alertsRes.body.data[0].overBudget).toBe(false);
  });

  it('should update a budget', async () => {
    const now = new Date();
    const createRes = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        limit: 100,
        alertThreshold: 80,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        categoryId: categoryIdFood,
      })
      .expect(201);

    const budgetId = createRes.body.data.id;

    const res = await request(app)
      .patch(`/api/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ limit: 150 })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.limit).toBe(150);
  });
});
