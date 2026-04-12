const express = require('express');
const router = express.Router();
const hocPhanController = require('../controllers/hocPhanController');

router.get('/', hocPhanController.getAllHocPhan);
router.get('/:id/dieu-kien', hocPhanController.getDieuKien);
router.delete('/:id', hocPhanController.deleteHocPhan); 

module.exports = router;