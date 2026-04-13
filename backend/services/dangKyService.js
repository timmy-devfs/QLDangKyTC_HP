// backend/services/dangKyService.js
// TV-04  |  Task 1 (POST đăng ký – 4 ràng buộc) & Task 2 (DELETE hủy)
//
// Lưu ý quan trọng:
//   - 4 ràng buộc được kiểm tra TUẦN TỰ trong Node.js (báo lỗi rõ hơn).
//   - Trigger trg_KiemTraDangKyHopLe (INSTEAD OF) là lớp bảo vệ cuối cùng ở DB.
//   - Trigger trg_CapNhatSiSo (AFTER) tự cập nhật SiSoHienTai sau INSERT/DELETE.

const { execQuery } = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// TASK 1 – Kiểm tra 4 điều kiện trước khi đăng ký
// ─────────────────────────────────────────────────────────────────────────────
async function kiemTra4DieuKien(maSV, maLHP) {
  // ── Lấy thông tin lớp học phần + học kỳ + học phần ──────────────
  const rows = await execQuery(
    `SELECT
       lhp.MaLHP, lhp.MaHP, lhp.MaHocKy,
       lhp.ThuHoc, lhp.TietBatDau, lhp.SoTiet,
       lhp.SiSoHienTai, lhp.SiSoToiDa, lhp.TrangThai,
       hk.TrangThai  AS TrangThaiHK,
       hp.TenHP
     FROM LopHocPhan lhp
     JOIN HocKy   hk ON lhp.MaHocKy = hk.MaHocKy
     JOIN HocPhan hp ON lhp.MaHP    = hp.MaHP
     WHERE lhp.MaLHP = :`,
    { maLHP }
  );
  const lhp = rows[0];
  if (!lhp) {
    throw Object.assign(
      new Error('Lớp học phần không tồn tại.'),
      { status: 404 }
    );
  }

  // ── Điều kiện 1: Học kỳ đang mở đăng ký ─────────────────────────
  if (lhp.TrangThaiHK !== 'Đang mở đăng ký') {
    throw Object.assign(
      new Error(`Học kỳ hiện tại chưa mở đăng ký (trạng thái: ${lhp.TrangThaiHK}).`),
      { status: 400 }
    );
  }

  // ── Điều kiện 2: Lớp còn chỗ ────────────────────────────────────
  if (lhp.SiSoHienTai >= lhp.SiSoToiDa) {
    throw Object.assign(
      new Error(`Lớp "${lhp.MaLHP}" đã đầy (${lhp.SiSoToiDa}/${lhp.SiSoToiDa} chỗ).`),
      { status: 400 }
    );
  }

  // ── Điều kiện 3: Không trùng lịch ───────────────────────────────
  const tietKetThuc = lhp.TietBatDau + lhp.SoTiet - 1;
  const trungLich   = await execQuery(
    `SELECT lhp2.MaLHP, hp2.TenHP, lhp2.ThuHoc,
            lhp2.TietBatDau, lhp2.SoTiet
     FROM   DangKyHocPhan dk
     JOIN   LopHocPhan    lhp2 ON dk.MaLHP  = lhp2.MaLHP
     JOIN   HocPhan       hp2  ON lhp2.MaHP = hp2.MaHP
     WHERE  dk.MaSV         = :
       AND  dk.TrangThai     = N'Đã đăng ký'
       AND  lhp2.MaHocKy    = :
       AND  lhp2.ThuHoc     = :
       AND  lhp2.TietBatDau <= :
       AND  (lhp2.TietBatDau + lhp2.SoTiet - 1) >= :`,
    {
      maSV,
      maHK:        lhp.MaHocKy,
      thu:         lhp.ThuHoc,
      tietBatDau:  lhp.TietBatDau,
      tietKetThuc,
    }
  );
  if (trungLich.length > 0) {
    const mon = trungLich[0];
    throw Object.assign(
      new Error(
        `Trùng lịch với môn "${mon.TenHP}" ` +
        `(Thứ ${mon.ThuHoc}, Tiết ${mon.TietBatDau}–${mon.TietBatDau + mon.SoTiet - 1}).`
      ),
      { status: 400 }
    );
  }

  // ── Điều kiện 4: Đã qua môn tiên quyết ─────────────────────────
  // Lấy tất cả HP tiên quyết loại 'b' (bắt buộc phải qua trước)
  // rồi trừ đi những HP đã qua (DiemTK >= 4.0)
  const chuaQuaTQ = await execQuery(
    `SELECT dk2.MaHPTruoc, hp3.TenHP AS TenHPTruoc
     FROM   DieuKienHP dk2
     JOIN   HocPhan    hp3 ON dk2.MaHPTruoc = hp3.MaHP
     WHERE  dk2.MaHP    = :
       AND  dk2.LoaiDK  = 'b'
       AND  dk2.MaHPTruoc NOT IN (
           SELECT lhp3.MaHP
           FROM   DangKyHocPhan dkh
           JOIN   LopHocPhan    lhp3 ON dkh.MaLHP = lhp3.MaLHP
           JOIN   Diem          d    ON dkh.MaDK   = d.MaDK
           WHERE  dkh.MaSV   = :
             AND  d.DiemTK   >= 4.0
             AND  dkh.TrangThai = N'Đã đăng ký'
       )`,
    { maHP: lhp.MaHP, maSV }
  );
  if (chuaQuaTQ.length > 0) {
    const dsMon = chuaQuaTQ.map(r => r.TenHPTruoc).join(', ');
    throw Object.assign(
      new Error(`Chưa hoàn thành học phần tiên quyết: ${dsMon}.`),
      { status: 400 }
    );
  }

  // Trả về thông tin lớp để controller dùng
  return lhp;
}

/**
 * TASK 1 – Đăng ký học phần
 * Trả về { maDK, maLHP, ngayDangKy }
 */
async function dangKy(maSV, maLHP) {
  await kiemTra4DieuKien(maSV, maLHP);

  // INSERT → Trigger INSTEAD OF kiểm tra lần cuối → Trigger AFTER tăng sĩ số
  await execQuery(
    `INSERT INTO DangKyHocPhan (MaSV, MaLHP, NgayDangKy, TrangThai)
     VALUES (:, :, GETDATE(), N'Đã đăng ký')`,
    { maSV, maLHP }
  );

  // Lấy MaDK vừa tạo để trả về client
  const newRows = await execQuery(
    `SELECT TOP 1 MaDK, NgayDangKy
     FROM DangKyHocPhan
     WHERE MaSV = : AND MaLHP = :
     ORDER BY MaDK DESC`,
    { maSV, maLHP }
  );

  return {
    maDK:       newRows[0]?.MaDK,
    maLHP,
    ngayDangKy: newRows[0]?.NgayDangKy,
  };
}

/**
 * Lấy danh sách đăng ký của SV trong 1 HK (cho trang dang-ky.html)
 */
async function getDanhSachDangKy(maSV, maHK) {
  return execQuery(
    `SELECT
       dk.MaDK, dk.MaLHP, dk.NgayDangKy, dk.TrangThai,
       hp.MaHP, hp.TenHP, hp.SoTinChi,
       gv.HoTen AS TenGV,
       lhp.ThuHoc, lhp.TietBatDau, lhp.SoTiet,
       lhp.PhongHoc, lhp.MaHocKy
     FROM   DangKyHocPhan dk
     JOIN   LopHocPhan    lhp ON dk.MaLHP  = lhp.MaLHP
     JOIN   HocPhan       hp  ON lhp.MaHP  = hp.MaHP
     JOIN   GiangVien     gv  ON lhp.MaGV  = gv.MaGV
     WHERE  dk.MaSV     = :
       AND  lhp.MaHocKy = :
       AND  dk.TrangThai = N'Đã đăng ký'
     ORDER  BY hp.TenHP`,
    { maSV, maHK }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK 2 – Hủy đăng ký
// Trigger trg_CapNhatSiSo (AFTER DELETE) tự giảm SiSoHienTai → không cần UPDATE thủ công
// ─────────────────────────────────────────────────────────────────────────────
async function huyDangKy(maDK, maSV) {
  // Kiểm tra đăng ký tồn tại và thuộc về SV này
  const rows = await execQuery(
    `SELECT dk.MaDK, dk.TrangThai, hk.TrangThai AS TrangThaiHK
     FROM   DangKyHocPhan dk
     JOIN   LopHocPhan    lhp ON dk.MaLHP  = lhp.MaLHP
     JOIN   HocKy         hk  ON lhp.MaHocKy = hk.MaHocKy
     WHERE  dk.MaDK = : AND dk.MaSV = :`,
    { maDK, maSV }
  );

  if (!rows.length) {
    throw Object.assign(
      new Error('Không tìm thấy đăng ký này hoặc bạn không có quyền hủy.'),
      { status: 404 }
    );
  }

  const dk = rows[0];

  if (dk.TrangThai !== 'Đã đăng ký') {
    throw Object.assign(
      new Error('Đăng ký này đã được hủy hoặc không thể hủy.'),
      { status: 400 }
    );
  }

  if (dk.TrangThaiHK !== 'Đang mở đăng ký') {
    throw Object.assign(
      new Error('Học kỳ đã đóng đăng ký, không thể hủy.'),
      { status: 400 }
    );
  }

  // Cập nhật TrangThai → Trigger AFTER DELETE KHÔNG chạy vì đây là UPDATE, không phải DELETE
  // → Trigger trg_CapNhatSiSo sẽ chạy khi ta UPDATE TrangThai:
  //   Trigger dùng INSERTED (dòng mới = Đã hủy) và DELETED (dòng cũ = Đã đăng ký)
  //   → Chỉ đếm dòng có TrangThai = 'Đã đăng ký' → đúng logic giảm sĩ số

  // Cách đơn giản nhất: UPDATE TrangThai = 'Đã hủy' → NHƯNG trigger AFTER INSERT/DELETE không cover UPDATE
  // → Dùng cách DELETE thật sự để trigger AFTER DELETE chạy giảm sĩ số
  await execQuery(
    `DELETE FROM DangKyHocPhan WHERE MaDK = :`,
    { maDK }
  );

  // Trigger trg_CapNhatSiSo (AFTER DELETE) đã tự giảm SiSoHienTai
  return { maDK, message: 'Hủy đăng ký thành công. Sĩ số lớp đã được cập nhật.' };
}

module.exports = { dangKy, huyDangKy, getDanhSachDangKy };