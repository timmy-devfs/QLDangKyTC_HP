const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'uth_qlhp_test_secret_2025';
const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

const sign = (payload) => {
    return jwt.sign(payload, secret, { expiresIn });
};

module.exports = {
    secret,
    expiresIn,
    sign
};