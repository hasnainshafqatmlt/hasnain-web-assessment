const bcrypt = require('bcryptjs');
const { mockDB } = require('../db/mockDatabase');
const {
  SendData,
  ServerError,
  NotFound,
  Unauthorized,
  BadRequest,
  WrongEmail,
  WrongPassword
} = require('../helpers/response');
const { generateToken, clearTokens } = require('../helpers/auth');

const toPublicUser = user => ({
  id: user._id,
  email: user.email,
  name: user.name || 'Test User',
  lastname: user.lastname || 'User',
  fullname: user.fullname || `${user.name || 'Test'} ${user.lastname || 'User'}`,
  role: user.role || 'user',
  lang: user.lang || 'en',
  phone: user.phone || ''
});

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(BadRequest());
    }

    const user = await mockDB.findUserByEmail(String(email).toLowerCase());
    if (!user) {
      return next(WrongEmail());
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return next(WrongPassword());
    }

    await generateToken(res, user);
    return next(SendData(toPublicUser(user)));
  } catch (e) {
    return next(ServerError(e));
  }
};

exports.check = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(Unauthorized());
    }

    const user = await mockDB.findUserById(req.user.id);
    if (!user) {
      return next(Unauthorized());
    }

    return next(SendData(toPublicUser(user)));
  } catch (err) {
    return next(Unauthorized(err));
  }
};

exports.checkIfEmailExists = async ({ params: { email } }, res, next) => {
  try {
    const user = await mockDB.findUserByEmail(String(email).toLowerCase());
    if (!user) return next(NotFound());

    return next(
      SendData({
        message: 'Email exists!',
        id: user._id,
        email: user.email
      })
    );
  } catch (err) {
    return next(ServerError(err));
  }
};

exports.resendActivationEmail = async ({ body: { email } }, res, next) => {
  try {
    console.log(`[MOCK] Resend activation email to: ${email}`);
    return next(SendData());
  } catch (e) {
    return next(ServerError(e));
  }
};

exports.register = async (req, res, next) => next(Unauthorized());

exports.invite = async (req, res, next) => next(Unauthorized());

exports.refreshToken = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(Unauthorized());
    }

    const user = await mockDB.findUserById(req.user.id);
    if (!user) {
      return next(Unauthorized());
    }

    await generateToken(res, user);
    return next(SendData(toPublicUser(user)));
  } catch (e) {
    return next(ServerError(e));
  }
};

exports.logout = async (req, res, next) => {
  clearTokens(res);
  return next(SendData({ message: 'Logout succesfully!' }));
};

exports.forgotPassword = async ({ body: { email } }, res, next) => {
  try {
    const user = await mockDB.findUserByEmail(String(email).toLowerCase());
    if (!user) return next(NotFound());

    console.log(`[MOCK] Forgot password for: ${email}`);
    return next(SendData());
  } catch (err) {
    return next(ServerError(err));
  }
};

exports.restoreUser = async ({ body: { email } }, res, next) => {
  try {
    const user = await mockDB.findUserByEmail(String(email).toLowerCase());
    if (user) return next(NotFound()); // User is not deleted

    console.log(`[MOCK] Restore user: ${email}`);
    return next(SendData());
  } catch (err) {
    return next(ServerError(err));
  }
};

exports.changePassword = async ({ params: { email } }, res, next) => {
  try {
    console.log(`[MOCK] Change password for: ${email}`);
    clearTokens(res);
    return next(SendData({ message: 'Password changed successfully' }));
  } catch (err) {
    return next(ServerError(err));
  }
};
