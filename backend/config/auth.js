// backend/middleware/auth.js

const verifyToken = (req, res, next) => {
    // Logic xác thực token của bạn...
    next();
};

const checkRole = (roleRequired) => {
    return (req, res, next) => {
        // Giả sử req.user đã được gán ở verifyToken
        if (req.user && req.user.role === roleRequired) {
            next();
        } else {
            res.status(403).json({ message: "Bạn không có quyền truy cập!" });
        }
    };
};

// QUAN TRỌNG: Bạn phải export dạng Object nếu bên kia dùng Destructuring ({})
module.exports = { 
    verifyToken, 
    checkRole 
};