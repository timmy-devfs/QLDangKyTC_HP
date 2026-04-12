const db = require("../config/db");

exports.getDiem = async (req, res) => {
    const { maSV } = req.query;

    try {
        const [rows] = await db.execute(
            "SELECT * FROM Diem WHERE maSV = ?",
            [maSV]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.nhapDiem = async (req, res) => {
    const { maSV, maLopHP, diemGK, diemCK } = req.body;

    const diemTK = diemGK * 0.4 + diemCK * 0.6;

    try {
        await db.execute(
            `UPDATE Diem 
       SET diemGK=?, diemCK=?, diemTK=? 
       WHERE maSV=? AND maLopHP=?`,
            [diemGK, diemCK, diemTK, maSV, maLopHP]
        );

        res.json({ message: "Nhập điểm thành công!" });
    } catch (err) {
        res.status(500).json(err);
    }
}; const db = require("../config/db");

exports.getDiem = async (req, res) => {
    const { maSV } = req.query;

    try {
        const [rows] = await db.execute(
            "SELECT * FROM Diem WHERE maSV = ?",
            [maSV]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.nhapDiem = async (req, res) => {
    const { maSV, maLopHP, diemGK, diemCK } = req.body;

    const diemTK = diemGK * 0.4 + diemCK * 0.6;

    try {
        await db.execute(
            `UPDATE Diem 
       SET diemGK=?, diemCK=?, diemTK=? 
       WHERE maSV=? AND maLopHP=?`,
            [diemGK, diemCK, diemTK, maSV, maLopHP]
        );

        res.json({ message: "Nhập điểm thành công!" });
    } catch (err) {
        res.status(500).json(err);
    }
};