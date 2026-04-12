const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authCfg = require('../config/auth');
const db = require('../config/db');

/**
 * POST /api/auth/login
 * Xác thực người dùng và tạo JWT
 */
const login = async (req, res) => {
    const { tenDangNhap, matKhau } = req.body;

    // 1. Kiểm tra đầu vào
    if (!tenDangNhap || !matKhau) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.'
        });
    }

    try {
        // 2. Truy vấn tài khoản (Chỉ lấy tài khoản đang hoạt động)
        const rows = await db.execQuery(
            `SELECT MaTK, TenDangNhap, MatKhau, VaiTro, MaSV, MaGV 
             FROM TaiKhoan 
             WHERE TenDangNhap = ? AND TrangThai = 1`,
            [tenDangNhap]
        );

        // Bảo mật: Không thông báo cụ thể là sai ID hay Pass để tránh dò quét
        if (!rows || rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Thông tin đăng nhập không chính xác.'
            });
        }

        const user = rows[0];

        // 3. So sánh mật khẩu bằng Bcrypt HOẶC dummy hash từ seed_data (dev only)
        const isRealHash = user.MatKhau.startsWith('$2');
        const isMatch = isRealHash
            ? await bcrypt.compare(matKhau, user.MatKhau)
            : (user.MatKhau === 'hashed_' + matKhau);   // fallback cho seed data

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Thông tin đăng nhập không chính xác.'
            });
        }

        // 4. Tạo JWT Payload (Chứa thông tin định danh cơ bản)
        const payload = {
            maTK: user.MaTK,
            vaiTro: user.VaiTro,
            maSV: user.MaSV,
            maGV: user.MaGV
        };

        // authCfg.sign() đã bọc sẵn secret + expiresIn từ .env
        // KHÔNG dùng jwt.sign(payload, authCfg.secret, { expiresIn: authCfg.expiresIn })
        // vì authCfg không export property 'expiresIn', sẽ gây lỗi 500
        const token = authCfg.sign(payload);

        // 5. Trả về kết quả thành công
        return res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công.',
            token,
            data: {
                vaiTro: user.VaiTro,
                maSV: user.MaSV,
                maGV: user.MaGV
            }
        });

    } catch (err) {
        console.error('[authController.login] Error:', err.message);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ hệ thống.' });
    }
};

/**
 * POST /api/auth/logout
 */
const logout = (req, res) => {
    // JWT là stateless, logout chủ yếu xử lý ở Client (xóa token)
    return res.status(200).json({ success: true, message: 'Đăng xuất thành công.' });
};

/**
 * GET /api/auth/me
 * Lấy thông tin chi tiết của người dùng hiện tại từ Token
 */
const getMe = async (req, res) => {
    try {
        const { maTK, vaiTro, maSV, maGV } = req.user;
        let profileInfo = null;

        // Truy vấn thông tin chi tiết dựa trên vai trò
        if (vaiTro === 'SinhVien' && maSV) {
            const result = await db.execQuery(
                `SELECT MaSV, HoTen, Email, MaNganh FROM SinhVien WHERE MaSV = ?`,
                [maSV]
            );
            profileInfo = result[0];
        }
        else if (vaiTro === 'GiangVien' && maGV) {
            const result = await db.execQuery(
                `SELECT MaGV, HoTen, Email, MaKhoa FROM GiangVien WHERE MaGV = ?`,
                [maGV]
            );
            profileInfo = result[0];
        }
        else if (vaiTro === 'Admin') {
            profileInfo = { hoTen: 'Quản trị viên hệ thống' };
        }

        return res.status(200).json({
            success: true,
            data: {
                maTK,
                vaiTro,
                profile: profileInfo
            }
        });
    } catch (err) {
        console.error('[authController.getMe] Error:', err.message);
        return res.status(500).json({ success: false, message: 'Không thể lấy thông tin người dùng.' });
    }
};

module.exports = { login, logout, getMe };