const supertest = require('supertest');

const app = require('../app');
const { mockDB } = require('../db/mockDatabase');

const agent = supertest.agent(app);

jest.mock('../helpers/secrets.js');

beforeEach(async () => {
  mockDB.clearTransactions();

  await agent.post('/auth/login').send({ email: 'test@meblabs.com', password: 'testtest' }).expect(200);
});

describe('Transactions API', () => {
  const sampleExpense = {
    type: 'expense',
    amount: 25.5,
    category: 'Food',
    date: '2026-07-17',
    description: 'Lunch'
  };

  const sampleIncome = {
    type: 'income',
    amount: 1500,
    category: 'Salary',
    date: '2026-07-01',
    description: 'Monthly salary'
  };

  describe('POST /transactions', () => {
    test('creates an expense entry', async () => {
      const res = await agent.post('/transactions').send(sampleExpense).expect(201);

      expect(res.body).toEqual({
        _id: expect.any(String),
        type: 'expense',
        amount: 25.5,
        category: 'Food',
        date: '2026-07-17',
        description: 'Lunch',
        userId: '1',
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });

    test('rejects invalid type', async () => {
      const res = await agent
        .post('/transactions')
        .send({ ...sampleExpense, type: 'transfer' })
        .expect(400);

      expect(res.body).toEqual(
        expect.objectContaining({
          error: 200,
          message: 'Validation error',
          data: '/type'
        })
      );
    });

    test('rejects missing required fields', async () => {
      const res = await agent.post('/transactions').send({ type: 'expense' }).expect(400);

      expect(res.body.error).toBe(201);
      expect(res.body.message).toBe('Missing required parameters');
    });

    test('rejects non-positive amount', async () => {
      const res = await agent
        .post('/transactions')
        .send({ ...sampleExpense, amount: 0 })
        .expect(400);

      expect(res.body).toEqual(
        expect.objectContaining({
          error: 200,
          message: 'Validation error',
          data: '/amount'
        })
      );
    });
  });

  describe('GET /transactions', () => {
    beforeEach(async () => {
      await agent.post('/transactions').send(sampleExpense);
      await agent.post('/transactions').send(sampleIncome);
      await agent.post('/transactions').send({
        type: 'expense',
        amount: 40,
        category: 'Transport',
        date: '2026-07-16',
        description: 'Taxi'
      });
    });

    test('lists all transactions for the user', async () => {
      const res = await agent.get('/transactions').expect(200);

      expect(res.body).toHaveLength(3);
      expect(res.body.every(item => item.userId === '1')).toBe(true);
    });

    test('filters by type', async () => {
      const res = await agent.get('/transactions?type=income').expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].type).toBe('income');
      expect(res.body[0].category).toBe('Salary');
    });

    test('filters by search term', async () => {
      const res = await agent.get('/transactions?filter=taxi').expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].description).toBe('Taxi');
    });

    test('sorts by amount ascending', async () => {
      const res = await agent.get('/transactions?sorter=amount').expect(200);

      expect(res.body.map(item => item.amount)).toEqual([25.5, 40, 1500]);
    });
  });

  describe('GET /transactions/summary', () => {
    test('returns income, expense and balance totals', async () => {
      await agent.post('/transactions').send(sampleExpense);
      await agent.post('/transactions').send(sampleIncome);

      const res = await agent.get('/transactions/summary').expect(200);

      expect(res.body).toEqual({
        income: 1500,
        expense: 25.5,
        balance: 1474.5,
        count: 2
      });
    });
  });

  describe('GET /transactions/:id', () => {
    test('returns a single transaction', async () => {
      const created = await agent.post('/transactions').send(sampleExpense).expect(201);

      const res = await agent.get(`/transactions/${created.body._id}`).expect(200);
      expect(res.body._id).toBe(created.body._id);
      expect(res.body.description).toBe('Lunch');
    });

    test('returns 404 for unknown id', async () => {
      await agent.get('/transactions/507f1f77bcf86cd799439011').expect(404);
    });
  });

  describe('PUT /transactions/:id', () => {
    test('updates an existing transaction', async () => {
      const created = await agent.post('/transactions').send(sampleExpense).expect(201);

      const res = await agent
        .put(`/transactions/${created.body._id}`)
        .send({ amount: 30, description: 'Dinner' })
        .expect(200);

      expect(res.body.amount).toBe(30);
      expect(res.body.description).toBe('Dinner');
      expect(res.body.category).toBe('Food');
    });

    test('returns 404 when updating a missing transaction', async () => {
      await agent.put('/transactions/507f1f77bcf86cd799439011').send({ amount: 10 }).expect(404);
    });
  });

  describe('DELETE /transactions/:id', () => {
    test('deletes a transaction', async () => {
      const created = await agent.post('/transactions').send(sampleExpense).expect(201);

      await agent
        .delete(`/transactions/${created.body._id}`)
        .expect(200)
        .then(res => expect(res.body).toEqual({ message: 'Transaction deleted successfully' }));

      await agent.get(`/transactions/${created.body._id}`).expect(404);
    });

    test('cannot delete twice', async () => {
      const created = await agent.post('/transactions').send(sampleExpense).expect(201);

      await agent.delete(`/transactions/${created.body._id}`).expect(200);
      await agent.delete(`/transactions/${created.body._id}`).expect(404);
    });
  });
});
