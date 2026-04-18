-- ============================================================
-- FILE: database/views.sql
-- DBMS: MySQL 8.0+
-- Mô tả: 3 View dùng cho báo cáo điểm và GPA
--
-- THỨ TỰ CHẠY:
--   1. schema.sql   → tạo bảng + indexes
--   2. views.sql    → tạo views (file này)
--   3. triggers.sql → tạo triggers
--   4. stored_procs.sql → tạo stored procedures
--   5. seed_data.sql    → nạp dữ liệu mẫu
--
-- DEPENDENCY:
--   V_GPA_HocKy và V_GPA_TichLuy phụ thuộc V_BangDiemSinhVien
--   → phải tạo V_BangDiemSinhVien TRƯỚC
--
-- DANH SÁCH VIEW:
--   1. V_BangDiemSinhVien  – Bảng điểm đầy đủ: SV – HP – HK – Điểm
--   2. V_GPA_HocKy         – GPA từng học kỳ (chỉ môn CoTinhGPA = 1)
--   3. V_GPA_TichLuy       – GPA tích lũy toàn khóa
-- ============================================================

USE QLDangKyHP;

-- ============================================================
-- VIEW 1: V_BangDiemSinhVien
-- Mục đích : Bảng điểm đầy đủ — join SV, HP, HK, Diem
-- Dùng trong: getBangDiem(), GPA views, báo cáo điểm
-- Lưu ý    : Bao gồm cả TrangThai 'Đã đăng ký' lẫn 'Hoàn thành'
--            để không mất lịch sử điểm các HK đã kết thúc
-- ============================================================

CREATE OR REPLACE VIEW V_BangDiemSinhVien AS
SELECT
    sv.MaSV,
    sv.HoTen        AS TenSV,
    hp.MaHP,
    hp.TenHP,
    hp.SoTinChi,
    hp.CoTinhGPA,
    hk.MaHocKy,
    hk.TenHocKy,
    lhp.MaLHP,
    dk.MaDK,
    dk.TrangThai    AS TrangThaiDK,
    d.DiemQT,
    d.DiemThi,
    d.DiemTK,       -- GENERATED ALWAYS STORED (DiemQT*0.4 + DiemThi*0.6)
    d.XepLoai       -- GENERATED ALWAYS STORED (A/B/C/D/F)
FROM DangKyHocPhan dk
JOIN SinhVien    sv  ON dk.MaSV     = sv.MaSV
JOIN LopHocPhan  lhp ON dk.MaLHP   = lhp.MaLHP
JOIN HocPhan     hp  ON lhp.MaHP   = hp.MaHP
JOIN HocKy       hk  ON lhp.MaHocKy = hk.MaHocKy
LEFT JOIN Diem   d   ON dk.MaDK    = d.MaDK
-- Bao gồm cả lịch sử đã hoàn thành (không chỉ 'Đã đăng ký')
WHERE dk.TrangThai IN ('Đã đăng ký', 'Hoàn thành');

-- ============================================================
-- VIEW 2: V_GPA_HocKy
-- Mục đích : GPA từng học kỳ của mỗi sinh viên
-- Công thức: GPA_HocKy = SUM(DiemTK * SoTinChi) / SUM(SoTinChi)
--            Chỉ tính môn CoTinhGPA = 1 (bỏ môn đánh dấu *)
--            NULLIF đảm bảo không chia cho 0 khi chưa có điểm
-- Phụ thuộc: V_BangDiemSinhVien (phải tạo trước)
-- ============================================================

CREATE OR REPLACE VIEW V_GPA_HocKy AS
SELECT
    v.MaSV,
    v.TenSV,
    v.MaHocKy,
    v.TenHocKy,
    -- Tổng tín chỉ đã có điểm và được tính GPA
    SUM(
        CASE WHEN v.CoTinhGPA = 1 AND v.DiemTK IS NOT NULL
             THEN v.SoTinChi ELSE 0
        END
    ) AS TongTCTinhGPA,
    -- GPA từng HK = điểm trung bình có trọng số (thang 10)
    ROUND(
        SUM(
            CASE WHEN v.CoTinhGPA = 1 AND v.DiemTK IS NOT NULL
                 THEN v.DiemTK * v.SoTinChi ELSE 0
            END
        )
        / NULLIF(
            SUM(
                CASE WHEN v.CoTinhGPA = 1 AND v.DiemTK IS NOT NULL
                     THEN v.SoTinChi ELSE 0
                END
            ),
        0),
    2) AS GPA_HocKy
FROM V_BangDiemSinhVien v
GROUP BY v.MaSV, v.TenSV, v.MaHocKy, v.TenHocKy;

-- ============================================================
-- VIEW 3: V_GPA_TichLuy
-- Mục đích : GPA tích lũy toàn khóa của mỗi sinh viên
-- Công thức: GPA_TichLuy = SUM(DiemTK * SoTinChi) / SUM(SoTinChi)
--            Tính tất cả HK, bao gồm cả 'Đã đăng ký' + 'Hoàn thành'
-- Lưu ý    : LEFT JOIN từ SinhVien đảm bảo SV chưa học cũng xuất hiện
--            với GPA_TichLuy = NULL
-- ============================================================

CREATE OR REPLACE VIEW V_GPA_TichLuy AS
SELECT
    sv.MaSV,
    sv.HoTen,
    -- Tổng tín chỉ tích lũy đến hiện tại
    SUM(
        CASE WHEN hp.CoTinhGPA = 1 AND d.DiemTK IS NOT NULL
             THEN hp.SoTinChi ELSE 0
        END
    ) AS TongTCTichLuy,
    -- GPA tích lũy (thang 10)
    ROUND(
        SUM(
            CASE WHEN hp.CoTinhGPA = 1 AND d.DiemTK IS NOT NULL
                 THEN d.DiemTK * hp.SoTinChi ELSE 0
            END
        )
        / NULLIF(
            SUM(
                CASE WHEN hp.CoTinhGPA = 1 AND d.DiemTK IS NOT NULL
                     THEN hp.SoTinChi ELSE 0
                END
            ),
        0),
    2) AS GPA_TichLuy
FROM SinhVien sv
LEFT JOIN DangKyHocPhan dk ON sv.MaSV = dk.MaSV
                           AND dk.TrangThai IN ('Đã đăng ký', 'Hoàn thành')
LEFT JOIN LopHocPhan lhp   ON dk.MaLHP  = lhp.MaLHP
LEFT JOIN HocPhan    hp    ON lhp.MaHP   = hp.MaHP
LEFT JOIN Diem       d     ON dk.MaDK    = d.MaDK
GROUP BY sv.MaSV, sv.HoTen;
