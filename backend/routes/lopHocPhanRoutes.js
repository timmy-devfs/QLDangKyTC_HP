// backend/routes/lopHocPhanRoutes.js
// TV-03  |  Task 2 & Task 6
// Mount trong server.js: app.use("/api/lop-hoc-phan", require("./routes/lopHocPhanRoutes"));

const router = require('express').Router();
const ctrl   = require('../controllers/lopHocPhanController');
const { verifyToken, checkRole } = require('../middleware/auth');

// ── QUAN TRỌNG: Route cụ thể trước route có :param ───────────
// Nếu /dang-ky đặt SAU /:maLHP thì Express match "dang-ky" như là maLHP

// Task 6 – SV xem lớp còn chỗ (tất cả đã đăng nhập đều dùng được)
router.get('/dang-ky',         verifyToken,                     ctrl.getLopConCho);

// Task 2 – CRUD Lớp HP (Admin)
router.get   ('/',             verifyToken,                     ctrl.getDanhSach);
router.post  ('/',             verifyToken, checkRole('Admin'), ctrl.themMoi);
router.get   ('/:maLHP',       verifyToken,                     ctrl.getChiTiet);
router.put   ('/:maLHP',       verifyToken, checkRole('Admin'), ctrl.capNhat);
router.delete('/:maLHP',       verifyToken, checkRole('Admin'), ctrl.xoa);

// Task 3 – Mở / Đóng lớp qua SP
router.post  ('/:maLHP/mo',    verifyToken, checkRole('Admin'), ctrl.moLop);
router.post  ('/:maLHP/dong',  verifyToken, checkRole('Admin'), ctrl.dongLop);

module.exports = router;