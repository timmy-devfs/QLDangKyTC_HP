// Sửa lỗi: import đúng path, dùng đúng API execQuery của mysql2/promise pool

const { execQuery } = require('../config/db'); // Đúng path (thay '../database/db')

const hocKyService = {
    // 1. Lấy toàn bộ danh sách học kỳ
    getAllHocKy: async () => {
        // Dùng đúng tên bảng PascalCase theo schema
        return execQuery('SELECT * FROM HocKy ORDER BY NamHoc DESC, HocKySo DESC');
    },

    // 2. Cập nhật trạng thái học kỳ
    // - Sửa: không dùng db.getConnection() nữa; dùng execQuery thay thế
    updateStatus: async (maHK, targetStatus) => {
        // Validate targetStatus theo CHECK constraint trong schema
        const validStatuses = ['Chưa mở', 'Đang mở đăng ký', 'Đã đóng đăng ký', 'Đang học', 'Kết thúc'];
        if (!validStatuses.includes(targetStatus)) {
            throw Object.assign(
                new Error(`Trạng thái không hợp lệ: "${targetStatus}".`),
                { status: 400 }
            );
        }

        // Kiểm tra chỉ 1 HK mở tại một thời điểm
        if (targetStatus === 'Đang mở đăng ký') {
            const active = await execQuery(
                "SELECT MaHocKy FROM HocKy WHERE TrangThai = 'Đang mở đăng ký' AND MaHocKy != ?",
                [maHK]
            );
            if (active.length > 0) {
                throw Object.assign(
                    new Error(`Học kỳ "${active[0].MaHocKy}" đang mở đăng ký. Chỉ được phép 1 học kỳ mở tại một thời điểm.`),
                    { status: 400 }
                );
            }
        }

        const result = await execQuery(
            'UPDATE HocKy SET TrangThai = ? WHERE MaHocKy = ?',
            [targetStatus, maHK]
        );

        if (result.affectedRows === 0) {
            throw Object.assign(
                new Error(`Không tìm thấy học kỳ "${maHK}".`),
                { status: 404 }
            );
        }

        return { message: 'Cập nhật trạng thái thành công.' };
    }
};

module.exports = hocKyService;