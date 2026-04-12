const express = require('express');
const router = express.Router();
// Đảm bảo đường dẫn này khớp với cấu trúc thư mục của bạn
const db = require('../config/database'); 
const { verifyToken, checkRole } = require('../middleware/auth'); 

// ==========================================
// API QUẢN LÝ SINH VIÊN (Backend Logic)
// ==========================================

// 1. Lấy danh sách toàn bộ sinh viên (Chỉ Admin, Giáo vụ hoặc Giảng viên mới được xem)
router.get('/', verifyToken, checkRole(['ADMIN', 'GIAOVU', 'GIANGVIEN']), async (req, res) => {
    try {
        // Có thể thêm phân trang (pagination) ở đây nếu dữ liệu quá lớn
        const query = 'SELECT MaSV, HoTen, Email, SoDienThoai, NgaySinh, GioiTinh, MaLop, NganhHoc FROM SinhVien';
        const [rows] = await db.promise().query(query);
        
        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách sinh viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy dữ liệu sinh viên' });
    }
});

// 2. Lấy thông tin chi tiết một sinh viên theo MaSV (Chỉ Admin/Giáo vụ hoặc CHÍNH sinh viên đó)
router.get('/:maSV', verifyToken, async (req, res) => {
    const { maSV } = req.params;
    
    // Kiểm tra bảo mật: Nếu là role SINHVIEN, chỉ được xem profile của chính mình
    if (req.user.role === 'SINHVIEN' && req.user.id !== maSV) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền xem thông tin của sinh viên khác' });
    }

    try {
        const query = 'SELECT MaSV, HoTen, Email, SoDienThoai, NgaySinh, GioiTinh, MaLop, NganhHoc FROM SinhVien WHERE MaSV = ?';
        const [rows] = await db.promise().query(query, [maSV]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên' });
        }

        res.status(200).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Lỗi chi tiết sinh viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// 3. Thêm mới một sinh viên (Chỉ Admin hoặc Giáo vụ)
router.post('/', verifyToken, checkRole(['ADMIN', 'GIAOVU']), async (req, res) => {
    const { MaSV, HoTen, Email, SoDienThoai, NgaySinh, GioiTinh, MaLop, NganhHoc } = req.body;

    if (!MaSV || !HoTen || !Email) {
        return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các trường bắt buộc (MaSV, HoTen, Email)' });
    }

    try {
        const query = 'INSERT INTO SinhVien (MaSV, HoTen, Email, SoDienThoai, NgaySinh, GioiTinh, MaLop, NganhHoc) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        await db.promise().query(query, [MaSV, HoTen, Email, SoDienThoai, NgaySinh, GioiTinh, MaLop, NganhHoc]);
        
        res.status(201).json({ success: true, message: 'Thêm sinh viên thành công' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Mã số sinh viên hoặc Email đã tồn tại trong hệ thống' });
        }
        console.error('Lỗi thêm sinh viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi thêm sinh viên' });
    }
});

// 4. Cập nhật thông tin sinh viên (Admin/Giáo vụ)
router.put('/:maSV', verifyToken, checkRole(['ADMIN', 'GIAOVU']), async (req, res) => {
    const { maSV } = req.params;
    const { HoTen, Email, SoDienThoai, NgaySinh, GioiTinh, MaLop, NganhHoc } = req.body;

    try {
        const query = 'UPDATE SinhVien SET HoTen = ?, Email = ?, SoDienThoai = ?, NgaySinh = ?, GioiTinh = ?, MaLop = ?, NganhHoc = ? WHERE MaSV = ?';
        const [result] = await db.promise().query(query, [HoTen, Email, SoDienThoai, NgaySinh, GioiTinh, MaLop, NganhHoc, maSV]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên để cập nhật' });
        }

        res.status(200).json({ success: true, message: 'Cập nhật thông tin sinh viên thành công' });
    } catch (error) {
        console.error('Lỗi cập nhật sinh viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật' });
    }
});

// 5. Xóa sinh viên (Chỉ Admin)
router.delete('/:maSV', verifyToken, checkRole(['ADMIN']), async (req, res) => {
    const { maSV } = req.params;

    try {
        const query = 'DELETE FROM SinhVien WHERE MaSV = ?';
        const [result] = await db.promise().query(query, [maSV]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên để xóa' });
        }

        res.status(200).json({ success: true, message: 'Xóa sinh viên thành công' });
    } catch (error) {
        // Chặn lỗi nếu sinh viên đã có dữ liệu đăng ký học phần, điểm số, đóng học phí...
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ 
                success: false, 
                message: 'Không thể xóa! Sinh viên này đã có dữ liệu đăng ký học phần hoặc điểm số trong hệ thống.' 
            });
        }
        console.error('Lỗi xóa sinh viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa' });
    }
});

module.exports = router;