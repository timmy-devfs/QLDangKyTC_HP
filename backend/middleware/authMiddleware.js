const jwt = require('jsonwebtoken');
const authCfg = require('../config/auth');

/**
 * authMiddleware — verify JWT token
 * Gắn vào route: router.get('/...', authMiddleware, controller)
 */
const authMiddleware = (req, res, next) => {
  // 1. Lấy header Authorization
  const authHeader = req.headers['authorization'];

  // 2. Kiểm tra có header và đúng định dạng "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Không có token xác thực. Vui lòng đăng nhập.',
    });
  }

  // 3. Tách lấy phần token (bỏ "Bearer ")
  const token = authHeader.split(' ')[1];

  try {
    // 4. Verify token — jwt.verify() sẽ throw nếu hết hạn hoặc sai chữ ký
    const decoded = jwt.verify(token, authCfg.secret);

    // 5. Gắn thông tin user vào request để controller dùng
    //    decoded chứa: { maTK, vaiTro, maSV/maGV, iat, exp }
    req.user = decoded;

    next(); // Cho phép đi tiếp vào controller
  } catch (err) {
    // Phân biệt lỗi hết hạn và lỗi chữ ký sai
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ.',
    });
  }
};

module.exports = authMiddleware;