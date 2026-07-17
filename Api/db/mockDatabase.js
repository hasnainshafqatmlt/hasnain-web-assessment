// In-memory database - replaces MongoDB for local development and tests
const bcrypt = require('bcryptjs');
const { randomBytes } = require('crypto');

const createId = () => randomBytes(12).toString('hex');

const mockData = {
  users: [
    {
      _id: '1',
      email: 'test@meblabs.com',
      password: bcrypt.hashSync('testtest', 10),
      name: 'Test',
      lastname: 'User',
      fullname: 'Test User',
      role: 'user',
      lang: 'en',
      phone: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  transactions: []
};

const sortTransactions = (list, sorter = '-date') => {
  const desc = sorter.startsWith('-');
  const field = desc ? sorter.slice(1) : sorter;

  return [...list].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    if (aVal === bVal) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return desc ? bVal - aVal : aVal - bVal;
    }

    const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
    return desc ? -comparison : comparison;
  });
};

const mockDB = {
  findUserByEmail: async email => {
    const normalized = String(email).toLowerCase();
    return mockData.users.find(u => u.email.toLowerCase() === normalized && !u.deleted);
  },

  findUserById: async id => mockData.users.find(u => u._id === id && !u.deleted),

  findTransactions: async (query = {}, options = {}) => {
    let results = [...mockData.transactions];

    if (query.userId) {
      results = results.filter(t => t.userId === query.userId);
    }

    if (query.type) {
      results = results.filter(t => t.type === query.type);
    }

    if (query.category) {
      const category = String(query.category).toLowerCase();
      results = results.filter(t => t.category.toLowerCase() === category);
    }

    if (query.filter) {
      const term = String(query.filter).toLowerCase();
      results = results.filter(
        t =>
          t.description?.toLowerCase().includes(term) ||
          t.category?.toLowerCase().includes(term) ||
          t.type?.toLowerCase().includes(term)
      );
    }

    return sortTransactions(results, options.sorter);
  },

  findTransactionById: async id => mockData.transactions.find(t => t._id === id),

  createTransaction: async transactionData => {
    const now = new Date().toISOString();
    const newTransaction = {
      _id: createId(),
      ...transactionData,
      createdAt: now,
      updatedAt: now
    };
    mockData.transactions.push(newTransaction);
    return newTransaction;
  },

  updateTransaction: async (id, updateData) => {
    const index = mockData.transactions.findIndex(t => t._id === id);
    if (index === -1) return null;

    mockData.transactions[index] = {
      ...mockData.transactions[index],
      ...updateData,
      _id: mockData.transactions[index]._id,
      userId: mockData.transactions[index].userId,
      updatedAt: new Date().toISOString()
    };

    return mockData.transactions[index];
  },

  deleteTransaction: async id => {
    const index = mockData.transactions.findIndex(t => t._id === id);
    if (index === -1) return false;

    mockData.transactions.splice(index, 1);
    return true;
  },

  clearTransactions: () => {
    mockData.transactions = [];
  },

  getSummary: async userId => {
    const transactions = mockData.transactions.filter(t => t.userId === userId);
    return transactions.reduce(
      (acc, t) => {
        if (t.type === 'income') acc.income += t.amount;
        else acc.expense += t.amount;
        acc.balance = acc.income - acc.expense;
        return acc;
      },
      { income: 0, expense: 0, balance: 0, count: transactions.length }
    );
  }
};

class MockUser {
  static async findOne(query) {
    if (query.email) return mockDB.findUserByEmail(query.email);
    if (query._id) return mockDB.findUserById(query._id);
    return null;
  }

  static async findById(id) {
    return mockDB.findUserById(id);
  }
}

class MockTransaction {
  static async find(query = {}, options = {}) {
    return mockDB.findTransactions(query, options);
  }

  static async findById(id) {
    return mockDB.findTransactionById(id);
  }

  static async create(data) {
    return mockDB.createTransaction(data);
  }

  static async findByIdAndUpdate(id, data) {
    return mockDB.updateTransaction(id, data);
  }

  static async findByIdAndDelete(id) {
    return mockDB.deleteTransaction(id);
  }
}

const connectDB = async () => true;

module.exports = {
  connectDB,
  User: MockUser,
  Transaction: MockTransaction,
  mockDB
};
