// backend/routes/hocPhanRoutes.js
// TV-03  |  Task 1
// Mount trong server.js: app.use("/api/hoc-phan", require("./routes/hocPhanRoutes"));

const router = require('express').Router();
const ctrl   = require('../controllers/hocPhanController');
const { verifyToken, checkRole } = require('../middleware/auth');

// ── CRUD Học phần ─────────────────────────────────────────────
// Mọi người đều có thể xem, Admin mới được sửa/xóa
router.get   ('/',      verifyToken,                             ctrl.getDanhSach);
router.get   ('/:maHP', verifyToken,                             ctrl.getChiTiet);
router.post  ('/',      verifyToken, checkRole('Admin'),         ctrl.themMoi);
router.put   ('/:maHP', verifyToken, checkRole('Admin'),         ctrl.capNhat);
router.delete('/:maHP', verifyToken, checkRole('Admin'),         ctrl.xoa);

// ── Điều kiện tiên quyết ─────────────────────────────────────
// QUAN TRỌNG: route /dieu-kien phải đặt TRƯỚC /:maHP để không bị match nhầm
router.get   ('/:maHP/dieu-kien',              verifyToken, ctrl.getDieuKien);
router.post  ('/:maHP/dieu-kien',              verifyToken, checkRole('Admin'), ctrl.themDieuKien);
router.delete('/:maHP/dieu-kien/:maHPTruoc',   verifyToken, checkRole('Admin'), ctrl.xoaDieuKien);

module.exports = router;