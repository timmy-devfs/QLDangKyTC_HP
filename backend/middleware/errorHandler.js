// backend/middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
    // Phân loại lỗi để gán HTTP Status Code (Bước 3)
    let statusCode = 500; // Mặc định là lỗi server (500)

    if (err.name === 'ValidationError') {
        statusCode = 400;
    } else if (err.name === 'UnauthorizedError') {
        statusCode = 401;
    } else if (err.name === 'ForbiddenError') {
        statusCode = 403;
    } else if (err.name === 'NotFoundError') {
        statusCode = 404;
    }

    // Ghi log lỗi ra Terminal để Dev (TV-02) dễ debug
    console.error(`[Error] ${err.name}: ${err.message}`);

    // Trả về JSON chuẩn theo yêu cầu của dự án (Bước 4)
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Lỗi hệ thống nội bộ',
        code: err.code || 'SERVER_ERROR'
    });
};

module.exports = errorHandler;