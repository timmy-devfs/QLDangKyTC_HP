const db = require("../config/db");

exports.dangKyHocPhan = async (req, res) => {
    const { maSV, maLopHP } = req.body;

    try {
        // 1. Kiểm tra đã đăng ký chưa
        const [exist] = await db.execute(
            "SELECT * FROM DangKyHocPhan WHERE maSV = ? AND maLopHP = ?",
            [maSV, maLopHP]
        );

        if (exist.length > 0) {
            return res.status(400).json({ message: "Đã đăng ký rồi!" });
        }

        // 2. Kiểm tra sĩ số
        const [lop] = await db.execute(
            "SELECT siSoToiDa, siSoHienTai FROM LopHocPhan WHERE maLopHP = ?",
            [maLopHP]
        );

        if (lop.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy lớp học phần" });
        }

        if (lop[0].siSoHienTai >= lop[0].siSoToiDa) {
            return res.status(400).json({ message: "Lớp đã đầy!" });
        }

        // 3. Insert
        await db.execute(
            "INSERT INTO DangKyHocPhan(maSV, maLopHP) VALUES (?, ?)",
            [maSV, maLopHP]
        );

        res.json({ message: "Đăng ký thành công!" });
    } catch (err) {
        res.status(500).json(err);
    }
};

// task 4.2 DElETE (huy dang ki + trigger)
exports.huyDangKy = async (req, res) => {
    const { maSV, maLopHP } = req.body;

    try {
        await db.execute(
            "DELETE FROM DangKyHocPhan WHERE maSV = ? AND maLopHP = ?",
            [maSV, maLopHP]
        );

        res.json({ message: "Hủy đăng ký thành công!" });
    } catch (err) {
        res.status(500).json(err);
    }
};