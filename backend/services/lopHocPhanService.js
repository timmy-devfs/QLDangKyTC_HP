// backend/services/lopHocPhanService.js
// TV-03  |  Task 2 (CRUD LHP + kiểm tra trùng lịch) & Task 6 (endpoint còn chỗ)
//
// LOGIC TRÙNG LỊCH – thầy SẼ hỏi:
//   Khoảng [a,b] và [c,d] GIAO NHAU khi: a <= d VÀ c <= b
//   (Tương đương KHÔNG giao: b < c HOẶC d < a)
//   Ví dụ: lớp A tiết 3-5 (ThuHoc=2), lớp B tiết 4-6 (ThuHoc=2)
//   → giao vì 3<=6 VÀ 4<=5

const { execQuery, execSP } = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// KIỂM TRA TRÙNG LỊCH GIẢNG VIÊN VÀ PHÒNG
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kiểm tra GV có bị trùng lịch trong HK này không.
 * @param maLHP  null khi tạo mới, có giá trị khi UPDATE (loại trừ chính lớp đó)
 */
async function kiemTraTrungLichGV(maGV, thuHoc, tietBatDau, soTiet, maHocKy, maLHP = null) {
  const tietKetThuc = tietBatDau + soTiet - 1;

  const trung = await execQuery(
    `SELECT lhp.MaLHP, hp.TenHP
     FROM   LopHocPhan lhp
     JOIN   HocPhan    hp ON lhp.MaHP = hp.MaHP
     WHERE  lhp.MaGV     = :maGV
       AND  lhp.MaHocKy  = :maHocKy
       AND  lhp.ThuHoc   = :thuHoc
       AND  lhp.TietBatDau <= :tietKetThuc
       AND  (lhp.TietBatDau + lhp.SoTiet - 1) >= :tietBatDau
       AND  lhp.TrangThai IN (N'Đang mở', N'Đã đầy')
       AND  (:maLHP IS NULL OR lhp.MaLHP <> :maLHP)`,
    { maGV, maHocKy, thuHoc, tietBatDau, tietKetThuc, maLHP }
  );

  if (trung.length > 0) {
    throw Object.assign(
      new Error(
        `Giảng viên đã có lớp "${trung[0].TenHP}" trong khung giờ này ` +
        `(Thứ ${thuHoc}, Tiết ${tietBatDau}–${tietKetThuc}).`
      ),
      { status: 400 }
    );
  }
}

/**
 * Kiểm tra phòng học có bị trùng lịch không.
 */
async function kiemTraTrungLichPhong(phongHoc, thuHoc, tietBatDau, soTiet, maHocKy, maLHP = null) {
  if (!phongHoc) return;   // Phòng không bắt buộc
  const tietKetThuc = tietBatDau + soTiet - 1;

  const trung = await execQuery(
    `SELECT lhp.MaLHP, hp.TenHP
     FROM   LopHocPhan lhp
     JOIN   HocPhan    hp ON lhp.MaHP = hp.MaHP
     WHERE  lhp.PhongHoc  = :phongHoc
       AND  lhp.MaHocKy   = :maHocKy
       AND  lhp.ThuHoc    = :thuHoc
       AND  lhp.TietBatDau <= :tietKetThuc
       AND  (lhp.TietBatDau + lhp.SoTiet - 1) >= :tietBatDau
       AND  lhp.TrangThai IN (N'Đang mở', N'Đã đầy')
       AND  (:maLHP IS NULL OR lhp.MaLHP <> :maLHP)`,
    { phongHoc, maHocKy, thuHoc, tietBatDau, tietKetThuc, maLHP }
  );

  if (trung.length > 0) {
    throw Object.assign(
      new Error(
        `Phòng "${phongHoc}" đã được sử dụng bởi lớp "${trung[0].TenHP}" ` +
        `(Thứ ${thuHoc}, Tiết ${tietBatDau}–${tietKetThuc}).`
      ),
      { status: 400 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DANH SÁCH LỚP HỌC PHẦN (Admin quản lý)
// ─────────────────────────────────────────────────────────────────────────────
async function getDanhSach({ page = 1, limit = 20, maHK = '', maHP = '', trangThai = '' }) {
  const offset = (page - 1) * limit;
  const conds  = [];
  const params = { offset: Number(offset), limit: Number(limit) };

  if (maHK)      { conds.push('lhp.MaHocKy  = :maHK');      params.maHK      = maHK;      }
  if (maHP)      { conds.push('lhp.MaHP      = :maHP');      params.maHP      = maHP;      }
  if (trangThai) { conds.push('lhp.TrangThai = :trangThai'); params.trangThai = trangThai; }

  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

  const data = await execQuery(
    `SELECT
       lhp.MaLHP, lhp.MaHP, lhp.MaGV, lhp.MaHocKy,
       hp.TenHP, hp.SoTinChi,
       gv.HoTen AS TenGV, gv.HocVi,
       hk.TenHocKy,
       lhp.PhongHoc, lhp.ThuHoc, lhp.TietBatDau, lhp.SoTiet,
       (lhp.TietBatDau + lhp.SoTiet - 1) AS TietKetThuc,
       lhp.SiSoToiDa, lhp.SiSoHienTai,
       (lhp.SiSoToiDa - lhp.SiSoHienTai) AS SoChoConLai,
       lhp.TrangThai
     FROM   LopHocPhan lhp
     JOIN   HocPhan   hp  ON lhp.MaHP    = hp.MaHP
     JOIN   GiangVien gv  ON lhp.MaGV   = gv.MaGV
     LEFT JOIN HocKy  hk  ON lhp.MaHocKy = hk.MaHocKy
     ${where}
     ORDER  BY lhp.MaHocKy DESC, hp.TenHP
     LIMIT :limit OFFSET :offset`,
    params
  );

  const countRow = await execQuery(
    `SELECT COUNT(*) AS Total FROM LopHocPhan lhp ${where}`,
    params
  );

  return {
    data,
    total:      countRow[0]?.Total ?? 0,
    page:       Number(page),
    limit:      Number(limit),
    totalPages: Math.ceil((countRow[0]?.Total ?? 0) / limit),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// THÊM LỚP HỌC PHẦN
// ─────────────────────────────────────────────────────────────────────────────
async function themMoi({
  maLHP, maHP, maGV, maHocKy,
  phongHoc, thuHoc, tietBatDau, soTiet,
  siSoToiDa = 50,
}) {
  // Validate bắt buộc
  if (!maLHP || !maHP || !maGV || !thuHoc || !tietBatDau || !soTiet) {
    throw Object.assign(
      new Error('Thiếu thông tin: maLHP, maHP, maGV, thuHoc, tietBatDau, soTiet.'),
      { status: 400 }
    );
  }
  if (thuHoc < 2 || thuHoc > 7) {
    throw Object.assign(new Error('ThuHoc phải từ 2 (Thứ 2) đến 7 (Thứ 7).'), { status: 400 });
  }
  if (tietBatDau < 1 || tietBatDau > 12) {
    throw Object.assign(new Error('TietBatDau phải từ 1 đến 12.'), { status: 400 });
  }

  // Kiểm tra MaLHP chưa tồn tại
  const exist = await execQuery('SELECT 1 FROM LopHocPhan WHERE MaLHP = :maLHP', { maLHP });
  if (exist.length) {
    throw Object.assign(new Error(`Mã lớp "${maLHP}" đã tồn tại.`), { status: 400 });
  }

  // Kiểm tra HP và GV tồn tại
  const [hp] = await execQuery('SELECT 1 FROM HocPhan WHERE MaHP = :maHP', { maHP });
  if (!hp) throw Object.assign(new Error('Học phần không tồn tại.'), { status: 404 });

  const [gv] = await execQuery('SELECT 1 FROM GiangVien WHERE MaGV = :maGV', { maGV });
  if (!gv) throw Object.assign(new Error('Giảng viên không tồn tại.'), { status: 404 });

  // Kiểm tra trùng lịch GV và phòng (nếu có HK)
  if (maHocKy) {
    await kiemTraTrungLichGV(maGV, thuHoc, tietBatDau, soTiet, maHocKy);
    await kiemTraTrungLichPhong(phongHoc, thuHoc, tietBatDau, soTiet, maHocKy);
  }

  await execQuery(
    `INSERT INTO LopHocPhan
       (MaLHP, MaHP, MaGV, MaHocKy, PhongHoc, ThuHoc, TietBatDau, SoTiet, SiSoToiDa, SiSoHienTai, TrangThai)
     VALUES
       (:maLHP, :maHP, :maGV, :maHocKy, :phongHoc, :thuHoc, :tietBatDau, :soTiet, :siSoToiDa, 0, N'Đang mở')`,
    { maLHP, maHP, maGV, maHocKy: maHocKy || null, phongHoc: phongHoc || null, thuHoc, tietBatDau, soTiet, siSoToiDa }
  );

  return getChiTiet(maLHP);
}

// ─────────────────────────────────────────────────────────────────────────────
// CHI TIẾT 1 LỚP
// ─────────────────────────────────────────────────────────────────────────────
async function getChiTiet(maLHP) {
  const rows = await execQuery(
    `SELECT
       lhp.MaLHP, lhp.MaHP, lhp.MaGV, lhp.MaHocKy,
       hp.TenHP, hp.SoTinChi,
       gv.HoTen AS TenGV, gv.HocVi,
       hk.TenHocKy,
       lhp.PhongHoc, lhp.ThuHoc, lhp.TietBatDau, lhp.SoTiet,
       lhp.SiSoToiDa, lhp.SiSoHienTai,
       (lhp.SiSoToiDa - lhp.SiSoHienTai) AS SoChoConLai,
       lhp.TrangThai
     FROM   LopHocPhan lhp
     JOIN   HocPhan   hp ON lhp.MaHP    = hp.MaHP
     JOIN   GiangVien gv ON lhp.MaGV   = gv.MaGV
     LEFT JOIN HocKy  hk ON lhp.MaHocKy = hk.MaHocKy
     WHERE  lhp.MaLHP = :maLHP`,
    { maLHP }
  );
  if (!rows.length) {
    throw Object.assign(new Error('Lớp học phần không tồn tại.'), { status: 404 });
  }
  return rows[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// SỬA THÔNG TIN LỚP HP
// ─────────────────────────────────────────────────────────────────────────────
async function capNhat(maLHP, body) {
  const lhp = await getChiTiet(maLHP);

  // Giá trị sau cập nhật (dùng giá trị cũ nếu body không có)
  const thuHoc     = body.thuHoc     ?? lhp.ThuHoc;
  const tietBatDau = body.tietBatDau ?? lhp.TietBatDau;
  const soTiet     = body.soTiet     ?? lhp.SoTiet;
  const maGV       = body.maGV       ?? lhp.MaGV;
  const phongHoc   = body.phongHoc   !== undefined ? body.phongHoc : lhp.PhongHoc;
  const maHocKy    = body.maHocKy    ?? lhp.MaHocKy;
  const siSoToiDa  = body.siSoToiDa  ?? lhp.SiSoToiDa;

  // Kiểm tra lại trùng lịch (loại trừ chính lớp này)
  if (maHocKy) {
    await kiemTraTrungLichGV(maGV, thuHoc, tietBatDau, soTiet, maHocKy, maLHP);
    await kiemTraTrungLichPhong(phongHoc, thuHoc, tietBatDau, soTiet, maHocKy, maLHP);
  }

  await execQuery(
    `UPDATE LopHocPhan
     SET    MaGV       = :maGV,
            MaHocKy   = :maHocKy,
            PhongHoc  = :phongHoc,
            ThuHoc    = :thuHoc,
            TietBatDau = :tietBatDau,
            SoTiet    = :soTiet,
            SiSoToiDa = :siSoToiDa
     WHERE  MaLHP = :maLHP`,
    { maGV, maHocKy, phongHoc, thuHoc, tietBatDau, soTiet, siSoToiDa, maLHP }
  );

  return getChiTiet(maLHP);
}

// ─────────────────────────────────────────────────────────────────────────────
// XÓA LỚP HỌC PHẦN
// ─────────────────────────────────────────────────────────────────────────────
async function xoa(maLHP) {
  const lhp = await getChiTiet(maLHP);

  if (lhp.SiSoHienTai > 0) {
    throw Object.assign(
      new Error(`Lớp có ${lhp.SiSoHienTai} sinh viên đang đăng ký. Không thể xóa.`),
      { status: 400 }
    );
  }

  await execQuery('DELETE FROM LopHocPhan WHERE MaLHP = :maLHP', { maLHP });
  return { message: `Đã xóa lớp học phần ${maLHP}.` };
}

// ─────────────────────────────────────────────────────────────────────────────
// MỞ / ĐÓNG LỚP qua Stored Procedure (Task 3)
// ─────────────────────────────────────────────────────────────────────────────
async function moLop(maLHP, maHK) {
  if (!maLHP || !maHK) {
    throw Object.assign(new Error('Thiếu maLHP hoặc maHK.'), { status: 400 });
  }
  const result = await execSP('sp_MoLopHocPhan', { maLHP, maHK });
  return result[0];
}

async function dongLop(maLHP) {
  if (!maLHP) throw Object.assign(new Error('Thiếu maLHP.'), { status: 400 });
  const result = await execSP('sp_DongLopHocPhan', { maLHP });
  return result[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK 6 – LỚP CÒN CHỖ CHO SINH VIÊN (gọi SP)
// Endpoint: GET /api/lop-hoc-phan/dang-ky?maHK=HK1_2526
// ─────────────────────────────────────────────────────────────────────────────
async function getLopConCho(maHK) {
  if (!maHK) throw Object.assign(new Error('Thiếu maHK.'), { status: 400 });
  return execQuery(
    `SELECT
       lhp.MaLHP, hp.MaHP, hp.TenHP, hp.SoTinChi,
       lhp.ThuHoc, lhp.TietBatDau, lhp.SoTiet,
       lhp.SiSoToiDa, lhp.SiSoHienTai,
       gv.HoTen AS TenGV,
       (lhp.SiSoToiDa - lhp.SiSoHienTai) AS SoChoConLai
     FROM   LopHocPhan lhp
     JOIN   HocPhan    hp ON lhp.MaHP = hp.MaHP
     JOIN   GiangVien  gv ON lhp.MaGV = gv.MaGV
     WHERE  lhp.MaHocKy = :maHK
       AND  lhp.TrangThai = N'Đang mở'
       AND  lhp.SiSoHienTai < lhp.SiSoToiDa
     ORDER  BY hp.TenHP`,
    { maHK }
  );
}

module.exports = {
  getDanhSach, getChiTiet, themMoi, capNhat, xoa,
  moLop, dongLop,
  getLopConCho,
};