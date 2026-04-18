// Sửa lỗi:
//   - Xóa dead code (exports.updateHocKyStatus + hocKyService chưa require)
//   - Thêm validation đầu vào cho create()
//   - Chuẩn hóa về 1 module.exports duy nhất

const { execQuery } = require('../config/db');

const VALID_STATUSES = ['Chưa mở', 'Đang mở đăng ký', 'Đã đóng đăng ký', 'Đang học', 'Kết thúc'];

const hocKyController = {
    // [GET] /api/hoc-ky: Lấy danh sách học kỳ
    getAll: async (req, res) => {
        try {
            const rows = await execQuery('SELECT * FROM HocKy ORDER BY NamHoc DESC, HocKySo DESC');
            res.json({ success: true, data: rows });
        } catch (err) {
            console.error('[hocKyController.getAll]', err.message);
            res.status(500).json({ success: false, message: 'Lỗi lấy danh sách học kỳ: ' + err.message });
        }
    },

    // [POST] /api/hoc-ky: Tạo học kỳ mới
    create: async (req, res) => {
        const { MaHocKy, TenHocKy, NamHoc, HocKySo, NgayBatDauDK, NgayKetThucDK } = req.body;

        //   Validation đầu vào (sửa lỗi Vấn đề 6)
        if (!MaHocKy || !TenHocKy || !NamHoc || !HocKySo) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc: MaHocKy, TenHocKy, NamHoc, HocKySo.'
            });
        }
        if (![1, 2, 3].includes(Number(HocKySo))) {
            return res.status(400).json({
                success: false,
                message: 'HocKySo phải là 1 (HK1), 2 (HK2), hoặc 3 (HK hè).'
            });
        }

        try {
            await execQuery(
                `INSERT INTO HocKy (MaHocKy, TenHocKy, NamHoc, HocKySo, NgayBatDauDK, NgayKetThucDK, TrangThai)
                 VALUES (?, ?, ?, ?, ?, ?, 'Chưa mở')`,
                [MaHocKy, TenHocKy, NamHoc, Number(HocKySo), NgayBatDauDK || null, NgayKetThucDK || null]
            );
            res.status(201).json({ success: true, message: 'Tạo học kỳ thành công.' });
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: `Mã học kỳ "${MaHocKy}" đã tồn tại.` });
            }
            console.error('[hocKyController.create]', err.message);
            res.status(500).json({ success: false, message: 'Lỗi tạo học kỳ: ' + err.message });
        }
    },

    // [PUT] /api/hoc-ky/:id: Cập nhật trạng thái học kỳ
    toggleStatus: async (req, res) => {
        const { id } = req.params;        // MaHocKy
        const { targetStatus } = req.body;

        //   Validate targetStatus
        if (!targetStatus || !VALID_STATUSES.includes(targetStatus)) {
            return res.status(400).json({
                success: false,
                message: `targetStatus không hợp lệ. Phải là một trong: ${VALID_STATUSES.join(', ')}.`
            });
        }

        try {
            // Chỉ được phép mở 1 HK đăng ký tại một thời điểm
            if (targetStatus === 'Đang mở đăng ký') {
                const active = await execQuery(
                    "SELECT MaHocKy FROM HocKy WHERE TrangThai = 'Đang mở đăng ký' AND MaHocKy != ?",
                    [id]
                );
                if (active.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Lỗi: Học kỳ "${active[0].MaHocKy}" đang mở đăng ký. Chỉ được phép mở 1 học kỳ tại một thời điểm.`
                    });
                }
            }

            const result = await execQuery(
                'UPDATE HocKy SET TrangThai = ? WHERE MaHocKy = ?',
                [targetStatus, id]
            );

            //   Kiểm tra affectedRows (sửa lỗi không tìm thấy HK)
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: `Không tìm thấy học kỳ "${id}".` });
            }

            res.json({ success: true, message: 'Cập nhật trạng thái thành công.' });
        } catch (err) {
            console.error('[hocKyController.toggleStatus]', err.message);
            res.status(500).json({ success: false, message: 'Lỗi cập nhật: ' + err.message });
        }
    }
};

//   Chỉ 1 module.exports duy nhất (xóa dead code exports.updateHocKyStatus)
module.exports = hocKyController;