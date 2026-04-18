const express = require('express');
const router = express.Router();
const { execQuery } = require('../config/db');

// Lấy danh sách toàn bộ ngành
router.get('/', async (req, res) => {
    try {
        const data = await execQuery('SELECT MaNganh, TenNganh, MaKhoa FROM Nganh');
        res.json({ success: true, data });
    } catch (err) {
        console.error('Lỗi lấy danh sách ngành:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy ngành' });
    }
});

module.exports = router;
