// backend/services/diemService.js
// TV-04  |  Task 3 (GET+PUT điểm) & Task 4 (GPA)
//
// QUAN TRỌNG:
//   DiemTK  = DiemQT * 0.4 + DiemThi * 0.6  → COMPUTED COLUMN trong SQL Server
//   XepLoai = A/B/C/D/F                      → COMPUTED COLUMN trong SQL Server
//   Node.js CHỈ INSERT/UPDATE DiemQT và DiemThi – KHÔNG được tính trong JS

const { execQuery } = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// TASK 3 – Xem bảng điểm của 1 SV theo học kỳ
// ─────────────────────────────────────────────────────────────────────────────
async function getBangDiem(maSV, maHK = null) {
  const whereHK = maHK ? 'AND hk.MaHocKy = :' : '';
  return execQuery(
    `SELECT
       v.MaSV, v.TenSV, v.MaHP, v.TenHP, v.SoTinChi,
       v.TenHocKy, v.MaLHP,
       v.DiemQT, v.DiemThi,
       v.DiemTK,          -- Computed Column, SQL Server tự tính
       v.XepLoai,         -- Computed Column, SQL Server tự tính
       v.CoTinhGPA
     FROM V_BangDiemSinhVien v
     JOIN HocKy hk ON v.TenHocKy = hk.TenHocKy
     WHERE v.MaSV = : ${whereHK}
     ORDER BY v.TenHocKy, v.TenHP`,
    { maSV, ...(maHK && { maHK }) }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK 3 – GV nhập điểm (DiemQT + DiemThi)
// SQL Server tự tính DiemTK và XepLoai qua Computed Column
// ─────────────────────────────────────────────────────────────────────────────
async function nhapDiem(maDK, diemQT, diemThi) {
  // Validate range
  if (diemQT < 0 || diemQT > 10 || diemThi < 0 || diemThi > 10) {
    throw Object.assign(
      new Error('Điểm phải trong khoảng 0 – 10.'),
      { status: 400 }
    );
  }

  // Kiểm tra MaDK tồn tại
  const check = await execQuery(
    `SELECT MaDK FROM DangKyHocPhan WHERE MaDK = : AND TrangThai = N'Đã đăng ký'`,
    { maDK }
  );
  if (!check.length) {
    throw Object.assign(
      new Error('Mã đăng ký không tồn tại hoặc đã hủy.'),
      { status: 404 }
    );
  }

  // UPSERT – chỉ INSERT/UPDATE DiemQT và DiemThi
  // DiemTK, XepLoai do SQL Server tự tính (PERSISTED COMPUTED COLUMN)
  await execQuery(
    `IF EXISTS (SELECT 1 FROM Diem WHERE MaDK = :)
       UPDATE Diem
       SET    DiemQT  = :,
              DiemThi = :
       WHERE  MaDK = :
     ELSE
       INSERT INTO Diem (MaDK, DiemQT, DiemThi)
       VALUES (:, :, :)`,
    { maDK, dq: diemQT, dt: diemThi }
  );

  // Trả về bản ghi vừa cập nhật (có DiemTK, XepLoai đã tính)
  const result = await execQuery(
    `SELECT MaDiem, MaDK, DiemQT, DiemThi, DiemTK, XepLoai
     FROM   Diem WHERE MaDK = :`,
    { maDK }
  );
  return result[0];
}

/**
 * Lấy danh sách lớp GV phụ trách + danh sách SV + điểm (cho trang nhap-diem.html)
 */
async function getLopCuaGV(maGV, maHK = null) {
  const whereHK = maHK ? 'AND lhp.MaHocKy = :' : '';
  return execQuery(
    `SELECT
       lhp.MaLHP, hp.MaHP, hp.TenHP, hp.SoTinChi,
       hk.TenHocKy, lhp.ThuHoc, lhp.TietBatDau, lhp.SoTiet,
       lhp.SiSoHienTai
     FROM   LopHocPhan lhp
     JOIN   HocPhan   hp  ON lhp.MaHP    = hp.MaHP
     JOIN   HocKy     hk  ON lhp.MaHocKy = hk.MaHocKy
     WHERE  lhp.MaGV = : ${whereHK}
     ORDER  BY hk.TenHocKy, hp.TenHP`,
    { maGV, ...(maHK && { maHK }) }
  );
}

async function getDanhSachSVTrongLop(maLHP) {
  return execQuery(
    `SELECT
       dk.MaDK, sv.MaSV, sv.HoTen,
       d.DiemQT, d.DiemThi,
       d.DiemTK,     -- Computed Column
       d.XepLoai     -- Computed Column
     FROM   DangKyHocPhan dk
     JOIN   SinhVien      sv ON dk.MaSV  = sv.MaSV
     LEFT JOIN Diem       d  ON dk.MaDK  = d.MaDK
     WHERE  dk.MaLHP    = :
       AND  dk.TrangThai = N'Đã đăng ký'
     ORDER  BY sv.HoTen`,
    { maLHP }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK 4 – GPA theo học kỳ + GPA tích lũy
// Gọi View đã có sẵn trong schema.sql (TV-01 tạo)
// ─────────────────────────────────────────────────────────────────────────────
async function getGPA(maSV) {
  // GPA từng học kỳ (chỉ tính môn CoTinhGPA = 1)
  const gpaHocKy = await execQuery(
    `SELECT MaSV, TenSV, TenHocKy, TongTCTinhGPA, GPA_HocKy
     FROM   V_GPA_HocKy
     WHERE  MaSV = :
     ORDER  BY TenHocKy`,
    { maSV }
  );

  // GPA tích lũy toàn khóa
  const rowsTichLuy = await execQuery(
    `SELECT MaSV, HoTen, TongTCTichLuy, GPA_TichLuy
     FROM   V_GPA_TichLuy
     WHERE  MaSV = :`,
    { maSV }
  );

  return {
    gpaHocKy,
    gpaTichLuy: rowsTichLuy[0] ?? { TongTCTichLuy: 0, GPA_TichLuy: null },
  };
}

module.exports = {
  getBangDiem,
  nhapDiem,
  getLopCuaGV,
  getDanhSachSVTrongLop,
  getGPA,
};