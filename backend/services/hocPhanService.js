const { execQuery } = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// DANH SÁCH HỌC PHẦN (có paging + tìm kiếm)
// ─────────────────────────────────────────────────────────────────────────────
async function getDanhSach({ page = 1, limit = 20, tuKhoa = '', maKhoa = '' }) {
  const offset = (page - 1) * limit;
  const where = buildWhereHP(tuKhoa, maKhoa);

  const data = await execQuery(
    `SELECT hp.MaHP, hp.TenHP, hp.SoTinChi, hp.CoTinhGPA,
            hp.MaKhoa, k.TenKhoa,
            -- Đếm điều kiện tiên quyết
            (SELECT COUNT(*) FROM DieuKienHP WHERE MaHP = hp.MaHP) AS SoTienQuyet
     FROM   HocPhan hp
     LEFT JOIN Khoa k ON hp.MaKhoa = k.MaKhoa
     ${where.sql}
     ORDER  BY hp.MaHP
     LIMIT :limit OFFSET :offset`,
    { ...where.params, offset: Number(offset), limit: Number(limit) }
  );

  const countRow = await execQuery(
    `SELECT COUNT(*) AS Total FROM HocPhan hp ${where.sql}`,
    where.params
  );

  return {
    data,
    total: countRow[0]?.Total ?? 0,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil((countRow[0]?.Total ?? 0) / limit),
  };
}

function buildWhereHP(tuKhoa, maKhoa) {
  const conds = [];
  const params = {};
  if (tuKhoa) {
    conds.push('(hp.TenHP LIKE :tuKhoa OR hp.MaHP LIKE :tuKhoa)');
    params.tuKhoa = `%${tuKhoa}%`;
  }
  if (maKhoa) {
    conds.push('hp.MaKhoa = :maKhoa');
    params.maKhoa = maKhoa;
  }
  return {
    sql: conds.length ? 'WHERE ' + conds.join(' AND ') : '',
    params,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CHI TIẾT 1 HỌC PHẦN + điều kiện tiên quyết
// ─────────────────────────────────────────────────────────────────────────────
async function getChiTiet(maHP) {
  const rows = await execQuery(
    `SELECT hp.MaHP, hp.TenHP, hp.SoTinChi, hp.CoTinhGPA, hp.MaKhoa, k.TenKhoa
     FROM   HocPhan hp
     LEFT JOIN Khoa k ON hp.MaKhoa = k.MaKhoa
     WHERE  hp.MaHP = :maHP`,
    { maHP }
  );
  if (!rows.length) {
    throw Object.assign(new Error('Học phần không tồn tại.'), { status: 404 });
  }

  const tienQuyet = await getDieuKien(maHP);
  return { ...rows[0], dieuKienTienQuyet: tienQuyet };
}

// ─────────────────────────────────────────────────────────────────────────────
// THÊM HỌC PHẦN
// ─────────────────────────────────────────────────────────────────────────────
async function themMoi({ maHP, tenHP, soTinChi, coTinhGPA = 1, maKhoa = null }) {
  if (!maHP || !tenHP || !soTinChi) {
    throw Object.assign(
      new Error('Thiếu thông tin bắt buộc: maHP, tenHP, soTinChi.'),
      { status: 400 }
    );
  }
  if (soTinChi < 1 || soTinChi > 15) {
    throw Object.assign(new Error('Số tín chỉ phải từ 1 đến 15.'), { status: 400 });
  }

  // Kiểm tra MaHP đã tồn tại chưa
  const exist = await execQuery(
    'SELECT 1 FROM HocPhan WHERE MaHP = :maHP', { maHP }
  );
  if (exist.length) {
    throw Object.assign(new Error(`Mã học phần "${maHP}" đã tồn tại.`), { status: 400 });
  }

  await execQuery(
    `INSERT INTO HocPhan (MaHP, TenHP, SoTinChi, CoTinhGPA, MaKhoa)
     VALUES (:maHP, :tenHP, :soTinChi, :coTinhGPA, :maKhoa)`,
    { maHP, tenHP, soTinChi, coTinhGPA, maKhoa }
  );
  return getChiTiet(maHP);
}

// ─────────────────────────────────────────────────────────────────────────────
// SỬA HỌC PHẦN
// ─────────────────────────────────────────────────────────────────────────────
async function capNhat(maHP, { tenHP, soTinChi, coTinhGPA, maKhoa }) {
  const exist = await execQuery(
    'SELECT 1 FROM HocPhan WHERE MaHP = :maHP', { maHP }
  );
  if (!exist.length) {
    throw Object.assign(new Error('Học phần không tồn tại.'), { status: 404 });
  }

  const fields = [];
  const params = { maHP };

  if (tenHP !== undefined) { fields.push('TenHP    = :tenHP'); params.tenHP = tenHP; }
  if (soTinChi !== undefined) {
    if (soTinChi < 1 || soTinChi > 15)
      throw Object.assign(new Error('Số tín chỉ phải từ 1 đến 15.'), { status: 400 });
    fields.push('SoTinChi = :soTinChi');
    params.soTinChi = soTinChi;
  }
  if (coTinhGPA !== undefined) { fields.push('CoTinhGPA = :coTinhGPA'); params.coTinhGPA = coTinhGPA; }
  if (maKhoa !== undefined) { fields.push('MaKhoa   = :maKhoa'); params.maKhoa = maKhoa; }

  if (!fields.length) {
    throw Object.assign(new Error('Không có trường nào để cập nhật.'), { status: 400 });
  }

  await execQuery(
    `UPDATE HocPhan SET ${fields.join(', ')} WHERE MaHP = :maHP`,
    params
  );
  return getChiTiet(maHP);
}

// ─────────────────────────────────────────────────────────────────────────────
// XÓA HỌC PHẦN
// Kiểm tra không có LHP đang dùng (FK constraint)
// ─────────────────────────────────────────────────────────────────────────────
async function xoa(maHP) {
  const exist = await execQuery(
    'SELECT 1 FROM HocPhan WHERE MaHP = :maHP', { maHP }
  );
  if (!exist.length) {
    throw Object.assign(new Error('Học phần không tồn tại.'), { status: 404 });
  }

  // Kiểm tra có LHP đang sử dụng HP này không
  const dangDung = await execQuery(
    `SELECT COUNT(*) AS SoLop FROM LopHocPhan
     WHERE MaHP = :maHP AND TrangThai IN (N'Đang mở', N'Đã đầy')`,
    { maHP }
  );
  if (dangDung[0]?.SoLop > 0) {
    throw Object.assign(
      new Error(`Học phần đang được sử dụng ở ${dangDung[0].SoLop} lớp học phần. Hãy đóng các lớp trước.`),
      { status: 400 }
    );
  }

  // Xóa điều kiện tiên quyết trước (FK)
  await execQuery('DELETE FROM DieuKienHP WHERE MaHP = :maHP OR MaHPTruoc = :maHP', { maHP });
  await execQuery('DELETE FROM ChuongTrinhKhung WHERE MaHP = :maHP', { maHP });
  await execQuery('DELETE FROM HocPhan WHERE MaHP = :maHP', { maHP });

  return { message: `Đã xóa học phần ${maHP}.` };
}

// ─────────────────────────────────────────────────────────────────────────────
// ĐIỀU KIỆN TIÊN QUYẾT
// ─────────────────────────────────────────────────────────────────────────────
async function getDieuKien(maHP) {
  return execQuery(
    `SELECT dk.MaHPTruoc, hp.TenHP AS TenHPTruoc, dk.LoaiDK,
            CASE dk.LoaiDK
              WHEN 'a' THEN N'Học trước'
              WHEN 'b' THEN N'Tiên quyết (bắt buộc)'
              WHEN 'c' THEN N'Song hành'
            END AS TenLoaiDK
     FROM   DieuKienHP dk
     JOIN   HocPhan    hp ON dk.MaHPTruoc = hp.MaHP
     WHERE  dk.MaHP = :maHP`,
    { maHP }
  );
}

/**
 * Kiểm tra vòng tròn tiên quyết bằng Recursive CTE.
 *
 * Ý tưởng: Từ maHPTruoc, đi theo chuỗi tiên quyết ngược lên.
 * Nếu gặp lại maHP trong chuỗi → vòng tròn → không cho thêm.
 *
 * Ví dụ: A → B → C. Nếu thêm C tiên quyết cho A:
 *   CTE bắt đầu từ C, đi lên B, đi lên A → tìm thấy A = maHP → VÒNG TRÒN
 *
 * Thầy hỏi: "Tại sao dùng Recursive CTE?"
 * Trả lời: Vì cấu trúc tiên quyết là đồ thị có hướng, CTE đệ quy
 *          cho phép duyệt toàn bộ các nút tổ tiên mà không cần biết độ sâu.
 */
async function kiemTraVongTron(maHP, maHPTruoc) {
  if (maHP === maHPTruoc) {
    throw Object.assign(
      new Error('Một học phần không thể là tiên quyết của chính nó.'),
      { status: 400 }
    );
  }

  const result = await execQuery(
    `WITH RECURSIVE CTE AS (
       -- Bắt đầu: tất cả HP mà maHPTruoc cần làm tiên quyết
       SELECT MaHP, MaHPTruoc FROM DieuKienHP
       WHERE  MaHP = :maHPTruoc
       UNION ALL
       -- Đệ quy: đi ngược lên theo chuỗi tiên quyết
       SELECT d.MaHP, d.MaHPTruoc
       FROM   DieuKienHP d
       INNER  JOIN CTE c ON d.MaHP = c.MaHPTruoc
     )
     SELECT 1 AS CoVongTron
     FROM   CTE
     WHERE  MaHPTruoc = :maHP`,
    { maHP, maHPTruoc }
  );

  if (result.length > 0) {
    throw Object.assign(
      new Error('Không thể thêm: tạo ra vòng tròn tiên quyết.'),
      { status: 400 }
    );
  }
}

async function themDieuKien(maHP, maHPTruoc, loaiDK = 'b') {
  // Kiểm tra cả 2 HP tồn tại
  const existHP = await execQuery(
    'SELECT 1 FROM HocPhan WHERE MaHP = :maHP', { maHP }
  );
  if (!existHP.length) throw Object.assign(new Error('Học phần không tồn tại.'), { status: 404 });

  const existTQ = await execQuery(
    'SELECT 1 FROM HocPhan WHERE MaHP = :maHPTruoc', { maHPTruoc }
  );
  if (!existTQ.length) throw Object.assign(new Error('Học phần tiên quyết không tồn tại.'), { status: 404 });

  // Kiểm tra đã có chưa
  const dup = await execQuery(
    'SELECT 1 FROM DieuKienHP WHERE MaHP = :maHP AND MaHPTruoc = :maHPTruoc',
    { maHP, maHPTruoc }
  );
  if (dup.length) throw Object.assign(new Error('Điều kiện tiên quyết này đã tồn tại.'), { status: 400 });

  // Kiểm tra vòng tròn TRƯỚC KHI thêm
  await kiemTraVongTron(maHP, maHPTruoc);

  await execQuery(
    `INSERT INTO DieuKienHP (MaHP, MaHPTruoc, LoaiDK)
     VALUES (:maHP, :maHPTruoc, :loaiDK)`,
    { maHP, maHPTruoc, loaiDK }
  );
  return getDieuKien(maHP);
}

async function xoaDieuKien(maHP, maHPTruoc) {
  const result = await execQuery(
    'DELETE FROM DieuKienHP WHERE MaHP = :maHP AND MaHPTruoc = :maHPTruoc',
    { maHP, maHPTruoc }
  );
  //   Dùng affectedRows thay vì SELECT sau DELETE (SELECT luôn trả rỗng sau cùng)
  if (result.affectedRows === 0) {
    throw Object.assign(
      new Error('Điều kiện tiên quyết không tồn tại.'),
      { status: 404 }
    );
  }
  return { message: 'Đã xóa điều kiện tiên quyết.' };
}

module.exports = {
  getDanhSach, getChiTiet, themMoi, capNhat, xoa,
  getDieuKien, themDieuKien, xoaDieuKien,
};