const express = require('express');
const router = express.Router();
const giangVienController = require('../controllers/giangVienController');

router.get('/', giangVienController.getAll);
router.post('/', giangVienController.create);
router.put('/:id', giangVienController.update);
router.delete('/:id', giangVienController.delete);

module.exports = router;
