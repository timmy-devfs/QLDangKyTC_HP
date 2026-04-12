const checkRole = (...roles) => {
  return (req, res, next) => {
    // req.user được gắn bởi authMiddleware chạy trước
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực.',
      });
    }

    // Kiểm tra vai trò của user có nằm trong danh sách được phép không
    if (!roles.includes(req.user.vaiTro)) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền thực hiện thao tác này. Yêu cầu vai trò: ${roles.join(' hoặc ')}.`,
      });
    }

    next();
  };
};

module.exports = { checkRole };