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
    }
};

module.exports = hocPhanService;