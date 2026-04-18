const svc = require('../services/diemService');

/**
 * GET /api/diem?maSV=...&maHK=...
 * SV xem bảng điểm của mình | Admin xem của bất kỳ SV
 */
exports.getBangDiem = async (req, res, next) => {
  try {
    const { maSV: qMaSV, maHK } = req.query;

    // SinhVien chỉ xem điểm của mình
    const maSV = req.user.vaiTro === 'SinhVien'
      ? req.user.maSV
      : (qMaSV || req.user.maSV);

    if (!maSV) {
      return res.status(400).json({ success: false, message: 'Thiếu maSV.' });
    }

    const data = await svc.getBangDiem(maSV, maHK || null);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

/**
 * PUT /api/diem/:maDK
 * Body: { diemQT, diemThi }
 * Auth: GiangVien hoặc Admin
 */
exports.nhapDiem = async (req, res, next) => {
  try {
    const maDK   = parseInt(req.params.maDK);
    const { diemQT, diemThi } = req.body;

    if (isNaN(maDK)) {
      return res.status(400).json({ success: false, message: 'maDK không hợp lệ.' });
    }
    if (diemQT === undefined || diemThi === undefined) {
      return res.status(400).json({ success: false, message: 'Thiếu diemQT hoặc diemThi.' });
    }

    const result = await svc.nhapDiem(maDK, Number(diemQT), Number(diemThi));
    res.json({
      success: true,
      message: 'Nhập điểm thành công. DiemTK và XepLoai được MySQL tự tính qua Generated Column.',
      data:    result,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * GET /api/diem/lop-gv?maHK=...
 * GV lấy danh sách lớp phụ trách
 */
exports.getLopCuaGV = async (req, res, next) => {
  try {
    const maGV  = req.user.maGV;
    const { maHK } = req.query;
    if (!maGV) return res.status(403).json({ success: false, message: 'Tài khoản không có mã giảng viên.' });
    const data = await svc.getLopCuaGV(maGV, maHK || null);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

/**
 * GET /api/diem/sinh-vien-lop/:maLHP
 * GV lấy danh sách SV trong lớp mình phụ trách + điểm hiện tại
 */
exports.getDanhSachSVTrongLop = async (req, res, next) => {
  try {
    const { maLHP } = req.params;
    const data = await svc.getDanhSachSVTrongLop(maLHP);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

/**
 * GET /api/diem/gpa/:maSV
 * Auth: SinhVien (chính mình), Admin, GiangVien
 */
exports.getGPA = async (req, res, next) => {
  try {
    const maSV = req.user.vaiTro === 'SinhVien'
      ? req.user.maSV
      : req.params.maSV;

    if (!maSV) return res.status(400).json({ success: false, message: 'Thiếu maSV.' });

    const data = await svc.getGPA(maSV);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};