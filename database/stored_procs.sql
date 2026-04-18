-- DANH SÁCH SP:
--   1. sp_MoLopHocPhan   – Mở lớp cho một học kỳ
--   2. sp_DongLopHocPhan – Đóng lớp
--   3. sp_LayLopConCho   – Lấy lớp còn chỗ theo HK (dành cho SV đăng ký)
--
-- DÙNG STORED PROCEDURE
--   - Logic tập trung ở DB → dễ bảo trì, tránh lặp code ở nhiều controller
--   - Tránh SQL Injection tốt hơn (tham số hóa hoàn toàn)

USE QLDangKyHP;

-- ============================================================
-- SP 1: sp_MoLopHocPhan
-- Mục đích : Gán học kỳ cho lớp và đổi TrangThai → 'Đang mở'
-- Tham số  : p_maLHP CHAR(20), p_maHK CHAR(10)
-- Trả về   : SELECT KetQua, ThongBao
-- Lỗi      : SIGNAL '45000' nếu LHP không tồn tại
--            SIGNAL '45000' nếu HK không hợp lệ để mở lớp
-- ============================================================

DROP PROCEDURE IF EXISTS sp_MoLopHocPhan;  -- Thay CREATE OR ALTER PROCEDURE

DELIMITER //

CREATE PROCEDURE sp_MoLopHocPhan(
    IN p_maLHP  CHAR(20),  -- IN = tham số đầu vào (tương đương @ trong T-SQL)
    IN p_maHK   CHAR(10)
)
BEGIN
    -- SET NOCOUNT ON; ← Không có trong MySQL

    -- ── Kiểm tra lớp học phần tồn tại ────────────────────────
    -- Thay: IF NOT EXISTS ... THROW 50001, N'...', 1;
    IF NOT EXISTS (SELECT 1 FROM LopHocPhan WHERE MaLHP = p_maLHP) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Lớp học phần không tồn tại.';
    END IF;

    -- ── Kiểm tra học kỳ hợp lệ để mở lớp ────────────────────
    -- N'Đang mở' → 'Đang mở' (MySQL utf8mb4 tự xử lý Unicode, không cần N prefix)
    IF NOT EXISTS (
        SELECT 1 FROM HocKy
        WHERE  MaHocKy  = p_maHK
          AND  TrangThai IN ('Chưa mở', 'Đang mở đăng ký')
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Học kỳ không ở trạng thái có thể mở lớp.';
    END IF;

    -- ── Kiểm tra lớp chưa bị gán vào HK khác đang hoạt động ─
    IF EXISTS (
        SELECT 1 FROM LopHocPhan
        WHERE  MaLHP    = p_maLHP
          AND  MaHocKy IS NOT NULL
          AND  MaHocKy  <> p_maHK
          AND  TrangThai IN ('Đang mở', 'Đã đầy')
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Lớp này đang mở ở một học kỳ khác, không thể thay đổi.';
    END IF;

    -- ── Cập nhật: gán HK và đổi trạng thái ──────────────────
    UPDATE LopHocPhan
    SET    TrangThai = 'Đang mở',
           MaHocKy  = p_maHK
    WHERE  MaLHP = p_maLHP;

    -- MySQL: SELECT trong procedure = result set trả về client
    SELECT 0             AS KetQua,
           'Mở lớp thành công.' AS ThongBao;
END;
//

DELIMITER ;

-- ============================================================
-- SP 2: sp_DongLopHocPhan
-- Mục đích : Đóng lớp học phần (TrangThai → 'Đã đóng')
-- Tham số  : p_maLHP CHAR(20)
-- Trả về   : SELECT KetQua, ThongBao
-- Lỗi      : SIGNAL nếu lớp không tồn tại hoặc đã đóng/hủy
-- ============================================================

DROP PROCEDURE IF EXISTS sp_DongLopHocPhan;

DELIMITER //

CREATE PROCEDURE sp_DongLopHocPhan(
    IN p_maLHP CHAR(20)
)
BEGIN
    DECLARE v_affected INT DEFAULT 0;

    -- Đóng lớp – chỉ đóng được khi đang ở trạng thái 'Đang mở' hoặc 'Đã đầy'
    UPDATE LopHocPhan
    SET    TrangThai = 'Đã đóng'
    WHERE  MaLHP     = p_maLHP
      AND  TrangThai IN ('Đang mở', 'Đã đầy');

    -- ROW_COUNT() thay thế @@ROWCOUNT của SQL Server
    SET v_affected = ROW_COUNT();

    -- v_affected = 0: lớp không tồn tại HOẶC đã ở trạng thái không thể đóng
    IF v_affected = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể đóng lớp (lớp không tồn tại hoặc đã đóng).';
    END IF;

    SELECT 0                       AS KetQua,
           'Đóng lớp thành công.' AS ThongBao;
END;
//

DELIMITER ;

-- ============================================================
-- SP 3: sp_LayLopConCho  ← Dùng trong trang đăng ký của SV
-- Mục đích : Trả danh sách lớp còn chỗ trong một HK
-- Tham số  : p_maHK CHAR(10)
-- Trả về   : Thông tin lớp kèm SoChoConLai, sắp xếp theo TenHP
-- Điều kiện: TrangThai = 'Đang mở' VÀ SiSoHienTai < SiSoToiDa
-- ============================================================

DROP PROCEDURE IF EXISTS sp_LayLopConCho;

DELIMITER //

CREATE PROCEDURE sp_LayLopConCho(
    IN p_maHK CHAR(10)
)
BEGIN
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
    WHERE  lhp.MaHocKy     = p_maHK
      AND  lhp.TrangThai   = 'Đang mở'
      AND  lhp.SiSoHienTai < lhp.SiSoToiDa
    ORDER  BY hp.TenHP, lhp.MaLHP;
END;
//

DELIMITER ;

-- ============================================================
-- TEST SCRIPT – Thay EXEC bằng CALL (cú pháp MySQL)
-- ============================================================

-- ── TEST sp_MoLopHocPhan ─────────────────────────────────────
-- CALL sp_MoLopHocPhan('LHP_121000_01', 'HK1_2526');

-- ── TEST sp_DongLopHocPhan ───────────────────────────────────
-- CALL sp_DongLopHocPhan('LHP_121000_01');

-- ── Mở lại để test sp_LayLopConCho ──────────────────────────
-- CALL sp_MoLopHocPhan('LHP_121000_01', 'HK1_2526');

-- ── TEST sp_LayLopConCho ─────────────────────────────────────
-- CALL sp_LayLopConCho('HK1_2526');

-- ── TEST lỗi: HK không hợp lệ ───────────────────────────────
-- Kết quả mong đợi: Error 1644 – "Học kỳ không ở trạng thái có thể mở lớp"
-- CALL sp_MoLopHocPhan('LHP_121000_01', 'HK1_2223');