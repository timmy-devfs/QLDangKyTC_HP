const { execQuery } = require('../config/db');

const hocKyController = {
    // [GET] /api/hoc-ky: Lấy danh sách học kỳ
    getAll: async (req, res) => {
        try {
            const rows = await execQuery('SELECT * FROM HocKy ORDER BY NamHoc DESC, HocKySo DESC');
            res.json({ success: true, data: rows });
        } catch (err) {
            res.status(500).json({ success: false, message: "Lỗi lấy danh sách: " + err.message });
        }
    },

    // [POST] /api/hoc-ky: Tạo học kỳ mới
    create: async (req, res) => {
        const { MaHocKy, TenHocKy, NamHoc, HocKySo, NgayBatDauDK, NgayKetThucDK } = req.body;
        try {
            await execQuery(
                `INSERT INTO HocKy (MaHocKy, TenHocKy, NamHoc, HocKySo, NgayBatDauDK, NgayKetThucDK, TrangThai) 
                 VALUES (?, ?, ?, ?, ?, ?, 'Đã đóng')`,
                [MaHocKy, TenHocKy, NamHoc, HocKySo, NgayBatDauDK, NgayKetThucDK]
            );
            res.status(201).json({ success: true, message: 'Tạo học kỳ thành công' });
        } catch (err) {
            res.status(500).json({ success: false, message: "Lỗi tạo mới: " + err.message });
        }
    },

    // [PUT] /api/hoc-ky/:id: Toggle trạng thái
    toggleStatus: async (req, res) => {
        const { id } = req.params; // MaHocKy
        const { targetStatus } = req.body; // Trạng thái muốn chuyển tới

        try {
            // Logic quan trọng: Nếu muốn mở đăng ký, phải kiểm tra xem có HK nào đang mở không
            if (targetStatus === 'Đang mở đăng ký') {
                const active = await execQuery(
                    "SELECT MaHocKy FROM HocKy WHERE TrangThai = 'Đang mở đăng ký' AND MaHocKy != ?",
                    [id]
                );
                if (active.length > 0) {
                    return res.status(400).json({ 
                        message: `Lỗi: Học kỳ ${active[0].MaHocKy} đang ở trạng thái 'Đang mở đăng ký'. Chỉ được phép mở 1 học kỳ tại một thời điểm.` 
                    });
                }
            }

            await execQuery('UPDATE HocKy SET TrangThai = ? WHERE MaHocKy = ?', [targetStatus, id]);
            res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
        } catch (err) {
            res.status(500).json({ success: false, message: "Lỗi cập nhật: " + err.message });
        }
    }
};

module.exports = hocKyController;
exports.updateHocKyStatus = async (req, res, next) => { // Thêm tham số next
    try {
        const maHK = req.params.id;
        const targetStatus = req.body.targetStatus;
        
        await hocKyService.updateStatus(maHK, targetStatus);
        res.json({ message: "Cập nhật thành công" });
    } catch (error) {
        // BƯỚC 6: Không dùng res.status(500) nữa, truyền thẳng lỗi cho errorHandler xử lý
        next(error); 
    }
};