const { Transaction, mockDB } = require('../db/mockDatabase');
const { SendData, ServerError, NotFound, Unauthorized, Forbidden } = require('../helpers/response');

const getUserId = req => req.user?.id || req.user?._id || '1';

module.exports.get = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { type, category, filter, sorter = '-date' } = req.query;

    const data = await Transaction.find(
      {
        userId,
        ...(type ? { type } : {}),
        ...(category ? { category } : {}),
        ...(filter ? { filter } : {})
      },
      { sorter }
    );

    return next(SendData(data));
  } catch (err) {
    return next(ServerError(err));
  }
};

module.exports.getSummary = async (req, res, next) => {
  try {
    const summary = await mockDB.getSummary(getUserId(req));
    return next(SendData(summary));
  } catch (err) {
    return next(ServerError(err));
  }
};

module.exports.getById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return next(NotFound());

    if (transaction.userId !== getUserId(req)) return next(Forbidden());

    return next(SendData(transaction));
  } catch (err) {
    return next(ServerError(err));
  }
};

module.exports.create = async (req, res, next) => {
  try {
    if (!req.user) return next(Unauthorized());

    const data = await Transaction.create({
      ...req.body,
      description: req.body.description || '',
      userId: getUserId(req)
    });

    return next(SendData(data, 201));
  } catch (err) {
    return next(ServerError(err));
  }
};

module.exports.update = async (req, res, next) => {
  try {
    const existing = await Transaction.findById(req.params.id);
    if (!existing) return next(NotFound());
    if (existing.userId !== getUserId(req)) return next(Forbidden());

    const data = await Transaction.findByIdAndUpdate(req.params.id, req.body);
    return next(SendData(data));
  } catch (err) {
    return next(ServerError(err));
  }
};

module.exports.delete = async (req, res, next) => {
  try {
    const existing = await Transaction.findById(req.params.id);
    if (!existing) return next(NotFound());
    if (existing.userId !== getUserId(req)) return next(Forbidden());

    await Transaction.findByIdAndDelete(req.params.id);
    return next(SendData({ message: 'Transaction deleted successfully' }));
  } catch (err) {
    return next(ServerError(err));
  }
};
