// backend/controllers/dangKyController.js
// TV-04  |  Task 1 & Task 2

const svc = require('../services/dangKyService');

/**
 * POST /api/dang-ky
 * Body: { maLHP }
 * Auth: SinhVien (maSV lấy từ JWT token)
 */
exports.dangKy = async (req, res, next) => {
  try {
    const maSV  = req.user.maSV;
    const { maLHP } = req.body;

    if (!maLHP) {
      return res.status(400).json({ success: false, message: 'Thiếu mã lớp học phần (maLHP).' });
    }
    if (!maSV) {
      return res.status(403).json({ success: false, message: 'Tài khoản không có mã sinh viên.' });
    }

    const result = await svc.dangKy(maSV, maLHP);
    res.status(201).json({
      success: true,
      message: 'Đăng ký học phần thành công!',
      data:    result,
    });
  } catch (err) {
    // Trả lỗi với status cụ thể (400/404) nếu có, không để lọt vào 500
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    // Lỗi từ Trigger SQL Server (THROW 50010...)
    if (err.message && err.message.includes('Lớp học phần đã đầy')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * GET /api/dang-ky?maHK=HK1_2526
 * Danh sách đăng ký của SV trong 1 học kỳ
 */
exports.getDanhSach = async (req, res, next) => {
  try {
    const maSV  = req.user.maSV;
    const { maHK } = req.query;

    if (!maHK) {
      return res.status(400).json({ success: false, message: 'Thiếu maHK.' });
    }

    const data = await svc.getDanhSachDangKy(maSV, maHK);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/dang-ky/:maDK
 * Auth: SinhVien
 */
exports.huyDangKy = async (req, res, next) => {
  try {
    const maSV  = req.user.maSV;
    const maDK  = parseInt(req.params.maDK);

    if (!maDK || isNaN(maDK)) {
      return res.status(400).json({ success: false, message: 'maDK không hợp lệ.' });
    }

    const result = await svc.huyDangKy(maDK, maSV);
    res.json({ success: true, message: result.message });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};