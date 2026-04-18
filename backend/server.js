/**
 * server.js - Diem khoi chay chinh
 * TV-02 phu trach
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');

const hocPhanRoutes = require('./routes/hocPhanRoutes');
const lopHocPhanRoutes = require('./routes/lopHocPhanRoutes');
const { connectDB } = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(require('path').join(__dirname, '../frontend')));

/* Routes */
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/sinh-vien', require('./routes/sinhVienRoutes'));
app.use('/api/giang-vien', require('./routes/giangVienRoutes'));
app.use('/api/hoc-phan', require('./routes/hocPhanRoutes'));
app.use('/api/lop-hoc-phan', require('./routes/lopHocPhanRoutes'));
app.use('/api/hoc-ky', require('./routes/hocKyRoutes'));
app.use('/api/dang-ky', require('./routes/dangKyRoutes'));
app.use('/api/diem', require('./routes/diemRoutes'));
app.use('/api/bao-cao', require('./routes/baoCaoRoutes'));
app.use('/api/khoa', require('./routes/khoaRoutes'));
app.use('/api/nganh', require('./routes/nganhRoutes'));

/* Error handler */
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    const server = app.listen(PORT, () =>
        console.log(`[SERVER] Dang chay tai http://localhost:${PORT}`)
    );

    // Bat loi EADDRINUSE (cong da bi chiem) thay vi crash
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`[SERVER] LOI: Cong ${PORT} dang bi chiem boi tien trinh khac.`);
            console.error(`[SERVER] Hay chay lenh sau de giai phong cong: npx kill-port ${PORT}`);
            console.error(`[SERVER] Hoac: netstat -ano | findstr :${PORT}  -->  taskkill /PID <pid> /F`);
            process.exit(1);
        } else {
            throw err;
        }
    });
}).catch(err => { console.error('[SERVER] Loi ket noi DB:', err); process.exit(1); });