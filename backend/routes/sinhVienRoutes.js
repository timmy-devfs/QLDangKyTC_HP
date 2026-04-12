const express = require('express');
const router = express.Router();
const sinhVienController = require('../controllers/sinhVienController');

router.get('/', sinhVienController.getAll);
router.post('/', sinhVienController.create);

// QUAN TRỌNG NHẤT:
module.exports = router;
