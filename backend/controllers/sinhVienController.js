const { execQuery } = require('../config/db');

const sinhVienController = {
    // 1. Lấy danh sách sinh viên
    getAll: async (req, res) => {
        try {
            const sql = 'SELECT * FROM SinhVien';
            const rows = await execQuery(sql);
            res.json({ success: true, data: rows });
        } catch (error) {
            console.error('Loi getAll:', error.message);
            res.status(500).json({ success: false, message: 'Khong the lay danh sach' });
        }
    },

    // 2. Thêm sinh viên mới
    create: async (req, res) => {
        try {
            const { MaSV, HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, DiaChi, MaNganh, NamNhapHoc } = req.body;
            
            // Validate required fields
            if (!MaSV || !HoTen || !NgaySinh || !Email || !MaNganh || !NamNhapHoc) {
                return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc!' });
            }

            const sql = 'INSERT INTO SinhVien (MaSV, HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, DiaChi, MaNganh, NamNhapHoc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
            await execQuery(sql, [MaSV, HoTen, NgaySinh, GioiTinh || 'Nam', Email, SoDienThoai, DiaChi, MaNganh, NamNhapHoc]);
            res.json({ success: true, message: 'Thêm sinh viên thành công' });
        } catch (error) {
            console.error('Lỗi create sinh viên:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 3. Cập nhật sinh viên
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, DiaChi, MaNganh, NamNhapHoc, TrangThai } = req.body;
            
            const sql = `UPDATE SinhVien SET 
                        HoTen = ?, 
                        NgaySinh = ?, 
                        GioiTinh = ?, 
                        Email = ?, 
                        SoDienThoai = ?, 
                        DiaChi = ?, 
                        MaNganh = ?, 
                        NamNhapHoc = ?, 
                        TrangThai = ? 
                        WHERE MaSV = ?`;
            
            await execQuery(sql, [HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, DiaChi, MaNganh, NamNhapHoc, TrangThai || 'Đang học', id]);
            res.json({ success: true, message: 'Cập nhật thành công' });
        } catch (error) {
            console.error('Lỗi update sinh viên:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 4. Xóa sinh viên
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            await execQuery('DELETE FROM SinhVien WHERE MaSV = ?', [id]);
            res.json({ success: true, message: 'Xoa thanh cong' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = sinhVienController;