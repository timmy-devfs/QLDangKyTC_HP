const hocPhanService = require('../services/hocPhanService');

const hocPhanController = {
    getAllHocPhan: async (req, res) => {
        try {
            const data = await hocPhanService.getAllHocPhan();
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    getDieuKien: async (req, res) => {
        try {
            const { id } = req.params;
            const data = await hocPhanService.getDieuKien(id);
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    deleteHocPhan: async (req, res) => {
        try {
            const { id } = req.params;
            await hocPhanService.deleteHocPhan(id);
            res.json({ success: true, message: "Xóa học phần thành công" });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

};

module.exports = hocPhanController;