// backend/routes/diemRoutes.js
// TV-04  |  Task 3 & Task 4
// Mount trong server.js: app.use("/api/diem", require("./routes/diemRoutes"));

const router = require('express').Router();
const ctrl   = require('../controllers/diemController');
const { verifyToken, checkRole } = require('../middleware/auth');

// ── QUAN TRỌNG: Route cụ thể phải đặt TRƯỚC route có param ──
// Nếu /gpa/:maSV đặt sau /:maDK thì Express match "gpa" như là maDK

// Task 4 – GPA
router.get('/gpa/:maSV', verifyToken, ctrl.getGPA);

// Task 3 – Xem bảng điểm (SV tự xem hoặc Admin)
router.get('/',          verifyToken, ctrl.getBangDiem);

// Task 3 – GV nhập điểm
router.put('/:maDK',     verifyToken, checkRole('Admin', 'GiangVien'), ctrl.nhapDiem);

// Task 3 – GV lấy danh sách lớp phụ trách
router.get('/lop-gv',    verifyToken, checkRole('Admin', 'GiangVien'), ctrl.getLopCuaGV);

// Task 3 – GV lấy SV trong lớp + điểm
router.get('/sinh-vien-lop/:maLHP', verifyToken, checkRole('Admin', 'GiangVien'), ctrl.getDanhSachSVTrongLop);

module.exports = router;