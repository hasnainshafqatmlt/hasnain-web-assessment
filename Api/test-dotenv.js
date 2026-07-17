const path = require('path');
const dotenv = require('dotenv');

module.exports = async () => {
  // Disable MD5 check for MongoDB binary
  process.env.MONGOMS_DISABLE_MD5_CHECK = 'true';
  dotenv.config({ path: path.resolve(__dirname, '.env.test') });
};
