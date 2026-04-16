// backend/services/baoCaoService.js
// TV-05 | Task 5
const { execQuery } = require("../config/db");
const ExcelJS = require("exceljs");

/**
 * Thống kê tổng quan cho Dashboard Admin
 */
async function getThongKeTongQuan() {
  const rows = await execQuery(`
    SELECT
      (SELECT COUNT(*) FROM SinhVien  WHERE TrangThai = N'Đang học')      AS TongSV,
      (SELECT COUNT(*) FROM GiangVien)                                     AS TongGV,
      (SELECT COUNT(*) FROM HocPhan)                                       AS TongHP,
      (SELECT COUNT(*) FROM LopHocPhan WHERE TrangThai = N'Đang mở')      AS LopDangMo,
      (SELECT COUNT(*) FROM DangKyHocPhan WHERE TrangThai = N'Đã đăng ký') AS TongDangKy
  `);
  return rows[0];
}

/**
 * Thống kê đăng ký từng lớp học phần + tỉ lệ đạt/rớt
 */
async function getThongKeLop(maHK = null) {
  const whereHK = maHK ? "WHERE lhp.MaHocKy = :maHK" : "";
  return execQuery(`
    SELECT
      lhp.MaLHP,
      hp.TenHP,
      hp.SoTinChi,
      gv.HoTen       AS TenGV,
      lhp.SiSoToiDa,
      lhp.SiSoHienTai,
      COUNT(dk.MaDK) AS SoDangKy,
      COUNT(CASE WHEN d.XepLoai IN ('A','B','C','D') THEN 1 END) AS SoDat,
      COUNT(CASE WHEN d.XepLoai = 'F'                THEN 1 END) AS SoRot,
      COUNT(CASE WHEN d.XepLoai IS NULL               THEN 1 END) AS ChuaCoDiem
    FROM LopHocPhan lhp
    JOIN HocPhan   hp  ON lhp.MaHP  = hp.MaHP
    JOIN GiangVien gv  ON lhp.MaGV  = gv.MaGV
    LEFT JOIN DangKyHocPhan dk ON lhp.MaLHP = dk.MaLHP AND dk.TrangThai = N'Đã đăng ký'
    LEFT JOIN Diem          d  ON dk.MaDK   = d.MaDK
    ${whereHK}
    GROUP BY lhp.MaLHP, hp.TenHP, hp.SoTinChi, gv.HoTen, lhp.SiSoToiDa, lhp.SiSoHienTai
    ORDER BY hp.TenHP
  `, maHK ? { maHK } : {});
}

/**
 * Xuất Excel bảng điểm toàn bộ (Admin) hoặc 1 SV cụ thể
 * Ghi thẳng vào response stream
 */
async function exportBangDiemExcel(res, maSV = null) {
  const whereClause = maSV ? "WHERE MaSV = :maSV" : "";
  const params      = maSV ? { maSV } : {};

  const bangDiem = await execQuery(
    `SELECT MaSV, TenSV, MaHP, TenHP, SoTinChi, TenHocKy,
            DiemQT, DiemThi, DiemTK, XepLoai
     FROM V_BangDiemSinhVien
     ${whereClause}
     ORDER BY MaSV, TenHocKy, MaHP`,
    params
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator  = "QLDangKyHP – UTH";
  workbook.created  = new Date();

  const sheet = workbook.addWorksheet("Bảng điểm", {
    pageSetup: { paperSize: 9, orientation: "landscape" },
  });

  // Header
  sheet.columns = [
    { header: "Mã SV",      key: "MaSV",     width: 13 },
    { header: "Họ tên SV",  key: "TenSV",    width: 26 },
    { header: "Mã HP",      key: "MaHP",     width: 11 },
    { header: "Tên học phần", key: "TenHP",  width: 34 },
    { header: "TC",         key: "SoTinChi", width: 5  },
    { header: "Học kỳ",    key: "TenHocKy", width: 18 },
    { header: "Điểm QT",   key: "DiemQT",   width: 9  },
    { header: "Điểm Thi",  key: "DiemThi",  width: 9  },
    { header: "Điểm TK",   key: "DiemTK",   width: 9  },
    { header: "Xếp loại",  key: "XepLoai",  width: 9  },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font      = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  headerRow.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E79" } };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height    = 22;

  // Data rows
  bangDiem.forEach((row) => {
    const dataRow = sheet.addRow(row);
    dataRow.height = 18;

    // Tô màu cột XepLoai
    const xepLoaiCell = dataRow.getCell("XepLoai");
    xepLoaiCell.alignment = { horizontal: "center" };
    if (row.XepLoai === "A")      xepLoaiCell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFE2F0D9" } };
    else if (row.XepLoai === "B") xepLoaiCell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFD6EAF8" } };
    else if (row.XepLoai === "F") xepLoaiCell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFFFE0E0" } };

    // Căn giữa các cột số
    ["SoTinChi","DiemQT","DiemThi","DiemTK"].forEach((k) => {
      dataRow.getCell(k).alignment = { horizontal: "center" };
    });
  });

  // Freeze header
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  // Stream về client
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=BangDiem_${maSV || "TatCa"}_${Date.now()}.xlsx`
  );
  await workbook.xlsx.write(res);
  res.end();
}

module.exports = { getThongKeTongQuan, getThongKeLop, exportBangDiemExcel };
