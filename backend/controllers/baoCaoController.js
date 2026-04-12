// backend/controllers/baoCaoController.js
// TV-05 | Task 5
const svc = require("../services/baoCaoService");

exports.thongKeTongQuan = async (req, res, next) => {
  try {
    const data = await svc.getThongKeTongQuan();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.thongKeLop = async (req, res, next) => {
  try {
    const { maHK } = req.query;
    const data = await svc.getThongKeLop(maHK || null);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.exportExcel = async (req, res, next) => {
  try {
    const { maSV } = req.query;   // tuỳ chọn – Admin có thể lấy 1 SV hoặc tất cả
    await svc.exportBangDiemExcel(res, maSV || null);
  } catch (err) { next(err); }
};
