import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/config/db.js';

describe('Transaction Module Integration Tests', () => {
  const testUser = {
    name: 'Bob',
    email: 'bob@example.com',
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
    token = regRes.body.data.accessToken;
    userId = regRes.body.data.user.id;

    // Get seeded categories
    const categories = await prisma.category.findMany({
      where: { userId },
    });
    categoryIdSalary = categories.find((c) => c.type === 'INCOME')!.id;
    categoryIdFood = categories.find((c) => c.type === 'EXPENSE')!.id;
  });

  it('should successfully create an income transaction', async () => {
    const txn = {
      amount: 1500,
      type: 'INCOME',
      categoryId: categoryIdSalary,
      note: 'Monthly Salary',
      date: new Date().toISOString(),
      tags: ['salary', 'job'],
    };

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(txn)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(1500);
    expect(res.body.data.type).toBe('INCOME');
    expect(res.body.data.userId).toBe(userId);
  });

  it('should not allow creating an expense transaction in an income category', async () => {
    const txn = {
      amount: 150,
      type: 'EXPENSE',
      categoryId: categoryIdSalary, // Mismatch
      note: 'Incorrect',
      date: new Date().toISOString(),
    };

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(txn)
      .expect(400);
  });

  it('should list and filter transactions', async () => {
    // Create salary txn
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 2000,
        type: 'INCOME',
        categoryId: categoryIdSalary,
        date: new Date().toISOString(),
        tags: ['salary'],
      })
      .expect(201);

    // Create food txn
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 50,
        type: 'EXPENSE',
        categoryId: categoryIdFood,
        date: new Date().toISOString(),
        tags: ['groceries'],
      })
      .expect(201);

    // List all
    const listAll = await request(app)
      .get('/api/transactions?page=1&limit=20')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listAll.body.success).toBe(true);
    expect(listAll.body.data.length).toBe(2);

    // Filter by type
    const listExpenses = await request(app)
      .get('/api/transactions?type=EXPENSE&page=1&limit=20')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(listExpenses.body.data.length).toBe(1);
    expect(listExpenses.body.data[0].amount).toBe(50);
  });

  it('should update a transaction', async () => {
    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 100,
        type: 'EXPENSE',
        categoryId: categoryIdFood,
        date: new Date().toISOString(),
      })
      .expect(201);

    const txnId = createRes.body.data.id;

    const res = await request(app)
      .patch(`/api/transactions/${txnId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 120, note: 'Updated food note' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(120);
    expect(res.body.data.note).toBe('Updated food note');
  });

  it('should delete a transaction', async () => {
    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 100,
        type: 'EXPENSE',
        categoryId: categoryIdFood,
        date: new Date().toISOString(),
      })
      .expect(201);

    const txnId = createRes.body.data.id;

    await request(app)
      .delete(`/api/transactions/${txnId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Verify it is gone
    const listRes = await request(app)
      .get('/api/transactions?page=1&limit=20')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(listRes.body.data.length).toBe(0);
  });

  it('should bulk import transactions via CSV', async () => {
    const csvContent =
      `amount,type,categoryId,date,note,tags,receiptUrl,isRecurring,recurringRule\n` +
      `250,EXPENSE,${categoryIdFood},2026-07-01T00:00:00.000Z,Grocery run,food|weekly,,false,\n` +
      `400,INCOME,${categoryIdSalary},2026-07-02T00:00:00.000Z,Freelance payout,work,,false,`;

    const res = await request(app)
      .post('/api/transactions/import')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from(csvContent), 'transactions.csv')
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);

    // Check count in database
    const count = await prisma.transaction.count({ where: { userId } });
    expect(count).toBe(2);
  });
});
