-- ============================================================
-- FILE: database/stored_procs.sql  (phần TV-03)
-- TV-03  |  Task 3
-- DBMS:  SQL Server
-- Mô tả: 3 Stored Procedure quản lý Lớp Học Phần
--
-- DANH SÁCH SP:
--   1. sp_MoLopHocPhan   – Mở lớp cho một học kỳ
--   2. sp_DongLopHocPhan – Đóng lớp
--   3. sp_LayLopConCho   – Lấy lớp còn chỗ theo HK (TV-04 dùng)
--
-- TẠI SAO DÙNG STORED PROCEDURE?
--   - SP được compile và cache → truy vấn nhanh hơn query text thuần
--   - Logic tập trung ở DB → dễ bảo trì, tránh lặp code ở nhiều controller
--   - Tránh SQL Injection tốt hơn (tham số hóa hoàn toàn)
--   - SET NOCOUNT ON: tắt thông báo "N row(s) affected" → giảm traffic
-- ============================================================

USE QLDangKyHP;
GO

-- ============================================================
-- SP 1: sp_MoLopHocPhan
-- Mục đích : Gán học kỳ cho lớp và đổi TrangThai → 'Đang mở'
-- Tham số  : @maLHP CHAR(20), @maHK CHAR(10)
-- Trả về   : Bảng { KetQua, ThongBao }
-- Lỗi      : THROW 50001 nếu LHP không tồn tại
--            THROW 50002 nếu HK không hợp lệ để mở lớp
-- ============================================================
CREATE OR ALTER PROCEDURE sp_MoLopHocPhan
    @maLHP  CHAR(20),
    @maHK   CHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra lớp học phần tồn tại
    IF NOT EXISTS (SELECT 1 FROM LopHocPhan WHERE MaLHP = @maLHP)
        THROW 50001, N'Lớp học phần không tồn tại.', 1;

    -- Kiểm tra học kỳ hợp lệ để mở lớp
    -- (Chỉ mở lớp khi HK ở trạng thái 'Chưa mở' hoặc 'Đang mở đăng ký')
    IF NOT EXISTS (
        SELECT 1 FROM HocKy
        WHERE  MaHocKy  = @maHK
          AND  TrangThai IN (N'Chưa mở', N'Đang mở đăng ký')
    )
        THROW 50002, N'Học kỳ không ở trạng thái có thể mở lớp.', 1;

    -- Kiểm tra lớp chưa bị gán vào HK khác đang hoạt động
    IF EXISTS (
        SELECT 1 FROM LopHocPhan
        WHERE  MaLHP    = @maLHP
          AND  MaHocKy IS NOT NULL
          AND  MaHocKy  <> @maHK
          AND  TrangThai IN (N'Đang mở', N'Đã đầy')
    )
        THROW 50004, N'Lớp này đang mở ở một học kỳ khác, không thể thay đổi.', 1;

    -- Cập nhật: gán HK và đổi trạng thái
    UPDATE LopHocPhan
    SET    TrangThai = N'Đang mở',
           MaHocKy  = @maHK
    WHERE  MaLHP = @maLHP;

    SELECT 0             AS KetQua,
           N'Mở lớp thành công.' AS ThongBao;
END
GO

-- ============================================================
-- SP 2: sp_DongLopHocPhan
-- Mục đích : Đóng lớp học phần (TrangThai → 'Đã đóng')
-- Tham số  : @maLHP CHAR(20)
-- Trả về   : Bảng { KetQua, ThongBao }
-- Lỗi      : THROW 50003 nếu lớp không tồn tại hoặc đã đóng
-- ============================================================
CREATE OR ALTER PROCEDURE sp_DongLopHocPhan
    @maLHP CHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    -- Đóng lớp – chỉ đóng được khi đang ở trạng thái 'Đang mở' hoặc 'Đã đầy'
    UPDATE LopHocPhan
    SET    TrangThai = N'Đã đóng'
    WHERE  MaLHP     = @maLHP
      AND  TrangThai IN (N'Đang mở', N'Đã đầy');

    -- @@ROWCOUNT = 0 nghĩa là không có dòng nào được cập nhật
    -- → lớp không tồn tại HOẶC đã ở trạng thái không thể đóng
    IF @@ROWCOUNT = 0
        THROW 50003,
              N'Không thể đóng lớp (lớp không tồn tại hoặc đã đóng).',
              1;

    SELECT 0                    AS KetQua,
           N'Đóng lớp thành công.' AS ThongBao;
END
GO

-- ============================================================
-- SP 3: sp_LayLopConCho  ← TV-04 cần để build trang đăng ký SV
-- Mục đích : Trả danh sách lớp còn chỗ trong một HK
-- Tham số  : @maHK CHAR(10)
-- Trả về   : Thông tin lớp kèm SoChoConLai, sắp xếp theo TenHP
-- Điều kiện: TrangThai = 'Đang mở' VÀ SiSoHienTai < SiSoToiDa
-- ============================================================
CREATE OR ALTER PROCEDURE sp_LayLopConCho
    @maHK CHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        lhp.MaLHP,
        hp.MaHP,
        hp.TenHP,
        hp.SoTinChi,
        hp.CoTinhGPA,
        gv.HoTen       AS TenGV,
        gv.HocVi,
        gv.Email        AS EmailGV,
        lhp.PhongHoc,
        lhp.ThuHoc,
        lhp.TietBatDau,
        lhp.SoTiet,
        (lhp.TietBatDau + lhp.SoTiet - 1) AS TietKetThuc,
        lhp.SiSoToiDa,
        lhp.SiSoHienTai,
        (lhp.SiSoToiDa - lhp.SiSoHienTai) AS SoChoConLai,
        lhp.TrangThai
    FROM   LopHocPhan lhp
    JOIN   HocPhan    hp  ON lhp.MaHP = hp.MaHP
    JOIN   GiangVien  gv  ON lhp.MaGV = gv.MaGV
    WHERE  lhp.MaHocKy     = @maHK
      AND  lhp.TrangThai   = N'Đang mở'
      AND  lhp.SiSoHienTai < lhp.SiSoToiDa
    ORDER  BY hp.TenHP, lhp.MaLHP;
END
GO

-- ============================================================
-- TEST SCRIPT – Chạy từng khối trên SSMS
-- ============================================================

-- ── TEST sp_MoLopHocPhan ─────────────────────────────────────
EXEC sp_MoLopHocPhan
    @maLHP = N'LHP_121000_01',   -- thay MaLHP đúng từ seed_data
    @maHK  = N'HK1_2526';
GO

-- ── TEST sp_DongLopHocPhan ───────────────────────────────────
EXEC sp_DongLopHocPhan @maLHP = N'LHP_121000_01';
GO

-- ── Mở lại để test sp_LayLopConCho ──────────────────────────
EXEC sp_MoLopHocPhan @maLHP = N'LHP_121000_01', @maHK = N'HK1_2526';
GO

-- ── TEST sp_LayLopConCho ─────────────────────────────────────
EXEC sp_LayLopConCho @maHK = N'HK1_2526';
GO

-- ── TEST lỗi: HK không hợp lệ ───────────────────────────────
-- Kết quả mong đợi: Msg 50002 – "Học kỳ không ở trạng thái có thể mở lớp"
EXEC sp_MoLopHocPhan @maLHP = N'LHP_121000_01', @maHK = N'HK1_2223';
GO