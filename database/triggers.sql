-- THỨ TỰ CHẠY KHI ĐĂNG KÝ 1 LỚP:
--   1. trg_KiemTraDangKyHopLe (BEFORE INSERT)  → kiểm tra còn chỗ + chặn trùng
--   2. MySQL tự thực hiện INSERT vào bảng       → khác INSTEAD OF của SQL Server!
--   3. trg_CapNhatSiSo_Insert (AFTER INSERT)    → tăng SiSoHienTai
--
-- KHI HỦY ĐĂNG KÝ (UPDATE TrangThai = 'Đã hủy'):
--   - Application Layer (dangKyService.js) phải giảm SiSoHienTai thủ công
--   - trg_CapNhatSiSo_Delete chỉ bắt sự kiện DELETE vật lý
-- ============================================================

USE QLDangKyHP;

-- ============================================================
-- TRIGGER 1: trg_CapNhatSiSo_Insert  (AFTER INSERT)
-- MySQL: dùng NEW.column thay vì bảng ảo INSERTED của SQL Server
-- ============================================================

DROP TRIGGER IF EXISTS trg_CapNhatSiSo_Insert;

DELIMITER //

CREATE TRIGGER trg_CapNhatSiSo_Insert
AFTER INSERT ON DangKyHocPhan
FOR EACH ROW  -- MySQL chỉ hỗ trợ FOR EACH ROW (row-level), không có statement-level
BEGIN
    -- Chỉ tăng sĩ số khi đăng ký hợp lệ
    IF NEW.TrangThai = 'Đã đăng ký' THEN
        UPDATE LopHocPhan
        SET SiSoHienTai = SiSoHienTai + 1
        WHERE MaLHP = NEW.MaLHP;  -- NEW thay vì INSERTED table

        -- Cập nhật TrangThai lớp nếu đã đầy
        UPDATE LopHocPhan
        SET TrangThai = CASE
            WHEN SiSoHienTai >= SiSoToiDa THEN 'Đã đầy'
            ELSE 'Đang mở'
        END
        WHERE MaLHP = NEW.MaLHP;
    END IF;
END;
//

DELIMITER ;

-- ============================================================
-- TRIGGER 2: trg_CapNhatSiSo_Delete  (AFTER DELETE)
-- Giảm SiSoHienTai khi xóa đăng ký hợp lệ
-- MySQL: dùng OLD.column thay vì bảng ảo DELETED của SQL Server
-- ============================================================

DROP TRIGGER IF EXISTS trg_CapNhatSiSo_Delete;

DELIMITER //

CREATE TRIGGER trg_CapNhatSiSo_Delete
AFTER DELETE ON DangKyHocPhan
FOR EACH ROW
BEGIN
    -- Chỉ giảm khi đăng ký bị xóa có trạng thái 'Đã đăng ký'
    IF OLD.TrangThai = 'Đã đăng ký' THEN  -- OLD thay vì DELETED table
        UPDATE LopHocPhan
        SET SiSoHienTai = GREATEST(0, SiSoHienTai - 1)
        WHERE MaLHP = OLD.MaLHP;

        -- Cập nhật lại TrangThai lớp (có thể từ 'Đã đầy' trở về 'Đang mở')
        UPDATE LopHocPhan
        SET TrangThai = CASE
            WHEN SiSoHienTai >= SiSoToiDa THEN 'Đã đầy'
            ELSE 'Đang mở'
        END
        WHERE MaLHP = OLD.MaLHP;
    END IF;
END;
//

DELIMITER ;

-- ============================================================
-- TRIGGER 3: trg_KiemTraDangKyHopLe  (BEFORE INSERT)
-- Thay thế "INSTEAD OF INSERT" của SQL Server.
-- MySQL KHÔNG có INSTEAD OF → dùng BEFORE INSERT + SIGNAL để chặn.
-- SIGNAL SQLSTATE '45000' = user-defined error (tương đương THROW trong T-SQL).
-- ============================================================

DROP TRIGGER IF EXISTS trg_KiemTraDangKyHopLe;

DELIMITER //

CREATE TRIGGER trg_KiemTraDangKyHopLe
BEFORE INSERT ON DangKyHocPhan  -- BEFORE thay vì INSTEAD OF
FOR EACH ROW
BEGIN
    DECLARE v_SiSoHienTai  SMALLINT;
    DECLARE v_SiSoToiDa    SMALLINT;
    DECLARE v_TrangThaiLop VARCHAR(20);
    DECLARE v_SoLuongTrung INT DEFAULT 0;

    -- ── Đọc thông tin lớp ────────────────────────────────────
    SELECT SiSoHienTai, SiSoToiDa, TrangThai
      INTO v_SiSoHienTai, v_SiSoToiDa, v_TrangThaiLop
      FROM LopHocPhan
     WHERE MaLHP = NEW.MaLHP;  -- NEW thay vì INSERTED

    -- ── Kiểm tra 1: Lớp có tồn tại không ────────────────────
    IF v_SiSoToiDa IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Lớp học phần không tồn tại.';
    END IF;

    -- ── Kiểm tra 2: Lớp còn chỗ không ───────────────────────
    -- Tương đương: THROW 50010, N'Lớp học phần đã đầy...', 1;
    IF v_SiSoHienTai >= v_SiSoToiDa THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Lớp học phần đã đầy, không thể đăng ký.';
    END IF;

    -- ── Kiểm tra 3: SV chưa đăng ký lớp này ─────────────────
    -- Tương đương: THROW 50011, N'Sinh viên đã đăng ký...', 1;
    SELECT COUNT(*) INTO v_SoLuongTrung
      FROM DangKyHocPhan
     WHERE MaSV     = NEW.MaSV
       AND MaLHP    = NEW.MaLHP
       AND TrangThai = 'Đã đăng ký';

    IF v_SoLuongTrung > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Sinh viên đã đăng ký lớp này rồi.';
    END IF;

    -- ── Điền giá trị mặc định nếu NULL ──────────────────────
    -- MySQL BEFORE trigger cho phép gán giá trị cho NEW.*
    -- Thay ISNULL(col, default) → gán trực tiếp vào NEW:
    IF NEW.NgayDangKy IS NULL THEN
        SET NEW.NgayDangKy = NOW();  -- NOW() thay GETDATE()
    END IF;
    IF NEW.TrangThai IS NULL THEN
        SET NEW.TrangThai = 'Đã đăng ký';
    END IF;
    -- Sau BEFORE trigger, MySQL tự INSERT bản ghi.
    -- Không cần viết INSERT thủ công như INSTEAD OF của SQL Server.
END;
//

DELIMITER ;

-- ============================================================
-- Để kiểm thử các triggers, chạy file: test_script.sql
-- ============================================================