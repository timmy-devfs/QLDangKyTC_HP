const { execQuery } = require('../config/db');

const giangVienController = {
    // 1. Lấy danh sách giảng viên
    getAll: async (req, res) => {
        try {
            const sql = 'SELECT * FROM GiangVien';
            const rows = await execQuery(sql);
            // Đảm bảo trả về mảng dữ liệu rõ ràng
            res.json({ success: true, data: rows });
        } catch (error) {
            console.error('Lỗi getAll giảng viên:', error.message);
            res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    },

    // 2. Thêm giảng viên mới
    create: async (req, res) => {
        try {
            // Sửa lỗi chính tả: 'BoPmon' thành 'BoMon' để khớp với Database thường dùng
            const { MaGV, HoTen, BoMon, HocVi, Email, SoDienThoai } = req.body;

            // Kiểm tra dữ liệu đầu vào (Tránh lỗi Undefined Parameters đã gặp)
            if (!MaGV || !HoTen || !Email) {
                return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc!' });
            }

            // Validate: Kiểm tra email không được trùng
            const checkEmailSql = 'SELECT * FROM GiangVien WHERE Email = ?';
            const existingEmail = await execQuery(checkEmailSql, [Email]);
            
            if (existingEmail && existingEmail.length > 0) {
                return res.status(400).json({ success: false, message: 'Email này đã được sử dụng!' });
            }

            const sql = 'INSERT INTO GiangVien (MaGV, HoTen, BoMon, HocVi, Email, SoDienThoai) VALUES (?, ?, ?, ?, ?, ?)';
            await execQuery(sql, [MaGV, HoTen, BoMon, HocVi, Email, SoDienThoai]);
            res.json({ success: true, message: 'Thêm giảng viên thành công' });

        } catch (error) {
            console.error('Lỗi create giảng viên:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 3. Cập nhật giảng viên
    update: async (req, res) => {
        try {
            const { id } = req.params; 
            const { HoTen, BoMon, HocVi, Email, SoDienThoai } = req.body;

            const checkEmailSql = 'SELECT * FROM GiangVien WHERE Email = ? AND MaGV != ?';
            const existingEmail = await execQuery(checkEmailSql, [Email, id]);
            
            if (existingEmail && existingEmail.length > 0) {
                return res.status(400).json({ success: false, message: 'Email đã tồn tại ở giảng viên khác!' });
            }

            const sql = 'UPDATE GiangVien SET HoTen = ?, BoMon = ?, HocVi = ?, Email = ?, SoDienThoai = ? WHERE MaGV = ?';
            await execQuery(sql, [HoTen, BoMon, HocVi, Email, SoDienThoai, id]);
            res.json({ success: true, message: 'Cập nhật giảng viên thành công' });

        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 4. Xóa giảng viên
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const sql = 'DELETE FROM GiangVien WHERE MaGV = ?';
            await execQuery(sql, [id]);
            res.json({ success: true, message: 'Xóa giảng viên thành công' });

        } catch (error) {
            // Xử lý lỗi khóa ngoại (Foreign Key) như yêu cầu Task 5
            if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.message.includes('foreign key constraint')) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Không thể xóa! Giảng viên này đang phụ trách lớp học phần.' 
                });
            }
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = giangVienController;