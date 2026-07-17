module.exports = {
  createTransaction: {
    $id: 'createTransaction',
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['expense', 'income'] },
      amount: { type: 'number', exclusiveMinimum: 0 },
      category: { type: 'string', minLength: 1, maxLength: 64 },
      date: { type: 'string', format: 'date' },
      description: { type: 'string', maxLength: 500 }
    },
    required: ['type', 'amount', 'category', 'date'],
    additionalProperties: false
  },
  updateTransaction: {
    $id: 'updateTransaction',
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['expense', 'income'] },
      amount: { type: 'number', exclusiveMinimum: 0 },
      category: { type: 'string', minLength: 1, maxLength: 64 },
      date: { type: 'string', format: 'date' },
      description: { type: 'string', maxLength: 500 }
    },
    additionalProperties: false,
    minProperties: 1
  }
};
