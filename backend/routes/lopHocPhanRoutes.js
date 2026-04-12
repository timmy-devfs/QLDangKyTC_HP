const express = require('express');
const router = express.Router();
const lopHocPhanController = require('../controllers/lopHocPhanController');

router.get('/', lopHocPhanController.getAllLopHocPhan);
router.get('/mon-hoc/:maHP', lopHocPhanController.getLHPByMaHP);
router.post('/check-lich', lopHocPhanController.checkLich);

// TASK 3.3
router.post('/mo-lop', lopHocPhanController.moLopHocPhan);
router.post('/dong-lop', lopHocPhanController.dongLopHocPhan);
router.get('/con-cho', lopHocPhanController.getLHPConCho);

// TASK 3.5
router.post('/add', lopHocPhanController.createLHP);

// TASK 3.6: API endpoint lay lop hoc phan con cho theo MaHocKy (dung de dang ky)
router.get('/dang-ky', lopHocPhanController.getLHPDangKy); 

module.exports = router;