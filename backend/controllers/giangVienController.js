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
            const { MaGV, HoTen, GioiTinh, NgaySinh, Email, SoDienThoai, HocVi, MaKhoa } = req.body;

            // Kiểm tra dữ liệu đầu vào
            if (!MaGV || !HoTen || !Email || !MaKhoa) {
                return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc!' });
            }

            // Validate: Kiểm tra email không được trùng
            const checkEmailSql = 'SELECT * FROM GiangVien WHERE Email = ?';
            const existingEmail = await execQuery(checkEmailSql, [Email]);
            
            if (existingEmail && existingEmail.length > 0) {
                return res.status(400).json({ success: false, message: 'Email này đã được sử dụng!' });
            }

            const sql = 'INSERT INTO GiangVien (MaGV, HoTen, GioiTinh, NgaySinh, Email, SoDienThoai, HocVi, MaKhoa) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            await execQuery(sql, [MaGV, HoTen, GioiTinh || 'Nam', NgaySinh, Email, SoDienThoai, HocVi, MaKhoa]);
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
            const { HoTen, GioiTinh, NgaySinh, Email, SoDienThoai, HocVi, MaKhoa } = req.body;

            const checkEmailSql = 'SELECT * FROM GiangVien WHERE Email = ? AND MaGV != ?';
            const existingEmail = await execQuery(checkEmailSql, [Email, id]);
            
            if (existingEmail && existingEmail.length > 0) {
                return res.status(400).json({ success: false, message: 'Email đã tồn tại ở giảng viên khác!' });
            }

            const sql = 'UPDATE GiangVien SET HoTen = ?, GioiTinh = ?, NgaySinh = ?, Email = ?, SoDienThoai = ?, HocVi = ?, MaKhoa = ? WHERE MaGV = ?';
            await execQuery(sql, [HoTen, GioiTinh, NgaySinh, Email, SoDienThoai, HocVi, MaKhoa, id]);
            res.json({ success: true, message: 'Cập nhật giảng viên thành công' });

        } catch (error) {
            console.error('Lỗi update giảng viên:', error.message);
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