const express = require('express');
const router = express.Router();
const lopHocPhanController = require('../controllers/lopHocPhanController');

router.get('/', lopHocPhanController.getAllLopHocPhan);
router.get('/mon-hoc/:maHP', lopHocPhanController.getLHPByMaHP);
router.post('/check-lich', lopHocPhanController.checkLich);
//TASK 3.3
router.post('/mo-lop', lopHocPhanController.moLopHocPhan);
router.post('/dong-lop', lopHocPhanController.dongLopHocPhan);
router.get('/con-cho', lopHocPhanController.getLHPConCho);

module.exports = router;