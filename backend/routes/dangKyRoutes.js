// backend/routes/dangKyRoutes.js
// TV-04  |  Task 1 & Task 2
// Mount trong server.js: app.use("/api/dang-ky", require("./routes/dangKyRoutes"));

const router  = require('express').Router();
const ctrl    = require('../controllers/dangKyController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Chỉ SinhVien mới được đăng ký / hủy
router.post  ('/',       verifyToken, checkRole('SinhVien'), ctrl.dangKy);
router.get   ('/',       verifyToken, checkRole('SinhVien'), ctrl.getDanhSach);
router.delete('/:maDK', verifyToken, checkRole('SinhVien'), ctrl.huyDangKy);

module.exports = router;