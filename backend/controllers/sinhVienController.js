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
            const { MaSV, HoTen, NgaySinh, Lop } = req.body;
            const sql = 'INSERT INTO SinhVien (MaSV, HoTen, NgaySinh, Lop) VALUES (?, ?, ?, ?)';
            await execQuery(sql, [MaSV, HoTen, NgaySinh, Lop]);
            res.json({ success: true, message: 'Them thanh cong' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 3. Cập nhật sinh viên
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { HoTen, Lop } = req.body;
            const sql = 'UPDATE SinhVien SET HoTen = ?, Lop = ? WHERE MaSV = ?';
            await execQuery(sql, [HoTen, Lop, id]);
            res.json({ success: true, message: 'Cap nhat thanh cong' });
        } catch (error) {
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