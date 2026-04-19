-- ============================================================
-- FILE: database/test_script_v2.sql
-- DBMS: MySQL 8.0+
-- Phiên bản: 2.0 (thay thế test_script.sql)
-- Mục đích : Kiểm thử toàn diện sau khi chạy run_all.sql
--
-- ĐỐI TƯỢNG ĐƯỢC TEST:
--   SCHEMA      : 12 bảng, indexes, generated columns
--   VIEWS       : V_BangDiemSinhVien | V_GPA_HocKy | V_GPA_TichLuy
--   STORED PROCS: sp_MoLopHocPhan | sp_DongLopHocPhan
--                 sp_LayLopConCho  | sp_ThongKeDangKy
--   TRIGGERS    : trg_KiemTraDangKyHopLe (BEFORE INSERT)
--                 trg_CapNhatSiSo_Insert  (AFTER  INSERT)
--                 trg_CapNhatSiSo_Delete  (AFTER  DELETE)
--   CONSTRAINTS : CHECK, UNIQUE, FOREIGN KEY
--
-- CÁCH DÙNG:
--   1. Chạy run_all.sql TRƯỚC
--   2. Mở file này trong MySQL Workbench
--   3. Chạy từng khối (chọn vùng → Ctrl+Shift+Enter) HOẶC toàn bộ
--   4. So sánh kết quả với comment "-- Kết quả mong đợi"
--
-- LƯU Ý: Các test lỗi (SIGNAL / CHECK violated) dùng
--         SAVEPOINT + ROLLBACK TO để không ảnh hưởng phần kế tiếp.
-- ============================================================

USE QLDangKyHP;

-- ===========================================================
-- 0. KIỂM TRA SƠ ĐỒ: Xác nhận các đối tượng đã tồn tại
-- ===========================================================

-- [0.A] Kiểm tra tất cả bảng đã tạo
SELECT TABLE_NAME, TABLE_ROWS
FROM   information_schema.TABLES
WHERE  TABLE_SCHEMA = 'QLDangKyHP'
  AND  TABLE_TYPE   = 'BASE TABLE'
ORDER  BY TABLE_NAME;
-- Kết quả mong đợi: 12 bảng —
--   ChuongTrinhKhung, DangKyHocPhan, DieuKienHP, Diem,
--   GiangVien, HocKy, HocPhan, Khoa, LopHocPhan,
--   Nganh, SinhVien, TaiKhoan

-- [0.B] Kiểm tra Views
SELECT TABLE_NAME,
       VIEW_DEFINITION IS NOT NULL AS CoDefinition
FROM   information_schema.VIEWS
WHERE  TABLE_SCHEMA = 'QLDangKyHP'
ORDER  BY TABLE_NAME;
-- Kết quả mong đợi: V_BangDiemSinhVien, V_GPA_HocKy, V_GPA_TichLuy

-- [0.C] Kiểm tra Stored Procedures
SELECT ROUTINE_NAME, ROUTINE_TYPE, CREATED
FROM   information_schema.ROUTINES
WHERE  ROUTINE_SCHEMA = 'QLDangKyHP'
  AND  ROUTINE_TYPE   = 'PROCEDURE'
ORDER  BY ROUTINE_NAME;
-- Kết quả mong đợi: 4 SP —
--   sp_DongLopHocPhan, sp_LayLopConCho,
--   sp_MoLopHocPhan,   sp_ThongKeDangKy

-- [0.D] Kiểm tra Triggers
SELECT TRIGGER_NAME,
       EVENT_MANIPULATION AS Su_kien,
       ACTION_TIMING       AS Thoi_diem,
       EVENT_OBJECT_TABLE  AS Bang
FROM   information_schema.TRIGGERS
WHERE  TRIGGER_SCHEMA = 'QLDangKyHP'
ORDER  BY EVENT_OBJECT_TABLE, ACTION_TIMING, EVENT_MANIPULATION;
-- Kết quả mong đợi: 3 triggers trên DangKyHocPhan —
--   trg_KiemTraDangKyHopLe  BEFORE INSERT
--   trg_CapNhatSiSo_Insert   AFTER  INSERT
--   trg_CapNhatSiSo_Delete   AFTER  DELETE

-- [0.E] Kiểm tra Indexes
SELECT TABLE_NAME,
       INDEX_NAME,
       GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS Cot
FROM   information_schema.STATISTICS
WHERE  TABLE_SCHEMA = 'QLDangKyHP'
  AND  INDEX_NAME  IN ('IX_SV_Nganh', 'IX_LHP_HP_HK', 'IX_LHP_GV',
                       'IX_DK_SV',    'IX_DK_LHP')
GROUP  BY TABLE_NAME, INDEX_NAME
ORDER  BY TABLE_NAME, INDEX_NAME;
-- Kết quả mong đợi:
--   DangKyHocPhan | IX_DK_LHP    | MaLHP
--   DangKyHocPhan | IX_DK_SV     | MaSV
--   LopHocPhan    | IX_LHP_GV    | MaGV,MaHocKy,ThuHoc,TietBatDau
--   LopHocPhan    | IX_LHP_HP_HK | MaHP,MaHocKy
--   SinhVien      | IX_SV_Nganh  | MaNganh,NamNhapHoc

-- [0.F] Kiểm tra Generated Columns (DiemTK, XepLoai)
SELECT COLUMN_NAME, GENERATION_EXPRESSION, EXTRA
FROM   information_schema.COLUMNS
WHERE  TABLE_SCHEMA = 'QLDangKyHP'
  AND  TABLE_NAME   = 'Diem'
  AND  EXTRA LIKE '%GENERATED%'
ORDER  BY ORDINAL_POSITION;
-- Kết quả mong đợi: DiemTK và XepLoai đều có EXTRA = 'STORED GENERATED'

-- [0.G] Kiểm tra nhanh số lượng dữ liệu đã seed
SELECT 'Khoa'          AS Bang, COUNT(*) AS SoLuong FROM Khoa            UNION ALL
SELECT 'Nganh',                 COUNT(*) FROM Nganh                      UNION ALL
SELECT 'HocPhan',               COUNT(*) FROM HocPhan                    UNION ALL
SELECT 'DieuKienHP',            COUNT(*) FROM DieuKienHP                 UNION ALL
SELECT 'ChuongTrinhKhung',      COUNT(*) FROM ChuongTrinhKhung           UNION ALL
SELECT 'HocKy',                 COUNT(*) FROM HocKy                      UNION ALL
SELECT 'GiangVien',             COUNT(*) FROM GiangVien                  UNION ALL
SELECT 'SinhVien',              COUNT(*) FROM SinhVien                   UNION ALL
SELECT 'TaiKhoan',              COUNT(*) FROM TaiKhoan                   UNION ALL
SELECT 'LopHocPhan',            COUNT(*) FROM LopHocPhan                 UNION ALL
SELECT 'DangKyHocPhan',         COUNT(*) FROM DangKyHocPhan              UNION ALL
SELECT 'Diem',                  COUNT(*) FROM Diem;
-- Kết quả mong đợi (tham khảo):
--   Khoa = 6, Nganh = 3, HocPhan = 67, GiangVien = 10, SinhVien = 25
--   TaiKhoan = 28 (1 admin + 3 GV + 25 SV), LopHocPhan = 22
--   DangKyHocPhan >= 50, Diem = 13


-- ===========================================================
-- 1. TEST STORED PROCEDURE: sp_MoLopHocPhan
-- ===========================================================

-- Trước test: xem trạng thái học kỳ
SELECT MaHocKy, TenHocKy, TrangThai
FROM   HocKy
ORDER  BY NamHoc DESC, HocKySo;

-- [1.A] Happy path – mở lớp thành công cho HK đang mở đăng ký
CALL sp_MoLopHocPhan('LHP_001215_01', 'HK1_2526');
-- Kết quả mong đợi: KetQua = 0, ThongBao = 'Mở lớp thành công.'

SELECT MaLHP, MaHocKy, TrangThai
FROM   LopHocPhan
WHERE  MaLHP = 'LHP_001215_01';
-- Kết quả mong đợi: MaHocKy = 'HK1_2526', TrangThai = 'Đang mở'

-- [1.B] Lỗi – lớp không tồn tại → Error 1644
SAVEPOINT sp1b;
CALL sp_MoLopHocPhan('LHP_99999_XX', 'HK1_2526');
-- Kết quả mong đợi: Error 1644 – "Lớp học phần không tồn tại."
ROLLBACK TO SAVEPOINT sp1b;
RELEASE SAVEPOINT sp1b;

-- [1.C] Lỗi – HK đã kết thúc → Error 1644
SAVEPOINT sp1c;
CALL sp_MoLopHocPhan('LHP_001215_01', 'HK1_2425');
-- Kết quả mong đợi: Error 1644 – "Học kỳ không ở trạng thái có thể mở lớp."
ROLLBACK TO SAVEPOINT sp1c;
RELEASE SAVEPOINT sp1c;


-- ===========================================================
-- 2. TEST STORED PROCEDURE: sp_DongLopHocPhan
-- ===========================================================

-- Đảm bảo lớp đang ở TrangThai = 'Đang mở' (từ test 1.A)
SELECT MaLHP, TrangThai FROM LopHocPhan WHERE MaLHP = 'LHP_001215_01';

-- [2.A] Happy path – đóng lớp thành công
CALL sp_DongLopHocPhan('LHP_001215_01');
-- Kết quả mong đợi: KetQua = 0, ThongBao = 'Đóng lớp thành công.'

SELECT MaLHP, TrangThai FROM LopHocPhan WHERE MaLHP = 'LHP_001215_01';
-- Kết quả mong đợi: TrangThai = 'Đã đóng'

-- [2.B] Lỗi – đóng lớp đã đóng → Error 1644
SAVEPOINT sp2b;
CALL sp_DongLopHocPhan('LHP_001215_01');
-- Kết quả mong đợi: Error 1644 – "Không thể đóng lớp (lớp không tồn tại hoặc đã đóng)."
ROLLBACK TO SAVEPOINT sp2b;
RELEASE SAVEPOINT sp2b;

-- Mở lại để test tiếp
CALL sp_MoLopHocPhan('LHP_001215_01', 'HK1_2526');
SELECT MaLHP, TrangThai FROM LopHocPhan WHERE MaLHP = 'LHP_001215_01';
-- Kết quả mong đợi: TrangThai = 'Đang mở'


-- ===========================================================
-- 3. TEST TRIGGER: trg_KiemTraDangKyHopLe (BEFORE INSERT)
--                  trg_CapNhatSiSo_Insert  (AFTER  INSERT)
-- ===========================================================

-- Dùng lớp HK1_2526 đang mở: LHP_001215_01 (Xác suất thống kê, SiSoToiDa=45)
-- SV mới đăng ký: '2354010006' (chưa đăng ký lớp này)

-- Trạng thái trước
SELECT MaLHP, SiSoHienTai, SiSoToiDa, TrangThai
FROM   LopHocPhan
WHERE  MaLHP = 'LHP_001215_01';

-- [3.A] Happy path – đăng ký bình thường
INSERT INTO DangKyHocPhan (MaSV, MaLHP)
VALUES ('2354010006', 'LHP_001215_01');
-- Kết quả mong đợi: INSERT thành công
-- - TrangThai tự điền = 'Đã đăng ký' (trigger BEFORE)
-- - NgayDangKy tự điền = NOW()         (trigger BEFORE)

SELECT MaDK, MaSV, MaLHP, NgayDangKy, TrangThai
FROM   DangKyHocPhan
WHERE  MaSV = '2354010006' AND MaLHP = 'LHP_001215_01';

-- [3.B] Kiểm tra SiSoHienTai đã tăng +1
SELECT MaLHP, SiSoHienTai, SiSoToiDa, TrangThai
FROM   LopHocPhan
WHERE  MaLHP = 'LHP_001215_01';
-- Kết quả mong đợi: SiSoHienTai = 1 (từ 0)

-- [3.C] Lỗi – SV đăng ký trùng lớp → Error 1644
SAVEPOINT sp3c;
INSERT INTO DangKyHocPhan (MaSV, MaLHP)
VALUES ('2354010006', 'LHP_001215_01');
-- Kết quả mong đợi: Error 1644 – "Sinh viên đã đăng ký lớp này rồi."
ROLLBACK TO SAVEPOINT sp3c;
RELEASE SAVEPOINT sp3c;

-- [3.D] Lỗi – lớp đã đầy → Error 1644
-- Tạm thời nâng SiSoHienTai = SiSoToiDa
UPDATE LopHocPhan SET SiSoHienTai = SiSoToiDa WHERE MaLHP = 'LHP_001215_01';

SAVEPOINT sp3d;
INSERT INTO DangKyHocPhan (MaSV, MaLHP)
VALUES ('2354010007', 'LHP_001215_01');
-- Kết quả mong đợi: Error 1644 – "Lớp học phần đã đầy, không thể đăng ký."
ROLLBACK TO SAVEPOINT sp3d;
RELEASE SAVEPOINT sp3d;

-- Phục hồi sĩ số thực tế từ bảng DangKyHocPhan
UPDATE LopHocPhan
SET SiSoHienTai = (
    SELECT COUNT(*) FROM DangKyHocPhan
    WHERE  MaLHP = 'LHP_001215_01' AND TrangThai = 'Đã đăng ký'
)
WHERE MaLHP = 'LHP_001215_01';

SELECT MaLHP, SiSoHienTai, SiSoToiDa, TrangThai
FROM   LopHocPhan WHERE MaLHP = 'LHP_001215_01';


-- ===========================================================
-- 4. TEST TRIGGER: trg_CapNhatSiSo_Delete (AFTER DELETE)
-- ===========================================================

-- [4.A] Xem SiSoHienTai trước khi xóa
SELECT MaLHP, SiSoHienTai FROM LopHocPhan WHERE MaLHP = 'LHP_001215_01';

SELECT MaDK, MaSV, MaLHP, TrangThai
FROM   DangKyHocPhan
WHERE  MaSV = '2354010006' AND MaLHP = 'LHP_001215_01';

-- [4.B] Xóa đăng ký – trigger AFTER DELETE giảm SiSoHienTai
DELETE FROM DangKyHocPhan
WHERE  MaSV  = '2354010006'
  AND  MaLHP = 'LHP_001215_01';
-- Kết quả mong đợi: DELETE thành công

-- [4.C] Xác nhận SiSoHienTai đã giảm 1
SELECT MaLHP, SiSoHienTai, TrangThai
FROM   LopHocPhan WHERE MaLHP = 'LHP_001215_01';
-- Kết quả mong đợi: SiSoHienTai = 0 (đã về ban đầu)
-- Nếu đang 'Đã đầy' → tự chuyển về 'Đang mở'


-- ===========================================================
-- 5. TEST COMPUTED COLUMNS: DiemTK, XepLoai
-- ===========================================================

-- Chuẩn bị: dùng SV '2354010008' đăng ký lớp LHP_001215_01
INSERT INTO DangKyHocPhan (MaSV, MaLHP)
VALUES ('2354010008', 'LHP_001215_01');

-- Lấy MaDK vừa tạo (dùng subquery thay LAST_INSERT_ID() để tránh nhầm)
SELECT @test_madk := MaDK
FROM   DangKyHocPhan
WHERE  MaSV = '2354010008' AND MaLHP = 'LHP_001215_01' AND TrangThai = 'Đã đăng ký';

-- [5.A] Nhập điểm → MySQL tự tính DiemTK và XepLoai
INSERT INTO Diem (MaDK, DiemQT, DiemThi)
VALUES (@test_madk, 8.0, 9.0);
-- DiemTK = 8.0*0.4 + 9.0*0.6 = 3.2 + 5.4 = 8.60 → XepLoai = 'A'

SELECT MaDiem, MaDK, DiemQT, DiemThi, DiemTK, XepLoai
FROM   Diem WHERE MaDK = @test_madk;
-- Kết quả mong đợi: DiemTK = 8.60, XepLoai = 'A'

-- [5.B] Cập nhật điểm → kiểm tra tự tính lại
UPDATE Diem
SET    DiemQT = 3.0, DiemThi = 3.0
WHERE  MaDK = @test_madk;
-- DiemTK = 3.0*0.4 + 3.0*0.6 = 3.00 → XepLoai = 'F'

SELECT DiemQT, DiemThi, DiemTK, XepLoai
FROM   Diem WHERE MaDK = @test_madk;
-- Kết quả mong đợi: DiemTK = 3.00, XepLoai = 'F'

-- [5.C] Test CHECK CONSTRAINT điểm ngoài [0, 10] → Error 3819
SAVEPOINT sp5c;
INSERT INTO Diem (MaDK, DiemQT, DiemThi)
VALUES (99999, -1.0, 11.0);
-- Kết quả mong đợi: Error 3819 – Check constraint 'CK_Diem_QT' hoặc 'CK_Diem_Thi' violated
ROLLBACK TO SAVEPOINT sp5c;
RELEASE SAVEPOINT sp5c;

-- [5.D] Bảng tính ranh giới từng mức xếp loại (không cần DK thật)
SELECT
    DiemQT, DiemThi,
    ROUND(DiemQT * 0.4 + DiemThi * 0.6, 2) AS DiemTK_Predict,
    CASE
        WHEN DiemQT * 0.4 + DiemThi * 0.6 >= 8.5 THEN 'A'
        WHEN DiemQT * 0.4 + DiemThi * 0.6 >= 7.0 THEN 'B'
        WHEN DiemQT * 0.4 + DiemThi * 0.6 >= 5.5 THEN 'C'
        WHEN DiemQT * 0.4 + DiemThi * 0.6 >= 4.0 THEN 'D'
        ELSE 'F'
    END AS XepLoai_Predict
FROM (
    SELECT  9.0 AS DiemQT,  9.0 AS DiemThi UNION ALL  -- TK=9.00 → A
    SELECT  8.5,             8.5           UNION ALL   -- TK=8.50 → A (biên)
    SELECT  7.0,             7.0           UNION ALL   -- TK=7.00 → B (biên)
    SELECT  6.0,             5.5           UNION ALL   -- TK=5.70 → C
    SELECT  5.5,             5.5           UNION ALL   -- TK=5.50 → C (biên)
    SELECT  4.0,             4.0           UNION ALL   -- TK=4.00 → D (biên)
    SELECT  3.0,             3.0                       -- TK=3.00 → F
) boundary;


-- ===========================================================
-- 6. TEST STORED PROCEDURE: sp_LayLopConCho
-- ===========================================================

-- [6.A] Lấy lớp còn chỗ HK1_2526
CALL sp_LayLopConCho('HK1_2526');
-- Kết quả mong đợi: danh sách lớp TrangThai = 'Đang mở' và SiSoHienTai < SiSoToiDa
-- Cột SoChoConLai = SiSoToiDa - SiSoHienTai
-- TietKetThuc     = TietBatDau + SoTiet - 1

-- [6.B] HK không có lớp nào → trả 0 hàng
CALL sp_LayLopConCho('HK1_2122');
-- Kết quả mong đợi: 0 hàng

-- [6.C] HK2_2425 đang học (các lớp trạng thái 'Đang mở')
CALL sp_LayLopConCho('HK2_2425');
-- Kết quả mong đợi: danh sách lớp HK2_2425 còn chỗ


-- ===========================================================
-- 7. TEST STORED PROCEDURE: sp_ThongKeDangKy
-- ===========================================================

-- [7.A] Thống kê theo HK cụ thể
CALL sp_ThongKeDangKy('HK2_2425');
-- Kết quả mong đợi: danh sách lớp với:
--   SoDangKy   = số SV đã đăng ký còn hiệu lực
--   SoDat      = số có XepLoai A/B/C/D
--   SoRot      = số có XepLoai F
--   ChuaCoDiem = số chưa nhập điểm
--   DiemTBLop  = NULL (HK2_2425 chưa có điểm)
--   TiLeLapDay = % lấp đầy = SiSoHienTai * 100 / SiSoToiDa

-- [7.B] Thống kê tất cả HK (NULL = không lọc)
CALL sp_ThongKeDangKy(NULL);
-- Kết quả mong đợi: gộp tất cả HK, có cột TenHocKy phân biệt

-- [7.C] HK1_2425 – lớp đã đóng, có điểm
CALL sp_ThongKeDangKy('HK1_2425');
-- Kết quả mong đợi: SoDat/SoRot/DiemTBLop phải có giá trị != NULL


-- ===========================================================
-- 8. TEST VIEWS
-- ===========================================================

-- [8.A] V_BangDiemSinhVien – xem điểm đầy đủ của 1 SV
SELECT MaSV, TenSV, TenHP, TenHocKy, DiemQT, DiemThi, DiemTK, XepLoai
FROM   V_BangDiemSinhVien
WHERE  MaSV = '2254010001'
ORDER  BY TenHocKy, TenHP;
-- Kết quả mong đợi: điểm của SV 2254010001 kèm TenHP, TenHocKy

-- [8.B] V_BangDiemSinhVien – chỉ lấy bản ghi có điểm
SELECT MaSV, TenHP, TenHocKy, DiemTK, XepLoai
FROM   V_BangDiemSinhVien
WHERE  DiemTK IS NOT NULL
ORDER  BY MaSV, TenHocKy
LIMIT  20;
-- Kết quả mong đợi: tất cả bản ghi đã có điểm (cả 'Đã đăng ký' + 'Hoàn thành')

-- [8.C] V_BangDiemSinhVien – kiểm tra không mất lịch sử (TrangThaiDK = 'Hoàn thành')
SELECT COUNT(*) AS SoBanGhiHoanThanh
FROM   V_BangDiemSinhVien
WHERE  TrangThaiDK = 'Hoàn thành';
-- Kết quả mong đợi: > 0 (13 bản ghi đã seed)

-- [8.D] V_GPA_HocKy – GPA từng học kỳ
SELECT MaSV, TenSV, TenHocKy, TongTCTinhGPA, GPA_HocKy
FROM   V_GPA_HocKy
ORDER  BY MaSV, TenHocKy;
-- Kết quả mong đợi: mỗi SV có điểm sẽ có 1 dòng/HK với GPA_HocKy != NULL

-- [8.E] V_GPA_TichLuy – GPA tích lũy toàn khóa
SELECT MaSV, HoTen, TongTCTichLuy, GPA_TichLuy
FROM   V_GPA_TichLuy
ORDER  BY GPA_TichLuy DESC;
-- Kết quả mong đợi: tất cả SV xuất hiện (kể cả chưa có điểm → GPA_TichLuy = NULL)

-- [8.F] SV chưa có điểm → GPA = NULL (NULLIF bảo vệ chia cho 0)
SELECT MaSV, HoTen, TongTCTichLuy, GPA_TichLuy
FROM   V_GPA_TichLuy
WHERE  MaSV IN ('2354010009', '2354010010', '2354010011', '2354010012');
-- Kết quả mong đợi: TongTCTichLuy = 0, GPA_TichLuy = NULL


-- ===========================================================
-- 9. TEST INDEXES – EXPLAIN kiểm tra Query Plan
-- ===========================================================

-- [9.A] IX_SV_Nganh – lọc SV theo Ngành + NamNhapHoc
EXPLAIN
SELECT * FROM SinhVien WHERE MaNganh = 'CNTT01' AND NamNhapHoc = 2023;
-- Kết quả mong đợi: type = 'ref' hoặc 'range', key = 'IX_SV_Nganh'

-- [9.B] IX_LHP_HP_HK – lọc LopHocPhan theo HP trong HK
EXPLAIN
SELECT * FROM LopHocPhan WHERE MaHP = '104121000' AND MaHocKy = 'HK1_2526';
-- Kết quả mong đợi: key = 'IX_LHP_HP_HK'
-- Lưu ý: MaHP đúng là '104121000' (9 ký tự, không phải '121000001')

-- [9.C] IX_LHP_GV – lịch dạy GV trong HK theo Thứ
EXPLAIN
SELECT * FROM LopHocPhan
WHERE  MaGV    = 'GV000001'
  AND  MaHocKy = 'HK1_2526'
  AND  ThuHoc  = 2;
-- Kết quả mong đợi: key = 'IX_LHP_GV'

-- [9.D] IX_DK_SV – lọc DangKyHocPhan theo SV
EXPLAIN
SELECT * FROM DangKyHocPhan WHERE MaSV = '2254010001';
-- Kết quả mong đợi: key = 'IX_DK_SV'

-- [9.E] IX_DK_LHP – lọc DangKyHocPhan theo Lớp
EXPLAIN
SELECT * FROM DangKyHocPhan WHERE MaLHP = 'LHP_121000_01';
-- Kết quả mong đợi: key = 'IX_DK_LHP'


-- ===========================================================
-- 10. TEST CONSTRAINTS
-- ===========================================================

-- [10.A] CHECK – HocKySo phải là 1, 2, 3 → Error 3819
SAVEPOINT sp10a;
INSERT INTO HocKy (MaHocKy, TenHocKy, NamHoc, HocKySo)
VALUES ('HK4_2526', 'Học kỳ 4 - 2025-2026', '2025-2026', 4);
-- Kết quả mong đợi: Error 3819 – Check constraint 'CK_HK_So' violated
ROLLBACK TO SAVEPOINT sp10a;
RELEASE SAVEPOINT sp10a;

-- [10.B] CHECK – TrangThai HocKy không hợp lệ → Error 3819
SAVEPOINT sp10b;
INSERT INTO HocKy (MaHocKy, TenHocKy, NamHoc, HocKySo, TrangThai)
VALUES ('HK1_9999', 'Test', '9999-9999', 1, 'Trang thai sai');
-- Kết quả mong đợi: Error 3819 – Check constraint 'CK_HK_Status' violated
ROLLBACK TO SAVEPOINT sp10b;
RELEASE SAVEPOINT sp10b;

-- [10.C] CHECK – GioiTinh SinhVien không hợp lệ → Error 3819
SAVEPOINT sp10c;
INSERT INTO SinhVien (MaSV, HoTen, NgaySinh, GioiTinh, Email, MaNganh, NamNhapHoc)
VALUES ('9999999999', 'Test SV', '2000-01-01', 'Other', 'test@test.com', 'CNTT01', 2024);
-- Kết quả mong đợi: Error 3819 – Check constraint 'CK_SV_GT' violated
ROLLBACK TO SAVEPOINT sp10c;
RELEASE SAVEPOINT sp10c;

-- [10.D] CHECK – ThuHoc LopHocPhan phải 2..7 → Error 3819
SAVEPOINT sp10d;
INSERT INTO LopHocPhan (MaLHP, MaHP, MaGV, MaHocKy, ThuHoc, TietBatDau, SoTiet)
VALUES ('LHP_TEST_99', '104121000', 'GV000001', 'HK1_2526', 1, 1, 3);
-- Kết quả mong đợi: Error 3819 – Check constraint 'CK_LHP_Thu' violated (ThuHoc=1 không hợp lệ)
ROLLBACK TO SAVEPOINT sp10d;
RELEASE SAVEPOINT sp10d;

-- [10.E] UNIQUE + Trigger – SV đăng ký trùng lớp
-- Lần 1: thành công
INSERT INTO DangKyHocPhan (MaSV, MaLHP)
VALUES ('2354010009', 'LHP_001215_01');

-- Lần 2: trigger BEFORE chặn trước → Error 1644
SAVEPOINT sp10e;
INSERT INTO DangKyHocPhan (MaSV, MaLHP)
VALUES ('2354010009', 'LHP_001215_01');
-- Kết quả mong đợi: Error 1644 – "Sinh viên đã đăng ký lớp này rồi."
ROLLBACK TO SAVEPOINT sp10e;
RELEASE SAVEPOINT sp10e;

-- [10.F] FOREIGN KEY – MaNganh không tồn tại → Error 1452
SAVEPOINT sp10f;
INSERT INTO SinhVien (MaSV, HoTen, NgaySinh, GioiTinh, Email, MaNganh, NamNhapHoc)
VALUES ('0000000001', 'FK Test', '2000-01-01', 'Nam', 'fktest@uth.edu.vn', 'FAKE01', 2024);
-- Kết quả mong đợi: Error 1452 – Cannot add or update a child row: a foreign key constraint fails
ROLLBACK TO SAVEPOINT sp10f;
RELEASE SAVEPOINT sp10f;

-- [10.G] CK_TK_User – TaiKhoan không được link cả SV lẫn GV → Error 3819
SAVEPOINT sp10g;
INSERT INTO TaiKhoan (TenDangNhap, MatKhau, VaiTro, MaSV, MaGV)
VALUES ('test_bad', 'hashed', 'SinhVien', '2254010001', 'GV000001');
-- Kết quả mong đợi: Error 3819 – Check constraint 'CK_TK_User' violated
ROLLBACK TO SAVEPOINT sp10g;
RELEASE SAVEPOINT sp10g;


-- ===========================================================
-- 11. KIỂM TRA TOÀN VẸN DỮ LIỆU CUỐI PHIÊN
-- ===========================================================

-- [11.A] SiSoHienTai phải khớp với số đăng ký thực tế
SELECT
    lhp.MaLHP,
    lhp.SiSoHienTai                    AS SiSo_DB,
    COUNT(dk.MaDK)                      AS SiSo_Thuc,
    lhp.SiSoHienTai - COUNT(dk.MaDK)  AS ChenhLech
FROM LopHocPhan lhp
LEFT JOIN DangKyHocPhan dk
       ON lhp.MaLHP     = dk.MaLHP
      AND dk.TrangThai  = 'Đã đăng ký'
GROUP BY lhp.MaLHP, lhp.SiSoHienTai
HAVING ChenhLech <> 0;
-- Kết quả mong đợi: 0 hàng (không có chênh lệch)
-- Nếu có hàng → trigger hoặc seed data đang sai

-- [11.B] TrangThai lớp phải khớp với sĩ số
SELECT MaLHP, SiSoHienTai, SiSoToiDa, TrangThai,
       CASE
           WHEN TrangThai = 'Đã đầy'  AND SiSoHienTai < SiSoToiDa  THEN 'SAI: Đầy nhưng còn chỗ'
           WHEN TrangThai = 'Đang mở' AND SiSoHienTai >= SiSoToiDa THEN 'SAI: Mở nhưng đã đầy'
           ELSE 'OK'
       END AS KiemTra
FROM   LopHocPhan
WHERE  TrangThai IN ('Đang mở', 'Đã đầy')
HAVING KiemTra <> 'OK';
-- Kết quả mong đợi: 0 hàng

-- [11.C] Điểm phải link đúng đăng ký (không có orphan)
SELECT d.MaDiem, d.MaDK
FROM   Diem d
LEFT   JOIN DangKyHocPhan dk ON d.MaDK = dk.MaDK
WHERE  dk.MaDK IS NULL;
-- Kết quả mong đợi: 0 hàng

-- [11.D] TaiKhoan không được link cả SV lẫn GV
SELECT MaTK, TenDangNhap, VaiTro, MaSV, MaGV
FROM   TaiKhoan
WHERE  MaSV IS NOT NULL AND MaGV IS NOT NULL;
-- Kết quả mong đợi: 0 hàng

-- [11.E] TaiKhoan SinhVien phải khớp với SinhVien
SELECT tk.TenDangNhap, tk.MaSV
FROM   TaiKhoan tk
LEFT   JOIN SinhVien sv ON tk.MaSV = sv.MaSV
WHERE  tk.VaiTro = 'SinhVien' AND sv.MaSV IS NULL;
-- Kết quả mong đợi: 0 hàng

-- [11.F] TaiKhoan GiangVien phải khớp với GiangVien
SELECT tk.TenDangNhap, tk.MaGV
FROM   TaiKhoan tk
LEFT   JOIN GiangVien gv ON tk.MaGV = gv.MaGV
WHERE  tk.VaiTro = 'GiangVien' AND gv.MaGV IS NULL;
-- Kết quả mong đợi: 0 hàng

-- [11.G] DiemTK đã nhập phải khớp với công thức
SELECT d.MaDiem, d.DiemQT, d.DiemThi, d.DiemTK,
       ROUND(d.DiemQT * 0.4 + d.DiemThi * 0.6, 2) AS DiemTK_Verify,
       ABS(d.DiemTK - ROUND(d.DiemQT * 0.4 + d.DiemThi * 0.6, 2)) AS SaiSo
FROM   Diem d
WHERE  d.DiemQT IS NOT NULL
  AND  d.DiemThi IS NOT NULL
  AND  ABS(d.DiemTK - ROUND(d.DiemQT * 0.4 + d.DiemThi * 0.6, 2)) > 0.01;
-- Kết quả mong đợi: 0 hàng (generated column luôn đúng công thức)


-- ===========================================================
-- HOÀN THÀNH
-- ===========================================================
SELECT 'TEST V2 HOÀN THÀNH' AS KetQua,
        NOW()               AS ThoiGianChay,
        'QLDangKyHP'        AS Database_Name,
        VERSION()           AS MySQL_Version;
