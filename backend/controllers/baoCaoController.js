const db = require('../config/db');
const ExcelJS = require('exceljs');

// GET /api/bao-cao/thong-ke?maHK=HK1_2425
const thongKe = async (req, res) => {
    const { maHK } = req.query;
    try {
        // MySQL execSP: truyền mảng giá trị [val1, val2]
        const dsDangKy = await db.execSP('sp_ThongKeDangKy', maHK ? [maHK] : [null]);
        const dsKetQua = await db.execSP('sp_BaoCaoKetQuaHocTap', maHK ? [maHK] : [null]);

        const tongSVDangKy = dsDangKy.reduce((s, r) => s + (r.SoSVDangKy || 0), 0);
        const tongLop = dsDangKy.length;
        const lopDayPhanTram = dsDangKy.filter(r => r.TiLeLapDay >= 90).length;

        return res.status(200).json({
            success: true,
            data: {
                tongHop: { tongSVDangKy, tongLop, lopDayPhanTram },
                chiTietDangKy: dsDangKy,
                chiTietKetQua: dsKetQua,
            },
        });
    } catch (err) {
        console.error('[baoCaoController.thongKe]', err);
        return res.status(500).json({ success: false, message: 'Lỗi khi lấy dữ liệu báo cáo.' });
    }
};

// GET /api/bao-cao/export?maHK=HK1_2425
const exportExcel = async (req, res) => {
    const { maHK } = req.query;
    try {
        // MySQL: ? thay @maHK
        const rows = await db.execQuery(
            `SELECT v.MaSV, v.TenSV, v.MaHP, v.TenHP, v.SoTinChi,
                    v.TenHocKy, v.DiemQT, v.DiemThi, v.DiemTK, v.XepLoai
             FROM V_BangDiemSinhVien v
             JOIN LopHocPhan lhp ON v.MaLHP = lhp.MaLHP
             WHERE lhp.MaHocKy = ?
             ORDER BY v.MaSV, v.TenHP`,
            [maHK || '']
        );

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Bang Diem');

        worksheet.columns = [
            { header: 'Ma SV', key: 'MaSV', width: 14 },
            { header: 'Ho Ten', key: 'TenSV', width: 30 },
            { header: 'Ma HP', key: 'MaHP', width: 12 },
            { header: 'Ten Hoc Phan', key: 'TenHP', width: 40 },
            { header: 'Tin Chi', key: 'SoTinChi', width: 10 },
            { header: 'Hoc Ky', key: 'TenHocKy', width: 20 },
            { header: 'Diem QT', key: 'DiemQT', width: 10 },
            { header: 'Diem Thi', key: 'DiemThi', width: 10 },
            { header: 'Diem TK', key: 'DiemTK', width: 10 },
            { header: 'Xep Loai', key: 'XepLoai', width: 10 },
        ];

        worksheet.getRow(1).eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        const colorMap = { A: 'FF00B050', B: 'FF70AD47', C: 'FFFFC000', D: 'FFED7D31', F: 'FFFF0000' };
        rows.forEach(row => {
            const dr = worksheet.addRow(row);
            if (row.XepLoai && colorMap[row.XepLoai]) {
                dr.getCell('XepLoai').font = { bold: true, color: { argb: colorMap[row.XepLoai] } };
            }
            ['DiemQT', 'DiemThi', 'DiemTK', 'XepLoai', 'SoTinChi'].forEach(col => {
                dr.getCell(col).alignment = { horizontal: 'center' };
            });
        });

        const fileName = `BangDiem_${maHK || 'ToanBo'}.xlsx`;
        res.setHeader('Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('[baoCaoController.exportExcel]', err);
        return res.status(500).json({ success: false, message: 'Lỗi khi xuất Excel.' });
    }
};

module.exports = { thongKe, exportExcel };