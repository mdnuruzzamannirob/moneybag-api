import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/config/db.js';
import { readCookie } from '../helpers/auth.js';

type CategoryBreakdownItem = {
  categoryId: string;
  amount: number;
};

describe('Report Module Integration Tests', () => {
  const testUser = {
    name: 'Emma',
    email: 'emma@example.com',
    password: 'password123',
    currency: 'USD',
  };

  let token: string;
  let userId: string;
  let categoryIdSalary: string;
  let categoryIdFood: string;

  beforeEach(async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);
    token = readCookie(regRes.headers['set-cookie'], 'accessToken')!;
    userId = regRes.body.data.user.id;

    const categories = await prisma.category.findMany({
      where: { OR: [{ userId }, { userId: null }] },
    });
    categoryIdSalary = categories.find((c) => c.type === 'INCOME')!.id;
    categoryIdFood = categories.find((c) => c.type === 'EXPENSE')!.id;

    // Create some transactions
    const now = new Date();
    await prisma.transaction.createMany({
      data: [
        {
          amount: 3000,
          type: 'INCOME',
          categoryId: categoryIdSalary,
          date: now,
          userId,
        },
        {
          amount: 200,
          type: 'EXPENSE',
          categoryId: categoryIdFood,
          date: now,
          userId,
        },
      ],
    });
  });

  it('should get monthly summary report', async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const res = await request(app)
      .get(`/api/reports/monthly?month=${month}&year=${year}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.totalIncome).toBe(3000);
    expect(res.body.data.totalExpense).toBe(200);
    expect(res.body.data.netSavings).toBe(2800);
  });

  it('should get yearly summary report', async () => {
    const now = new Date();
    const year = now.getFullYear();

    const res = await request(app)
      .get(`/api/reports/yearly?year=${year}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.totalIncome).toBe(3000);
    expect(res.body.data.totalExpense).toBe(200);
  });

  it('should get category breakdown report', async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const res = await request(app)
      .get(`/api/reports/category-breakdown?month=${month}&year=${year}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    const breakdown = res.body.data as CategoryBreakdownItem[];
    expect(
      breakdown.some(
        (item) => item.categoryId === categoryIdFood && item.amount === 200,
      ),
    ).toBe(true);
  });

  it('should get trends report', async () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const res = await request(app)
      .get(`/api/reports/trend?from=${now.toISOString()}&to=${tomorrow.toISOString()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('should export report as CSV', async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const res = await request(app)
      .get(`/api/reports/export?type=csv&month=${month}&year=${year}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.text).toContain('totalIncome');
    expect(res.text).toContain('totalExpense');
  });

  it('should export report as PDF', async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const res = await request(app)
      .get(`/api/reports/export?type=pdf&month=${month}&year=${year}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment');
  });
});
