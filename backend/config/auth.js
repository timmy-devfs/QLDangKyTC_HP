const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '24h';

module.exports = {
   secret: JWT_SECRET,
   sign(payload) { return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES }); },
   verify(token) { return jwt.verify(token, JWT_SECRET); },
};