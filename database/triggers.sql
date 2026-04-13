-- ============================================================
-- FILE: database/triggers.sql
-- TV-04  |  Task 5 & Task 6
-- DBMS:  SQL Server
-- Mô tả: 2 Trigger trên bảng DangKyHocPhan
--
-- THỨ TỰ CHẠY KHI ĐĂNG KÝ 1 LỚP:
--   1. trg_KiemTraDangKyHopLe (INSTEAD OF INSERT) → kiểm tra còn chỗ
--   2. Nếu còn chỗ → INSERT thật sự xảy ra (bên trong trigger)
--   3. trg_CapNhatSiSo (AFTER INSERT)            → tăng SiSoHienTai
-- ============================================================

USE QLDangKyHP;
GO

-- ============================================================
-- TASK 5: trg_CapNhatSiSo  (AFTER INSERT, DELETE)
-- ============================================================
-- AFTER TRIGGER: chạy SAU KHI dòng đã INSERT/DELETE thành công.
-- Bảng INSERTED (ảo): chứa các dòng vừa được INSERT.
-- Bảng DELETED  (ảo): chứa các dòng vừa bị DELETE.
-- Lưu ý: xử lý theo nhóm (batch) không phải từng dòng.
-- ============================================================
CREATE OR ALTER TRIGGER trg_CapNhatSiSo
ON DangKyHocPhan
AFTER INSERT, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- ── Khi INSERT: tăng sĩ số các lớp vừa được đăng ký ──────
    UPDATE lhp
    SET    lhp.SiSoHienTai = lhp.SiSoHienTai + i.SoLuong
    FROM   LopHocPhan lhp
    JOIN (
        SELECT MaLHP, COUNT(*) AS SoLuong
        FROM   INSERTED
        WHERE  TrangThai = N'Đã đăng ký'   -- chỉ đếm đăng ký hợp lệ
        GROUP  BY MaLHP
    ) i ON lhp.MaLHP = i.MaLHP;

    -- ── Khi DELETE/Hủy: giảm sĩ số ──────────────────────────
    UPDATE lhp
    SET    lhp.SiSoHienTai = lhp.SiSoHienTai - d.SoLuong
    FROM   LopHocPhan lhp
    JOIN (
        SELECT MaLHP, COUNT(*) AS SoLuong
        FROM   DELETED
        WHERE  TrangThai = N'Đã đăng ký'
        GROUP  BY MaLHP
    ) d ON lhp.MaLHP = d.MaLHP;

    -- ── Cập nhật TrangThai lớp sau khi sĩ số thay đổi ────────
    UPDATE LopHocPhan
    SET    TrangThai = CASE
               WHEN SiSoHienTai >= SiSoToiDa THEN N'Đã đầy'
               ELSE N'Đang mở'
           END
    WHERE  MaLHP IN (
        SELECT DISTINCT MaLHP FROM INSERTED
        UNION
        SELECT DISTINCT MaLHP FROM DELETED
    );
END
GO

-- ============================================================
-- TASK 6: trg_KiemTraDangKyHopLe  (INSTEAD OF INSERT)
-- ============================================================
-- INSTEAD OF INSERT: thực thi THAY VÌ lệnh INSERT gốc.
-- → Lệnh INSERT gốc bị HỦY HOÀN TOÀN.
-- → Muốn data vào bảng, phải viết lại INSERT trong thân trigger.
--
-- Tại sao dùng INSTEAD OF thay vì AFTER?
--   AFTER:       data đã INSERT rồi mới phát hiện lớp đầy → ROLLBACK, kém hiệu quả
--   INSTEAD OF:  ngăn chặn ngay từ đầu, sạch hơn, không cần ROLLBACK
-- ============================================================
CREATE OR ALTER TRIGGER trg_KiemTraDangKyHopLe
ON DangKyHocPhan
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- ── Kiểm tra lớp có còn chỗ không ───────────────────────
    IF EXISTS (
        SELECT 1
        FROM   INSERTED i
        JOIN   LopHocPhan lhp ON i.MaLHP = lhp.MaLHP
        WHERE  lhp.SiSoHienTai >= lhp.SiSoToiDa
    )
    BEGIN
        THROW 50010, N'Lớp học phần đã đầy, không thể đăng ký.', 1;
        RETURN;
    END

    -- ── Kiểm tra SV không đăng ký trùng lớp ──────────────────
    IF EXISTS (
        SELECT 1
        FROM   INSERTED i
        JOIN   DangKyHocPhan dk
               ON  dk.MaSV  = i.MaSV
               AND dk.MaLHP = i.MaLHP
               AND dk.TrangThai = N'Đã đăng ký'
    )
    BEGIN
        THROW 50011, N'Sinh viên đã đăng ký lớp này rồi.', 1;
        RETURN;
    END

    -- ── Còn chỗ → thực hiện INSERT thật sự ──────────────────
    -- Sau bước này, trg_CapNhatSiSo (AFTER INSERT) sẽ tự chạy.
    INSERT INTO DangKyHocPhan (MaSV, MaLHP, NgayDangKy, TrangThai)
    SELECT MaSV, MaLHP, ISNULL(NgayDangKy, GETDATE()), ISNULL(TrangThai, N'Đã đăng ký')
    FROM   INSERTED;
END
GO

-- ============================================================
-- TEST SCRIPT – Chạy từng khối trên SSMS để kiểm tra
-- ============================================================

-- ── TEST 1: Trigger trg_CapNhatSiSo ─────────────────────────
-- Bước 1: Xem sĩ số trước
SELECT MaLHP, SiSoHienTai, SiSoToiDa, TrangThai
FROM   LopHocPhan
WHERE  MaLHP = 'LHP_121000_01';   -- thay MaLHP đúng trong seed_data

-- Bước 2: Thêm đăng ký (trigger INSTEAD OF chạy trước, rồi AFTER)
INSERT INTO DangKyHocPhan(MaSV, MaLHP)
VALUES ('2154010001', 'LHP_121000_01');

-- Bước 3: Kiểm tra SiSoHienTai đã tăng lên 1
SELECT MaLHP, SiSoHienTai, TrangThai
FROM   LopHocPhan
WHERE  MaLHP = 'LHP_121000_01';

-- Bước 4: Kiểm tra bản ghi đăng ký đã có
SELECT * FROM DangKyHocPhan
WHERE MaSV = '2154010001' AND MaLHP = 'LHP_121000_01';

-- ── TEST 2: Hủy đăng ký → SiSoHienTai phải giảm ────────────
-- (Xem MaDK vừa insert ở bước 4 trên)
UPDATE DangKyHocPhan
SET    TrangThai = N'Đã hủy'
WHERE  MaSV = '2154010001' AND MaLHP = 'LHP_121000_01';

-- Hoặc DELETE trực tiếp để test AFTER DELETE:
-- DELETE FROM DangKyHocPhan WHERE MaSV='2154010001' AND MaLHP='LHP_121000_01';

SELECT MaLHP, SiSoHienTai FROM LopHocPhan WHERE MaLHP = 'LHP_121000_01';

-- ── TEST 3: Trigger trg_KiemTraDangKyHopLe – đăng ký lớp đầy
-- Đặt SiSoHienTai = SiSoToiDa tạm thời để test
UPDATE LopHocPhan SET SiSoHienTai = SiSoToiDa WHERE MaLHP = 'LHP_121000_01';

-- Thử đăng ký → phải báo lỗi 50010
INSERT INTO DangKyHocPhan(MaSV, MaLHP)
VALUES ('2154010002', 'LHP_121000_01');
-- Kết quả mong đợi: Msg 50010, Level 16 – "Lớp học phần đã đầy..."

-- Reset lại để test tiếp
UPDATE LopHocPhan SET SiSoHienTai = SiSoHienTai - 1 WHERE MaLHP = 'LHP_121000_01';