// backend/controllers/lopHocPhanController.js
// TV-03  |  Task 2 & Task 6

const svc = require('../services/lopHocPhanService');

const handleErr = (err, res, next) => {
  if (err.status) return res.status(err.status).json({ success: false, message: err.message });
  // Lỗi THROW từ SP SQL Server
  if (err.message?.includes('trùng lịch') || err.message?.includes('đã có lớp')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
};

// GET /api/lop-hoc-phan?page=&limit=&maHK=&maHP=&trangThai=
exports.getDanhSach = async (req, res, next) => {
  try {
    const result = await svc.getDanhSach(req.query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

// GET /api/lop-hoc-phan/dang-ky?maHK=   ← TASK 6 – dành cho SV
// ROUTE NÀY ĐẶT TRƯỚC /:maLHP trong routes để không bị match nhầm
exports.getLopConCho = async (req, res, next) => {
  try {
    const { maHK } = req.query;
    if (!maHK) return res.status(400).json({ success: false, message: 'Thiếu maHK.' });
    const data = await svc.getLopConCho(maHK);
    res.json({ success: true, data });
  } catch (err) { handleErr(err, res, next); }
};

// GET /api/lop-hoc-phan/:maLHP
exports.getChiTiet = async (req, res, next) => {
  try {
    const data = await svc.getChiTiet(req.params.maLHP);
    res.json({ success: true, data });
  } catch (err) { handleErr(err, res, next); }
};

// POST /api/lop-hoc-phan
exports.themMoi = async (req, res, next) => {
  try {
    const data = await svc.themMoi(req.body);
    res.status(201).json({ success: true, message: 'Tạo lớp học phần thành công.', data });
  } catch (err) { handleErr(err, res, next); }
};

// PUT /api/lop-hoc-phan/:maLHP
exports.capNhat = async (req, res, next) => {
  try {
    const data = await svc.capNhat(req.params.maLHP, req.body);
    res.json({ success: true, message: 'Cập nhật lớp học phần thành công.', data });
  } catch (err) { handleErr(err, res, next); }
};

// DELETE /api/lop-hoc-phan/:maLHP
exports.xoa = async (req, res, next) => {
  try {
    const result = await svc.xoa(req.params.maLHP);
    res.json({ success: true, message: result.message });
  } catch (err) { handleErr(err, res, next); }
};

// POST /api/lop-hoc-phan/:maLHP/mo   body: { maHK }
exports.moLop = async (req, res, next) => {
  try {
    const { maHK } = req.body;
    if (!maHK) return res.status(400).json({ success: false, message: 'Thiếu maHK.' });
    const result = await svc.moLop(req.params.maLHP, maHK);
    res.json({ success: true, message: result?.ThongBao || 'Mở lớp thành công.', data: result });
  } catch (err) { handleErr(err, res, next); }
};

// POST /api/lop-hoc-phan/:maLHP/dong
exports.dongLop = async (req, res, next) => {
  try {
    const result = await svc.dongLop(req.params.maLHP);
    res.json({ success: true, message: result?.ThongBao || 'Đóng lớp thành công.', data: result });
  } catch (err) { handleErr(err, res, next); }
};