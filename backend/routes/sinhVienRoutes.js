const express = require('express');
const router = express.Router();
const sinhVienController = require('../controllers/sinhVienController');

router.get('/', sinhVienController.getAll);
router.post('/', sinhVienController.create);
router.put('/:id', sinhVienController.update);
router.delete('/:id', sinhVienController.delete);

// QUAN TRỌNG NHẤT:
module.exports = router;
