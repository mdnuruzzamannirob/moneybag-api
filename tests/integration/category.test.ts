import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/config/db.js';
import type { Category } from '../../src/generated/prisma/client.js';

describe('Category Module Integration Tests', () => {
  const testUser = {
    name: 'Alice',
    email: 'alice@example.com',
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

  it('should list categories with seeded defaults', async () => {
    const res = await request(app)
      .get('/api/categories?page=1&limit=20')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toBeDefined();
    expect(res.body.data.items.length).toBe(5); // Default seeded categories count
    expect(res.body.data.meta.total).toBe(5);
  });

  it('should filter categories by type', async () => {
    const res = await request(app)
      .get('/api/categories?type=INCOME&page=1&limit=20')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    const items = res.body.data.items as Category[];
    expect(items.length).toBeLessThan(5);
    expect(items.every((category) => category.type === 'INCOME')).toBe(true);
  });

  it('should create a custom category', async () => {
    const newCategory = {
      name: 'Investments',
      type: 'INCOME',
      icon: 'trending-up',
      color: '#00ff00',
    };

    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(newCategory)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(newCategory.name);
    expect(res.body.data.userId).toBe(userId);

    // Verify it is in database
    const dbCategory = await prisma.category.findUnique({
      where: { id: res.body.data.id },
    });
    expect(dbCategory).toBeDefined();
    expect(dbCategory?.name).toBe('Investments');
  });

  it('should update a category', async () => {
    const newCategory = {
      name: 'Stocks',
      type: 'INCOME',
    };

    const createRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(newCategory)
      .expect(201);

    const categoryId = createRes.body.data.id;

    const res = await request(app)
      .patch(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Crypto' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Crypto');
  });

  it('should delete a category', async () => {
    const newCategory = {
      name: 'Stocks',
      type: 'INCOME',
    };

    const createRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(newCategory)
      .expect(201);

    const categoryId = createRes.body.data.id;

    await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Verify it is gone
    const dbCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    expect(dbCategory).toBeNull();
  });

  it('should reject unauthorized actions', async () => {
    await request(app).get('/api/categories').expect(401);
  });
});
