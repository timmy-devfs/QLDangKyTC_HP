const authMiddleware = require('./authMiddleware');
const { checkRole } = require('./roleMiddleware');

module.exports = {
    verifyToken: authMiddleware,
    checkRole
};
