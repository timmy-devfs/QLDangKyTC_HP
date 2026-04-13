// backend/routes/baoCaoRoutes.js
// TV-05 | Task 5
// Mount trong server.js: app.use("/api/bao-cao", require("./routes/baoCaoRoutes"));

const router = require("express").Router();
const ctrl   = require("../controllers/baoCaoController");
const { verifyToken, checkRole } = require("../middleware/auth");

// Chỉ Admin mới được xem báo cáo & xuất Excel
router.get("/thong-ke",  verifyToken, checkRole("Admin"), ctrl.thongKeTongQuan);
router.get("/lop",       verifyToken, checkRole("Admin"), ctrl.thongKeLop);
router.get("/export",    verifyToken, checkRole("Admin"), ctrl.exportExcel);

module.exports = router;