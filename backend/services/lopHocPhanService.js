const db = require('../config/db');
const { getLHPConCho } = require('../controllers/hocPhanController');

const lopHocPhanService = {
    //Lay danh sach lop theo MaHocKy
   getAll: async (maHocKy) => {
        let sql = `
            SELECT lhp.*, gv.HoTen AS TenGiangVien, hp.TenHP, (lhp.SiSoToiDa - lhp.SiSoHienTai) AS SoChoTrong
            FROM LopHocPhan lhp
            LEFT JOIN GiangVien gv ON lhp.MaGV = gv.MaGV
            LEFT JOIN HocPhan hp ON lhp.MaHP = hp.MaHP
        `;
        let params = [];
        
        if (maHocKy) {
            sql += " WHERE lhp.MaHocKy = ?";
            params.push(maHocKy);
        }
        
        return await db.execQuery(sql, params);
    },
    
    // Lay danh sach lop theo MaHP
    getLHPByMaHP: async (maHP) => {
        const sql = `
            SELECT lhp.*, gv.HoTen AS TenGiangVien 
            FROM LopHocPhan lhp
            LEFT JOIN GiangVien gv ON lhp.MaGV = gv.MaGV
            WHERE lhp.MaHP = ?
        `;
        return await db.execQuery(sql, [maHP]);
    },

    createLHP: async (data) => {
        const { MaLHP, MaHP, MaGV, PhongHoc, ThuHoc, TietBatDau, SoTiet, SiSoToiDa, MaHocKy } = data;
        const sql = `
            INSERT INTO LopHocPhan (MaLHP, MaHP, MaGV, PhongHoc, ThuHoc, TietBatDau, SoTiet, SiSoToiDa, SiSoHienTai, MaHocKy) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        `;
        return await db.execQuery(sql, [MaLHP, MaHP, MaGV, PhongHoc, ThuHoc, TietBatDau, SoTiet, SiSoToiDa, MaHocKy]);
    },

    //Lay lop con cho (Dung SiSoToiDa va SiSoHienTai tu anh image_6d3f21.png)
    getLHPConCho: async (maHocKy) => {
        const sql = `
            SELECT * FROM LopHocPhan 
            WHERE MaHocKy = ? 
            AND SiSoHienTai < SiSoToiDa
        `;
        return await db.execQuery(sql, [maHocKy]);
    },

    //Kiem tra trung lich (Dung PhongHoc, ThuHoc, SoTiet tu anh image_6d3f21.png)
    checkTrungLich: async (maGV, phongHoc, thuHoc, tietBD, soTiet) => {
        // Tinh tiet ket thuc de so sanh
        const tietKT = parseInt(tietBD) + parseInt(soTiet) - 1;

        const sql = `
            SELECT MaLHP FROM LopHocPhan 
            WHERE (MaGV = ? OR PhongHoc = ?) 
            AND ThuHoc = ? 
            AND NOT ( (TietBatDau + SoTiet - 1) < ? OR TietBatDau > ? )
        `;
        return await db.execQuery(sql, [maGV, phongHoc, thuHoc, tietBD, tietKT]);
    },

    moLop: async (MaLHP, MaHocKy) => {
        const sql = "CALL sp_MoLopHocPhan(?, ?)";
        return await db.execQuery(sql, [MaLHP, MaHocKy]);
    },

    dongLop: async (MaLHP) => {
return await db.execSP('sp_DongLopHocPhan', { p_MaLHP: MaLHP });    },

    getLHPConChoProc: async (MaHocKy) => {
        const sql = "CALL sp_LayLopConCho(?)";
        const result = await db.execQuery(sql, [MaHocKy]);
        return result[0]; 
    },

    getLHPDangKy: async (maHK) => {
        // SQL JOIN 3 bảng: LopHocPhan, HocPhan, GiangVien
        // Yêu cầu trả đúng tên field: MaLHP, TenHP, MaHP, SoTinChi, TenGV, HocVi, ThuHoc, TietBatDau, SoTiet, PhongHoc, SiSoHienTai, SiSoToiDa
        const sql = `
            SELECT 
                l.MaLHP, 
                h.TenHP, 
                h.MaHP,
                h.SoTinChi,
                g.HoTen AS TenGV, 
                g.HocVi,
                l.ThuHoc,
                l.TietBatDau,
                l.SoTiet,
                l.PhongHoc, 
                l.SiSoHienTai,
                l.SiSoToiDa
            FROM LopHocPhan l
            JOIN HocPhan h ON l.MaHP = h.MaHP
            JOIN GiangVien g ON l.MaGV = g.MaGV
            WHERE l.MaHocKy = ? 
              AND l.SiSoHienTai < l.SiSoToiDa
        `;
        return await db.execQuery(sql, [maHK]);
    },

};

module.exports = lopHocPhanService;