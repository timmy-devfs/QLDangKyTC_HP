-- ============================================================
-- FILE: database/test_script.sql
-- DBMS: MySQL 8.0+
-- Mục đích: Kiểm thử toàn bộ database objects sau migration
--
-- ĐỐI TƯỢNG ĐƯỢC TEST:
--   VIEWS       : V_BangDiemSinhVien | V_GPA_HocKy | V_GPA_TichLuy
--   STORED PROCS: sp_MoLopHocPhan | sp_DongLopHocPhan
--                 sp_LayLopConCho | sp_ThongKeDangKy
--   TRIGGERS    : trg_KiemTraDangKyHopLe (BEFORE INSERT - chặn)
--                 trg_CapNhatSiSo_Insert  (AFTER INSERT - tăng sĩ số)
--                 trg_CapNhatSiSo_Delete  (AFTER DELETE - giảm sĩ số)
--   COMPUTED    : DiemTK | XepLoai  (GENERATED ALWAYS STORED)
--   INDEXES     : IX_SV_Nganh | IX_LHP_HP_HK | IX_LHP_GV
--
-- CÁCH DÙNG:
--   1. Chạy toàn bộ schema.sql + seed_data.sql TRƯỚC
--   2. Chạy stored_procs.sql + triggers.sql
--   3. Chạy file này từ đầu đến cuối
--   4. So sánh kết quả với comment "-- Kết quả mong đợi"
--
-- RUN MODE:
--   Chạy từng khối độc lập (bắt đầu bằng SELECT/CALL/...)
--   Không cần comment bỏ bất kỳ dòng nào trừ khi có ghi chú rõ.
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
-- Kết quả mong đợi: 10 bảng — Diem, DangKyHocPhan, DieuKienHP,
--   ChuongTrinhKhung, HocKy, HocPhan, GiangVien, LopHocPhan, Nganh,
--   SinhVien, TaiKhoan, Khoa

-- [0.B] Kiểm tra Views
SELECT TABLE_NAME, VIEW_DEFINITION IS NOT NULL AS CoDefinition
FROM   information_schema.VIEWS
WHERE  TABLE_SCHEMA = 'QLDangKyHP';
-- Kết quả mong đợi: V_BangDiemSinhVien, V_GPA_HocKy, V_GPA_TichLuy

-- [0.C] Kiểm tra Stored Procedures
SELECT ROUTINE_NAME, ROUTINE_TYPE, CREATED
FROM   information_schema.ROUTINES
WHERE  ROUTINE_SCHEMA = 'QLDangKyHP'
  AND  ROUTINE_TYPE   = 'PROCEDURE'
ORDER  BY ROUTINE_NAME;
-- Kết quả mong đợi: sp_DongLopHocPhan, sp_LayLopConCho,
--   sp_MoLopHocPhan, sp_ThongKeDangKy

-- [0.D] Kiểm tra Triggers
SELECT TRIGGER_NAME, EVENT_MANIPULATION, ACTION_TIMING, EVENT_OBJECT_TABLE
FROM   information_schema.TRIGGERS
WHERE  TRIGGER_SCHEMA = 'QLDangKyHP'
ORDER  BY EVENT_OBJECT_TABLE, ACTION_TIMING, EVENT_MANIPULATION;
-- Kết quả mong đợi: 3 triggers trên bảng DangKyHocPhan:
--   trg_KiemTraDangKyHopLe  BEFORE INSERT DangKyHocPhan
--   trg_CapNhatSiSo_Insert   AFTER  INSERT DangKyHocPhan
--   trg_CapNhatSiSo_Delete   AFTER  DELETE DangKyHocPhan

-- [0.E] Kiểm tra Indexes trên LopHocPhan và SinhVien
SELECT TABLE_NAME, INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS Columns
FROM   information_schema.STATISTICS
WHERE  TABLE_SCHEMA = 'QLDangKyHP'
  AND  INDEX_NAME  IN ('IX_SV_Nganh', 'IX_LHP_HP_HK', 'IX_LHP_GV')
GROUP  BY TABLE_NAME, INDEX_NAME;
-- Kết quả mong đợi:
--   SinhVien   | IX_SV_Nganh  | MaNganh,NamNhapHoc
--   LopHocPhan | IX_LHP_HP_HK | MaHP,MaHocKy
--   LopHocPhan | IX_LHP_GV    | MaGV,MaHocKy,ThuHoc,TietBatDau

-- [0.F] Kiểm tra Computed Columns (Generated) trên Diem
SELECT COLUMN_NAME, GENERATION_EXPRESSION, EXTRA
FROM   information_schema.COLUMNS
WHERE  TABLE_SCHEMA = 'QLDangKyHP'
  AND  TABLE_NAME   = 'Diem'
  AND  EXTRA LIKE '%GENERATED%';
-- Kết quả mong đợi: DiemTK và XepLoai đều có EXTRA = 'STORED GENERATED'


-- ===========================================================
-- 1. TEST STORED PROCEDURE: sp_MoLopHocPhan
-- ===========================================================

-- Trước test: xem trạng thái lớp & học kỳ
SELECT MaLHP, MaHocKy, TrangThai, SiSoHienTai, SiSoToiDa
FROM   LopHocPhan
WHERE  MaLHP IN ('LHP_121000_01', 'LHP_121000_02')
ORDER  BY MaLHP;

SELECT MaHocKy, TenHocKy, TrangThai
FROM   HocKy
ORDER  BY NamHoc DESC, HocKySo;

-- [1.A] Test happy path – mở lớp thành công
CALL sp_MoLopHocPhan('LHP_121000_01', 'HK1_2526');
-- Kết quả mong đợi: KetQua = 0, ThongBao = 'Mở lớp thành công.'

-- Xác nhận lớp đã được cập nhật
SELECT MaLHP, MaHocKy, TrangThai FROM LopHocPhan WHERE MaLHP = 'LHP_121000_01';
-- Kết quả mong đợi: MaHocKy = 'HK1_2526', TrangThai = 'Đang mở'

-- [1.B] Test lỗi – lớp không tồn tại
-- Kết quả mong đợi: Error 1644 – "Lớp học phần không tồn tại."
CALL sp_MoLopHocPhan('LHP_99999_XX', 'HK1_2526');

-- [1.C] Test lỗi – học kỳ không ở trạng thái hợp lệ
-- Giả sử HK1_2425 đang ở trạng thái 'Kết thúc'
-- Kết quả mong đợi: Error 1644 – "Học kỳ không ở trạng thái có thể mở lớp."
-- CALL sp_MoLopHocPhan('LHP_121000_02', 'HK1_2425');


-- ===========================================================
-- 2. TEST STORED PROCEDURE: sp_DongLopHocPhan
-- ===========================================================

-- [2.A] Test happy path – đóng lớp đang mở
CALL sp_DongLopHocPhan('LHP_121000_01');
-- Kết quả mong đợi: KetQua = 0, ThongBao = 'Đóng lớp thành công.'

SELECT MaLHP, TrangThai FROM LopHocPhan WHERE MaLHP = 'LHP_121000_01';
-- Kết quả mong đợi: TrangThai = 'Đã đóng'

-- [2.B] Test lỗi – đóng lớp đã đóng (ROW_COUNT = 0 → SIGNAL)
-- Kết quả mong đợi: Error 1644 – "Không thể đóng lớp (lớp không tồn tại hoặc đã đóng)."
CALL sp_DongLopHocPhan('LHP_121000_01');

-- Mở lại để test tiếp
CALL sp_MoLopHocPhan('LHP_121000_01', 'HK1_2526');


-- ===========================================================
-- 3. TEST TRIGGER: trg_KiemTraDangKyHopLe (BEFORE INSERT)
-- ===========================================================

-- Chuẩn bị: xem trạng thái lớp trước
SELECT MaLHP, SiSoHienTai, SiSoToiDa, TrangThai
FROM   LopHocPhan
WHERE  MaLHP = 'LHP_121000_01';

-- [3.A] Test happy path – đăng ký bình thường
-- NgayDangKy và TrangThai sẽ được trigger điền tự động nếu NULL
INSERT INTO DangKyHocPhan (MaSV, MaLHP)
VALUES ('2354010001', 'LHP_121000_01');
-- Kết quả mong đợi: INSERT thành công, TrangThai tự = 'Đã đăng ký', NgayDangKy tự fill

SELECT MaDK, MaSV, MaLHP, NgayDangKy, TrangThai
FROM   DangKyHocPhan
WHERE  MaSV = '2354010001' AND MaLHP = 'LHP_121000_01';

-- [3.B] Test trigger trg_CapNhatSiSo_Insert – SiSoHienTai phải tăng
SELECT MaLHP, SiSoHienTai, TrangThai
FROM   LopHocPhan
WHERE  MaLHP = 'LHP_121000_01';
-- Kết quả mong đợi: SiSoHienTai đã tăng 1 so với trước INSERT

-- [3.C] Test lỗi – SV đăng ký trùng lớp
-- Kết quả mong đợi: Error 1644 – "Sinh viên đã đăng ký lớp này rồi."
INSERT INTO DangKyHocPhan (MaSV, MaLHP)
VALUES ('2354010001', 'LHP_121000_01');

-- [3.D] Test lỗi – lớp đã đầy
-- Đưa SiSoHienTai = SiSoToiDa để mô phỏng lớp đầy
UPDATE LopHocPhan SET SiSoHienTai = SiSoToiDa WHERE MaLHP = 'LHP_121000_01';

-- Kết quả mong đợi: Error 1644 – "Lớp học phần đã đầy, không thể đăng ký."
INSERT INTO DangKyHocPhan (MaSV, MaLHP)
VALUES ('2354010012', 'LHP_121000_01');

-- Phục hồi sĩ số đúng
UPDATE LopHocPhan
SET SiSoHienTai = (
    SELECT COUNT(*) FROM DangKyHocPhan
    WHERE  MaLHP = 'LHP_121000_01' AND TrangThai = 'Đã đăng ký'
)
WHERE MaLHP = 'LHP_121000_01';


-- ===========================================================
-- 4. TEST TRIGGER: trg_CapNhatSiSo_Delete (AFTER DELETE)
-- ===========================================================

-- [4.A] Lấy MaDK của SV để test
SELECT MaDK, MaSV, MaLHP, TrangThai
FROM   DangKyHocPhan
WHERE  MaSV = '2354010001' AND MaLHP = 'LHP_121000_01';

-- Ghi nhớ SiSoHienTai trước
SELECT MaLHP, SiSoHienTai FROM LopHocPhan WHERE MaLHP = 'LHP_121000_01';

-- [4.B] Xóa đăng ký – trigger phải giảm SiSoHienTai
DELETE FROM DangKyHocPhan
WHERE  MaSV  = '2354010001'
  AND  MaLHP = 'LHP_121000_01';
-- Kết quả mong đợi: DELETE thành công

-- Xác nhận SiSoHienTai đã giảm 1
SELECT MaLHP, SiSoHienTai, TrangThai
FROM   LopHocPhan
WHERE  MaLHP = 'LHP_121000_01';
-- Kết quả mong đợi: SiSoHienTai = giá trị trước - 1
-- Nếu lớp đang 'Đã đầy' → tự đổi về 'Đang mở'


-- ===========================================================
-- 5. TEST COMPUTED COLUMNS: DiemTK, XepLoai
-- ===========================================================

-- Chuẩn bị: đăng ký SV và lấy MaDK
INSERT INTO DangKyHocPhan (MaSV, MaLHP)
VALUES ('2354010002', 'LHP_121000_01');

SELECT MaDK FROM DangKyHocPhan
WHERE  MaSV = '2354010002' AND MaLHP = 'LHP_121000_01' AND TrangThai = 'Đã đăng ký';
-- Lấy giá trị MaDK để dùng ở các bước dưới

-- [5.A] Nhập điểm – MySQL tự tính DiemTK và XepLoai
INSERT INTO Diem (MaDK, DiemQT, DiemThi)
VALUES (LAST_INSERT_ID(), 8.0, 9.0);
-- DiemTK  = 8.0*0.4 + 9.0*0.6 = 3.2 + 5.4 = 8.6 → loại A

SELECT MaDiem, MaDK, DiemQT, DiemThi, DiemTK, XepLoai
FROM   Diem
WHERE  MaDK = (
    SELECT MaDK FROM DangKyHocPhan
    WHERE  MaSV = '2354010002' AND MaLHP = 'LHP_121000_01' AND TrangThai = 'Đã đăng ký'
);
-- Kết quả mong đợi: DiemTK = 8.60, XepLoai = 'A'

-- [5.B] Cập nhật điểm – kiểm tra tính toán lại tự động
UPDATE Diem
SET    DiemQT = 3.0, DiemThi = 3.0
WHERE  MaDK = (
    SELECT MaDK FROM DangKyHocPhan
    WHERE  MaSV = '2354010002' AND MaLHP = 'LHP_121000_01' AND TrangThai = 'Đã đăng ký'
);
-- DiemTK = 3.0*0.4 + 3.0*0.6 = 3.0 → loại F

SELECT DiemQT, DiemThi, DiemTK, XepLoai
FROM   Diem
WHERE  MaDK = (
    SELECT MaDK FROM DangKyHocPhan
    WHERE  MaSV = '2354010002' AND MaLHP = 'LHP_121000_01' AND TrangThai = 'Đã đăng ký'
);
-- Kết quả mong đợi: DiemTK = 3.00, XepLoai = 'F'

-- [5.C] Test CHECK CONSTRAINT – điểm ngoài khoảng [0, 10]
-- Kết quả mong đợi: Error 3819 – Check constraint violated
INSERT INTO Diem (MaDK, DiemQT, DiemThi)
VALUES (99999, -1.0, 11.0);

-- [5.D] Test boundary – điểm vừa đủ từng mức
-- A: DiemTK >= 8.5 → dq=9.0, dt=9.0 → TK=9.0
-- B: 7.0 <= DiemTK < 8.5 → dq=7.0, dt=7.0 → TK=7.0
-- C: 5.5 <= DiemTK < 7.0 → dq=6.0, dt=5.5 → TK=3.6+3.3=5.7
-- D: 4.0 <= DiemTK < 5.5 → dq=4.0, dt=4.0 → TK=4.0
-- F: DiemTK < 4.0          → dq=3.0, dt=3.0 → TK=3.0
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
    SELECT  9.0 AS DiemQT,  9.0 AS DiemThi UNION ALL  -- A
    SELECT  7.0,             7.0           UNION ALL   -- B
    SELECT  6.0,             5.5           UNION ALL   -- C (5.7)
    SELECT  4.0,             4.0           UNION ALL   -- D
    SELECT  3.0,             3.0                        -- F
) boundary;


-- ===========================================================
-- 6. TEST STORED PROCEDURE: sp_LayLopConCho
-- ===========================================================

-- [6.A] Lấy danh sách lớp còn chỗ HK1_2526
CALL sp_LayLopConCho('HK1_2526');
-- Kết quả mong đợi: danh sách lớp TrangThai='Đang mở' và SiSoHienTai < SiSoToiDa
-- Cột SoChoConLai = SiSoToiDa - SiSoHienTai

-- [6.B] Test với HK không có lớp nào mở
CALL sp_LayLopConCho('HK1_2122');
-- Kết quả mong đợi: 0 hàng


-- ===========================================================
-- 7. TEST STORED PROCEDURE: sp_ThongKeDangKy
-- ===========================================================

-- [7.A] Thống kê theo học kỳ cụ thể
CALL sp_ThongKeDangKy('HK1_2526');
-- Kết quả mong đợi: danh sách lớp với:
--   SoDangKy    = số SV đã đăng ký còn hiệu lực
--   SoDat       = số có XepLoai A/B/C/D
--   SoRot       = số có XepLoai F
--   ChuaCoDiem  = số chưa nhập điểm
--   DiemTBLop   = trung bình DiemTK của lớp
--   TiLeLapDay  = % lấp đầy

-- [7.B] Thống kê tất cả học kỳ (NULL = không lọc)
CALL sp_ThongKeDangKy(NULL);
-- Kết quả mong đợi: toàn bộ lớp trên mọi học kỳ


-- ===========================================================
-- 8. TEST VIEWS
-- ===========================================================

-- [8.A] V_BangDiemSinhVien – kiểm tra dữ liệu đầy đủ
SELECT *
FROM   V_BangDiemSinhVien
WHERE  MaSV = '2354010002'
ORDER  BY TenHocKy;
-- Kết quả mong đợi: hiển thị điểm SV '2354010002' kèm TenHP, TenHocKy

-- [8.B] V_BangDiemSinhVien – kiểm tra bao gồm trạng thái 'Hoàn thành'
SELECT MaSV, TenHP, TenHocKy, DiemTK, XepLoai
FROM   V_BangDiemSinhVien
WHERE  DiemTK IS NOT NULL
ORDER  BY MaSV, TenHocKy
LIMIT  20;
-- Kết quả mong đợi: tất cả bản ghi điểm đã nhập (cả 'Đã đăng ký' + 'Hoàn thành')

-- [8.C] V_GPA_HocKy – GPA từng học kỳ
SELECT *
FROM   V_GPA_HocKy
WHERE  MaSV = '2354010002';
-- Kết quả mong đợi:
--   TongTCTinhGPA = tổng TC các môn CoTinhGPA=1 đã có điểm
--   GPA_HocKy     = điểm GPA từng HK (thang 10)

-- [8.D] V_GPA_TichLuy – GPA tích lũy toàn khóa
SELECT *
FROM   V_GPA_TichLuy
WHERE  MaSV = '2354010002';
-- Kết quả mong đợi:
--   TongTCTichLuy = tổng TC tích lũy đến hiện tại
--   GPA_TichLuy   = điểm GPA tổng (thang 10)

-- [8.E] Sinh viên chưa có điểm → GPA_TichLuy phải là NULL (NULLIF xử lý)
SELECT MaSV, HoTen, GPA_TichLuy
FROM   V_GPA_TichLuy
WHERE  MaSV = '2354010001';  -- SV vừa bị xóa đăng ký ở test 4.B
-- Kết quả mong đợi: GPA_TichLuy = NULL (không tính được)


-- ===========================================================
-- 9. TEST INDEXES – EXPLAIN kiểm tra query dùng đúng index
-- ===========================================================

-- [9.A] IX_SV_Nganh – lọc SV theo Nganh
EXPLAIN
SELECT * FROM SinhVien WHERE MaNganh = 'CNTT01' AND NamNhapHoc = 2023;
-- Kết quả mong đợi: type = 'ref', key = 'IX_SV_Nganh'

-- [9.B] IX_LHP_HP_HK – lọc LopHocPhan theo HP trong HK
EXPLAIN
SELECT * FROM LopHocPhan WHERE MaHP = '121000001' AND MaHocKy = 'HK1_2526';
-- Kết quả mong đợi: type = 'ref', key = 'IX_LHP_HP_HK'

-- [9.C] IX_LHP_GV – lịch dạy của GV trong HK
EXPLAIN
SELECT * FROM LopHocPhan
WHERE  MaGV    = 'GV000001'
  AND  MaHocKy = 'HK1_2526'
  AND  ThuHoc  = 2;
-- Kết quả mong đợi: type = 'ref', key = 'IX_LHP_GV'


-- ===========================================================
-- 10. TEST CONSTRAINTS
-- ===========================================================

-- [10.A] CHECK constraint HocKySo phải là 1, 2, hoặc 3
-- Kết quả mong đợi: Error 3819 – Check constraint violated
INSERT INTO HocKy (MaHocKy, TenHocKy, NamHoc, HocKySo)
VALUES ('HK4_2526', 'Học kỳ 4 - 2025-2026', '2025-2026', 4);

-- [10.B] CHECK constraint TrangThai của HocKy
-- Kết quả mong đợi: Error 3819 – Check constraint violated
INSERT INTO HocKy (MaHocKy, TenHocKy, NamHoc, HocKySo, TrangThai)
VALUES ('HK1_9999', 'Test', '9999-9999', 1, 'Trang thai sai');

-- [10.C] CHECK constraint GioiTinh của SinhVien
-- Kết quả mong đợi: Error 3819 – Check constraint violated
INSERT INTO SinhVien (MaSV, HoTen, NgaySinh, GioiTinh, Email, MaNganh, NamNhapHoc)
VALUES ('9999999999', 'Test SV', '2000-01-01', 'Other', 'test@test.com', 'CNTT01', 2024);

-- [10.D] CHECK constraint LopHocPhan – ThuHoc phải là 2..7
-- Kết quả mong đợi: Error 3819 – Check constraint violated
-- (Dùng dữ liệu MaHP, MaGV, MaHocKy có sẵn)
INSERT INTO LopHocPhan (MaLHP, MaHP, MaGV, MaHocKy, ThuHoc, TietBatDau, SoTiet)
VALUES ('LHP_TEST_99', '121000001', 'GV000001', 'HK1_2526', 1, 1, 3);
-- ThuHoc = 1 không hợp lệ → phải báo lỗi

-- [10.E] UNIQUE constraint DangKyHocPhan – 1 SV chỉ đăng ký 1 lần / lớp
-- (Trigger đã chặn ở BEFORE INSERT, nhưng UNIQUE KEY là lớp backup)
-- Test với cùng SV, cùng MaLHP nhưng trigger không catch:
INSERT INTO DangKyHocPhan (MaSV, MaLHP)
VALUES ('2354010003', 'LHP_121000_01');
INSERT INTO DangKyHocPhan (MaSV, MaLHP)
VALUES ('2354010003', 'LHP_121000_01');
-- Kết quả mong đợi: dòng 2 bị trigger chặn trước (Error 1644 "Sinh viên đã đăng ký")


-- ===========================================================
-- 11. KIỂM TRA TOÀN VẸN DỮ LIỆU CUỐI PHIÊN
-- ===========================================================

-- [11.A] Đảm bảo SiSoHienTai = số đăng ký thực tế
SELECT
    lhp.MaLHP,
    lhp.SiSoHienTai                       AS SiSo_DB,
    COUNT(dk.MaDK)                         AS SiSo_Thuc,
    lhp.SiSoHienTai - COUNT(dk.MaDK)     AS ChenhLech
FROM LopHocPhan lhp
LEFT JOIN DangKyHocPhan dk
       ON lhp.MaLHP = dk.MaLHP
      AND dk.TrangThai = 'Đã đăng ký'
GROUP BY lhp.MaLHP, lhp.SiSoHienTai
HAVING ChenhLech <> 0;
-- Kết quả mong đợi: 0 hàng (không có chênh lệch)
-- Nếu có hàng → trigger chưa hoạt động đúng hoặc có UPDATE thủ công sai

-- [11.B] Đảm bảo TrangThai lớp khớp với sĩ số
SELECT MaLHP, SiSoHienTai, SiSoToiDa, TrangThai,
       CASE
           WHEN TrangThai = 'Đã đầy'  AND SiSoHienTai < SiSoToiDa THEN 'SAI: Đầy nhưng còn chỗ'
           WHEN TrangThai = 'Đang mở' AND SiSoHienTai >= SiSoToiDa THEN 'SAI: Mở nhưng đã đầy'
           ELSE 'OK'
       END AS KiemTra
FROM LopHocPhan
WHERE TrangThai IN ('Đang mở', 'Đã đầy')
HAVING KiemTra <> 'OK';
-- Kết quả mong đợi: 0 hàng

-- [11.C] Đảm bảo mỗi bộ điểm link đúng đăng ký
SELECT d.MaDiem, d.MaDK, dk.MaSV, dk.TrangThai
FROM   Diem d
LEFT   JOIN DangKyHocPhan dk ON d.MaDK = dk.MaDK
WHERE  dk.MaDK IS NULL;
-- Kết quả mong đợi: 0 hàng (không có điểm orphan)

-- [11.D] TaiKhoan phải link đúng SV hoặc GV, không link cả hai
SELECT MaTK, TenDangNhap, VaiTro, MaSV, MaGV
FROM   TaiKhoan
WHERE  MaSV IS NOT NULL AND MaGV IS NOT NULL;
-- Kết quả mong đợi: 0 hàng (do CHECK constraint CK_TK_User)

-- ===========================================================
-- HOÀN THÀNH – Tổng kết
-- ===========================================================
SELECT
    'TEST HOÀN THÀNH' AS KetQua,
    NOW()             AS ThoiGianChay,
    'QLDangKyHP'      AS Database_Name;
