/**
 * Xử lý lỗi chuẩn từ service layer.
 *  - err.status có → lỗi nghiệp vụ (400/404/...) → trả về JSON với status đó
 *  - Không có status → lỗi hệ thống (500) → chuyển sang errorHandler middleware
 */
const handleServiceError = (err, res, next) => {
    if (err.status) {
        return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
};

module.exports = { handleServiceError };
