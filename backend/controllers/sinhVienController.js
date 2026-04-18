// Sửa lỗi:
//   - Thêm validation đầu vào cho create() và update()
//   - Kiểm tra affectedRows cho update() và delete() (tránh trả 200 dù không tìm thấy record)

const { execQuery } = require('../config/db');

const sinhVienController = {
    // 1. Lấy danh sách sinh viên
    getAll: async (req, res) => {
        try {
            const rows = await execQuery('SELECT * FROM SinhVien ORDER BY MaSV');
            res.json({ success: true, data: rows });
        } catch (error) {
            console.error('[sinhVienController.getAll]', error.message);
            res.status(500).json({ success: false, message: 'Không thể lấy danh sách sinh viên.' });
        }
    },

    // 2. Thêm sinh viên mới
    create: async (req, res) => {
        const { MaSV, HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, DiaChi, MaNganh, NamNhapHoc } = req.body;

        // ✅ Validate required fields
        if (!MaSV || !HoTen || !NgaySinh || !Email || !MaNganh || !NamNhapHoc) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc: MaSV, HoTen, NgaySinh, Email, MaNganh, NamNhapHoc.'
            });
        }

        try {
            await execQuery(
                'INSERT INTO SinhVien (MaSV, HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, DiaChi, MaNganh, NamNhapHoc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [MaSV, HoTen, NgaySinh, GioiTinh || 'Nam', Email, SoDienThoai || null, DiaChi || null, MaNganh, Number(NamNhapHoc)]
            );
            res.status(201).json({ success: true, message: 'Thêm sinh viên thành công.' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: 'Mã sinh viên hoặc Email đã tồn tại.' });
            }
            console.error('[sinhVienController.create]', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 3. Cập nhật sinh viên
    update: async (req, res) => {
        const { id } = req.params;

        // ✅ Validate id
        if (!id) {
            return res.status(400).json({ success: false, message: 'Thiếu MaSV.' });
        }

        const { HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, DiaChi, MaNganh, NamNhapHoc, TrangThai } = req.body;

        // ✅ Validate required fields
        if (!HoTen || !Email || !MaNganh) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc: HoTen, Email, MaNganh.'
            });
        }

        try {
            const result = await execQuery(
                `UPDATE SinhVien
                 SET HoTen = ?, NgaySinh = ?, GioiTinh = ?, Email = ?,
                     SoDienThoai = ?, DiaChi = ?, MaNganh = ?, NamNhapHoc = ?, TrangThai = ?
                 WHERE MaSV = ?`,
                [HoTen, NgaySinh, GioiTinh || 'Nam', Email, SoDienThoai || null, DiaChi || null,
                 MaNganh, NamNhapHoc, TrangThai || 'Đang học', id]
            );

            // ✅ Kiểm tra affectedRows — tránh trả 200 dù không tìm thấy
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: `Không tìm thấy sinh viên "${id}".` });
            }

            res.json({ success: true, message: 'Cập nhật sinh viên thành công.' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: 'Email đã tồn tại ở sinh viên khác.' });
            }
            console.error('[sinhVienController.update]', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 4. Xóa sinh viên
    delete: async (req, res) => {
        const { id } = req.params;

        try {
            const result = await execQuery('DELETE FROM SinhVien WHERE MaSV = ?', [id]);

            // ✅ Kiểm tra affectedRows
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: `Không tìm thấy sinh viên "${id}".` });
            }

            res.json({ success: true, message: 'Xóa sinh viên thành công.' });
        } catch (error) {
            // Xử lý lỗi FK (SV có đăng ký hoặc tài khoản liên kết)
            if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.message.includes('foreign key constraint')) {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể xóa! Sinh viên này có dữ liệu đăng ký học phần hoặc tài khoản liên kết.'
                });
            }
            console.error('[sinhVienController.delete]', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = sinhVienController;