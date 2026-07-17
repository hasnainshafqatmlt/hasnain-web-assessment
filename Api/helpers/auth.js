const jwt = require('jsonwebtoken');

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/'
};

const generateToken = async (res, user) => {
  const userId = user._id || user.id;
  const userEmail = user.email;
  const userRole = user.role || 'user';
  const userName = user.name || 'Test User';

  const payload = {
    id: userId,
    email: userEmail,
    name: userName,
    role: userRole
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.cookie('logged', 'true', {
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000
  });

  return { accessToken, refreshToken };
};

const clearTokens = res => {
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  res.clearCookie('logged', { sameSite: 'lax', path: '/' });
};

// Helper function for tests - generate auth token without response object
const genereteAuthToken = user => {
  const userId = user._id || user.id;
  const userEmail = user.email;
  const userRole = user.role || 'user';
  const userName = user.name || 'Test User';

  const payload = {
    id: userId,
    email: userEmail,
    name: userName,
    role: userRole
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });

  return { token: accessToken };
};

// Helper function for tests - generate change password token
const genereteChangePasswordToken = user => {
  const userId = user._id || user.id;
  const userEmail = user.email;

  const payload = {
    id: userId,
    email: userEmail
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

  return { token };
};

module.exports = {
  generateToken,
  clearTokens,
  genereteAuthToken,
  genereteChangePasswordToken
};
