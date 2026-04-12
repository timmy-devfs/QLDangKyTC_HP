const checkRole = (...roles) => {
    return (req, res, next) => {
        // Kiểm tra xem verifyToken đã chạy trước đó chưa
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Chưa xác thực.'
            });
        }

        // Kiểm tra vai trò dựa trên field "vaiTro" như trong ảnh bạn chụp
        if (!roles.includes(req.user.vaiTro)) {
            return res.status(403).json({
                success: false,
                message: `Bạn không có quyền thực hiện thao tác này. Yêu cầu vai trò: ${roles.join(' hoặc ')}.`
            });
        }

        next();
    };
};

// Export đúng dạng Object để bên Route có thể dùng {}
module.exports = { checkRole };