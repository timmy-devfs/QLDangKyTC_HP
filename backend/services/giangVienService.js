const express = require('express');
const router = express.Router();
// Giả sử bạn đã có file cấu hình kết nối database và middleware xác thực
const db = require('../config/database'); 
const { verifyToken, checkRole } = require('../middleware/auth'); 

// ==========================================
// API QUẢN LÝ GIẢNG VIÊN (Backend Logic)
// ==========================================

// 1. Lấy danh sách toàn bộ giảng viên (Chỉ Admin hoặc Quản lý giáo vụ mới được xem toàn bộ)
router.get('/', verifyToken, checkRole(['ADMIN', 'GIAOVU']), async (req, res) => {
    try {
        const query = 'SELECT MaGV, HoTen, Email, SoDienThoai, Khoa, ChuyenNganh FROM GiangVien';
        const [rows] = await db.promise().query(query);
        
        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách giảng viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy dữ liệu giảng viên' });
    }
});

// 2. Lấy thông tin chi tiết một giảng viên theo MaGV
router.get('/:maGV', verifyToken, async (req, res) => {
    const { maGV } = req.params;
    try {
        const query = 'SELECT MaGV, HoTen, Email, SoDienThoai, Khoa, ChuyenNganh FROM GiangVien WHERE MaGV = ?';
        const [rows] = await db.promise().query(query, [maGV]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy giảng viên' });
        }

        res.status(200).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Lỗi chi tiết giảng viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// 3. Thêm mới một giảng viên (Chỉ Admin)
router.post('/', verifyToken, checkRole(['ADMIN']), async (req, res) => {
    const { MaGV, HoTen, Email, SoDienThoai, Khoa, ChuyenNganh } = req.body;

    if (!MaGV || !HoTen || !Email) {
        return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các trường bắt buộc (MaGV, HoTen, Email)' });
    }

    try {
        const query = 'INSERT INTO GiangVien (MaGV, HoTen, Email, SoDienThoai, Khoa, ChuyenNganh) VALUES (?, ?, ?, ?, ?, ?)';
        await db.promise().query(query, [MaGV, HoTen, Email, SoDienThoai, Khoa, ChuyenNganh]);
        
        res.status(201).json({ success: true, message: 'Thêm giảng viên thành công' });
    } catch (error) {
        // Xử lý lỗi trùng lặp MaGV (Duplicate entry)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Mã giảng viên hoặc Email đã tồn tại' });
        }
        console.error('Lỗi thêm giảng viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi thêm giảng viên' });
    }
});

// 4. Cập nhật thông tin giảng viên (Chỉ Admin)
router.put('/:maGV', verifyToken, checkRole(['ADMIN']), async (req, res) => {
    const { maGV } = req.params;
    const { HoTen, Email, SoDienThoai, Khoa, ChuyenNganh } = req.body;

    try {
        const query = 'UPDATE GiangVien SET HoTen = ?, Email = ?, SoDienThoai = ?, Khoa = ?, ChuyenNganh = ? WHERE MaGV = ?';
        const [result] = await db.promise().query(query, [HoTen, Email, SoDienThoai, Khoa, ChuyenNganh, maGV]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy giảng viên để cập nhật' });
        }

        res.status(200).json({ success: true, message: 'Cập nhật thông tin giảng viên thành công' });
    } catch (error) {
        console.error('Lỗi cập nhật giảng viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật' });
    }
});

// 5. Xóa giảng viên (Chỉ Admin)
router.delete('/:maGV', verifyToken, checkRole(['ADMIN']), async (req, res) => {
    const { maGV } = req.params;

    try {
        const query = 'DELETE FROM GiangVien WHERE MaGV = ?';
        const [result] = await db.promise().query(query, [maGV]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy giảng viên để xóa' });
        }

        res.status(200).json({ success: true, message: 'Xóa giảng viên thành công' });
    } catch (error) {
        // Xử lý lỗi ràng buộc khóa ngoại (ví dụ: Giảng viên đang có lớp dạy)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ success: false, message: 'Không thể xóa giảng viên này vì đang được phân công dạy học phần' });
        }
        console.error('Lỗi xóa giảng viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa' });
    }
});

module.exports = router;