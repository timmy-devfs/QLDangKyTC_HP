const express = require('express');
const router = express.Router();
const hocKyController = require('../controllers/hocKyController');

router.get('/', hocKyController.getAll);
router.post('/', hocKyController.create);
router.put('/:id', hocKyController.toggleStatus);

module.exports = router;