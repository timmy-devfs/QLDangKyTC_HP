const express = require('express');
const router = express.Router();
const { execQuery } = require('../config/db');

// Lấy danh sách toàn bộ khoa
router.get('/', async (req, res) => {
    try {
        const data = await execQuery('SELECT MaKhoa, TenKhoa FROM Khoa');
        res.json({ success: true, data });
    } catch (err) {
        console.error('Lỗi lấy danh sách khoa:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy khoa' });
    }
});

module.exports = router;
