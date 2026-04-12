const db = require('../database/db'); // Đảm bảo đường dẫn này đúng với file kết nối DB của bạn

const hocKyService = {
    // 1. Lấy toàn bộ danh sách học kỳ
    getAllHocKy: async () => {
        try {
            // QUAN TRỌNG: Tên bảng phải là 'hocky' khớp với MySQL Workbench
            const [rows] = await db.query("SELECT * FROM hocky"); 
            return rows;
        } catch (error) {
            console.error("Lỗi tại getAllHocKy Service:", error);
            throw error;
        }
    },

    // 2. Cập nhật trạng thái học kỳ (Logic Task 6)
    updateStatus: async (maHK, targetStatus) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Nếu muốn mở một học kỳ, phải đóng tất cả các học kỳ khác trước (Chỉ duy nhất 1 HK mở)
            if (targetStatus === 'Đang mở đăng ký') {
                await connection.query("UPDATE hocky SET TrangThai = 'Đã đóng'");
            }

            // Cập nhật trạng thái cho học kỳ cụ thể
            const [result] = await connection.query(
                "UPDATE hocky SET TrangThai = ? WHERE MaHocKy = ?",
                [targetStatus, maHK]
            );

            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            console.error("Lỗi tại updateStatus Service:", error);
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = hocKyService;