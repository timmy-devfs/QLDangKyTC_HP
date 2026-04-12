const db = require('../config/db');

const hocPhanService = {
    getAllHocPhan: async () => {
        const sql = "SELECT * FROM HocPhan";
        return await db.execQuery(sql);
    },

    getDieuKien: async (maHP) => {
        const sql = "SELECT * FROM DieuKienHP WHERE MaHP = ?";
        return await db.execQuery(sql, [maHP]);
    },
        
    deleteHocPhan: async (id) => {
        return await db.execQuery("Delete from HocPhan where MaHP = ?", [id]);
    },

    createHocPhan: async (hocPhanData, dsTienQuyet) => {
        const { MaHP, TenHP, SoTinChi, CoTinhGPA, MaKhoa } = hocPhanData;
        const sqlHP = "INSERT INTO HocPhan (MaHP, TenHP, SoTinChi, CoTinhGPA, MaKhoa) VALUES (?, ?, ?, ?, ?)";
        await db.execQuery(sqlHP, [MaHP, TenHP, SoTinChi, CoTinhGPA, MaKhoa]);

        if (dsTienQuyet && dsTienQuyet.length > 0) {
            for (const tqId of dsTienQuyet) {
        // Mỗi vòng lặp sẽ chèn 1 dòng vào bảng DieuKienHP
                const sqlTQ = "INSERT INTO DieuKienHP (MaHP, MaHPTruoc) VALUES (?, ?)";
                await db.execQuery(sqlTQ, [MaHP, tqId]);
            }
        }
    },

    updateHocPhan: async (id, hocPhanData, dsTienQuyet) => {
        const { TenHP, SoTinChi, CoTinhGPA, MaKhoa } = hocPhanData;
        
        const sqlUpdateHP = "UPDATE HocPhan SET TenHP = ?, SoTinChi = ?, CoTinhGPA = ?, MaKhoa = ? WHERE MaHP = ?";
        await db.execQuery(sqlUpdateHP, [TenHP, SoTinChi, CoTinhGPA, MaKhoa, id]);

        await db.execQuery("DELETE FROM DieuKienHP WHERE MaHP = ?", [id]);
        if (dsTienQuyet && dsTienQuyet.length > 0) {
            const sqlTQ = "INSERT INTO DieuKienHP (MaHP, MaHPTruoc) VALUES ?";
            const values = dsTienQuyet.map(tqId => [MaHP, tqId]);
            await db.execQuery(sqlTQ, [values]);
        }
        return true;
    },
};

module.exports = hocPhanService;