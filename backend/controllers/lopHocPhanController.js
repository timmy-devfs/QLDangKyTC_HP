const lopHocPhanService = require('../services/lopHocPhanService');

const lopHocPhanController = {
    getAllLopHocPhan: async (req, res) => {
        try {
            const { maHocKy } = req.query; // Lay tu params neu co
            const data = await lopHocPhanService.getAll(maHocKy);
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },
    
    getLHPByMaHP: async (req, res) => {
        try {
            const { maHP } = req.params;
            const data = await lopHocPhanService.getLHPByMaHP(maHP);
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    checkLich: async (req, res) => {
        try {
            const { maGV, maPhong, thu, tietBatDau, tietKetThuc } = req.body;
            if (!maGV || !maPhong || !thu || !tietBatDau || !tietKetThuc) {
                return res.status(400).json({ success: false, message: "Vui long nhap day du thong tin" });
            }
            const trungLich = await lopHocPhanService.checkTrungLich(maGV, maPhong, thu, tietBatDau, tietKetThuc);
            if (trungLich.length > 0) {
                return res.status(400).json({ success: false, message: "CANH BAO: Trung lich!", data: trungLich });
            }
            res.json({ success: true, message: "Lich trong. Co the xep lop." });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    moLopHocPhan: async (req, res) => {
        try {
            // Lấy maLHP và maHK từ Body của Postman
            const { maLHP, maHK } = req.body; 
            
            // Truyền xuống Service (Service sẽ dùng MaHocKy để khớp DB)
            await lopHocPhanService.moLop(maLHP, maHK);
            
            res.json({ 
                success: true, 
                message: "Mở lớp học phần thành công!" 
            });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    dongLopHocPhan: async (req, res) => {
        try {
            const { maLHP } = req.body;
            await lopHocPhanService.dongLop(maLHP);
            
            res.json({ 
                success: true, 
                message: "Đóng lớp học phần thành công!" 
            });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    getLHPConCho: async (req, res) => {
        try {
            // Lấy maHocKy từ Query String trên URL
            const { maHocKy } = req.query; 
            const data = await lopHocPhanService.getLHPConCho(maHocKy);
            
            res.json({ 
                success: true, 
                data: data 
            });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

};

module.exports = lopHocPhanController;