const jwt = require('jsonwebtoken');
const { Unauthorized, MissingRefreshToken, UnauthorizedRefreshToken } = require('../helpers/response');

const getTokenFromRequest = (req, cookieName, headerFallback = false) => {
  let token = req.cookies?.[cookieName];

  if (!token && headerFallback) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  return token;
};

const attachUser = (req, res, decoded) => {
  const user = {
    id: decoded.id,
    _id: decoded.id,
    email: decoded.email,
    name: decoded.name || 'Test User',
    role: decoded.role || 'user'
  };
  req.user = user;
  res.locals.user = user;
  return user;
};

const isAuth = (req, res, next) => {
  const token = getTokenFromRequest(req, 'accessToken', true);

  if (!token) {
    return next(Unauthorized());
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    attachUser(req, res, decoded);
    return next();
  } catch (error) {
    return next(Unauthorized());
  }
};

const isAuthRt = (req, res, next) => {
  const token = getTokenFromRequest(req, 'refreshToken');

  if (!token) {
    return next(MissingRefreshToken());
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    attachUser(req, res, decoded);
    return next();
  } catch (error) {
    return next(UnauthorizedRefreshToken());
  }
};

const isAuthRtlogout = (req, res, next) => {
  // Logout should always succeed so cookies can be cleared
  const token = getTokenFromRequest(req, 'refreshToken') || getTokenFromRequest(req, 'accessToken', true);

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      attachUser(req, res, decoded);
    } catch (error) {
      // ignore invalid tokens on logout
    }
  }

  return next();
};

const isAuthChangePassword = (req, res, next) => next();

module.exports = {
  isAuth,
  isAuthRt,
  isAuthRtlogout,
  isAuthChangePassword
};
