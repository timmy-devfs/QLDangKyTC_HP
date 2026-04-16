// backend/controllers/hocPhanController.js
// TV-03  |  Task 1

const svc = require('../services/hocPhanService');

// GET /api/hoc-phan?page=&limit=&tuKhoa=&maKhoa=
exports.getDanhSach = async (req, res, next) => {
  try {
    const result = await svc.getDanhSach(req.query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

// GET /api/hoc-phan/:maHP
exports.getChiTiet = async (req, res, next) => {
  try {
    const data = await svc.getChiTiet(req.params.maHP);
    res.json({ success: true, data });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

// POST /api/hoc-phan
exports.themMoi = async (req, res, next) => {
  try {
    const data = await svc.themMoi(req.body);
    res.status(201).json({ success: true, message: 'Thêm học phần thành công.', data });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

// PUT /api/hoc-phan/:maHP
exports.capNhat = async (req, res, next) => {
  try {
    const data = await svc.capNhat(req.params.maHP, req.body);
    res.json({ success: true, message: 'Cập nhật học phần thành công.', data });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

// DELETE /api/hoc-phan/:maHP
exports.xoa = async (req, res, next) => {
  try {
    const result = await svc.xoa(req.params.maHP);
    res.json({ success: true, message: result.message });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

// GET /api/hoc-phan/:maHP/dieu-kien
exports.getDieuKien = async (req, res, next) => {
  try {
    const data = await svc.getDieuKien(req.params.maHP);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// POST /api/hoc-phan/:maHP/dieu-kien   body: { maHPTruoc, loaiDK }
exports.themDieuKien = async (req, res, next) => {
  try {
    const { maHPTruoc, loaiDK = 'b' } = req.body;
    if (!maHPTruoc) {
      return res.status(400).json({ success: false, message: 'Thiếu maHPTruoc.' });
    }
    const data = await svc.themDieuKien(req.params.maHP, maHPTruoc, loaiDK);
    res.status(201).json({ success: true, message: 'Thêm điều kiện tiên quyết thành công.', data });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

// DELETE /api/hoc-phan/:maHP/dieu-kien/:maHPTruoc
exports.xoaDieuKien = async (req, res, next) => {
  try {
    await svc.xoaDieuKien(req.params.maHP, req.params.maHPTruoc);
    res.json({ success: true, message: 'Đã xóa điều kiện tiên quyết.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};