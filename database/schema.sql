CREATE DATABASE IF NOT EXISTS QLDangKyHP CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE QLDangKyHP;

DROP TABLE IF EXISTS Diem;

DROP TABLE IF EXISTS DangKyHocPhan;

DROP TABLE IF EXISTS LopHocPhan;

DROP TABLE IF EXISTS TaiKhoan;

DROP TABLE IF EXISTS SinhVien;

DROP TABLE IF EXISTS DieuKienHP;

DROP TABLE IF EXISTS ChuongTrinhKhung;

DROP TABLE IF EXISTS HocPhan;

DROP TABLE IF EXISTS HocKy;

DROP TABLE IF EXISTS GiangVien;

DROP TABLE IF EXISTS Nganh;

DROP TABLE IF EXISTS Khoa;

-- ============================================================
-- 1. KHOA
-- ============================================================
CREATE TABLE Khoa (
    MaKhoa CHAR(6) NOT NULL,
    TenKhoa VARCHAR(100) NOT NULL,
    DiaChi VARCHAR(200),
    SoDienThoai VARCHAR(15),
    CONSTRAINT PK_Khoa PRIMARY KEY (MaKhoa)
);

-- ============================================================
-- 2. NGANH
-- ============================================================
CREATE TABLE Nganh (
    MaNganh CHAR(6) NOT NULL,
    TenNganh VARCHAR(100) NOT NULL,
    MaKhoa CHAR(6) NOT NULL,
    TongTinChi INT NOT NULL DEFAULT 120,
    CONSTRAINT PK_Nganh PRIMARY KEY (MaNganh),
    CONSTRAINT FK_Nganh_Khoa FOREIGN KEY (MaKhoa) REFERENCES Khoa (MaKhoa)
);

-- ============================================================
-- 3. HOC PHAN
-- ============================================================
CREATE TABLE HocPhan (
    MaHP CHAR(9) NOT NULL,
    TenHP VARCHAR(200) NOT NULL,
    SoTinChi TINYINT NOT NULL,
    CoTinhGPA BOOLEAN NOT NULL DEFAULT 1, -- 0 = môn (*) không tính GPA
    MaKhoa CHAR(6),
    CONSTRAINT PK_HocPhan PRIMARY KEY (MaHP),
    CONSTRAINT FK_HP_Khoa FOREIGN KEY (MaKhoa) REFERENCES Khoa (MaKhoa),
    CONSTRAINT CK_HP_TC CHECK (SoTinChi BETWEEN 1 AND 15)
);

-- ============================================================
-- 4. DIEU KIEN HOC PHAN (học phần trước)
--    1 HP có thể có NHIỀU điều kiện tiên quyết → bảng riêng
-- ============================================================
CREATE TABLE DieuKienHP (
    MaHP CHAR(9) NOT NULL, -- HP cần đăng ký
    MaHPTruoc CHAR(9) NOT NULL, -- HP phải học trước
    LoaiDK CHAR(1) NOT NULL DEFAULT 'a',
    -- a=học trước, b=tiên quyết, c=song hành
    CONSTRAINT PK_DieuKienHP PRIMARY KEY (MaHP, MaHPTruoc),
    CONSTRAINT FK_DK_HP FOREIGN KEY (MaHP) REFERENCES HocPhan (MaHP),
    CONSTRAINT FK_DK_HPTruoc FOREIGN KEY (MaHPTruoc) REFERENCES HocPhan (MaHP),
    CONSTRAINT CK_DK_Loai CHECK (LoaiDK IN ('a', 'b', 'c'))
);

-- ============================================================
-- 5. CHUONG TRINH KHUNG
--    Quy định HP nào thuộc HK nào, bắt buộc hay tự chọn
-- ============================================================
CREATE TABLE ChuongTrinhKhung (
    MaNganh CHAR(6) NOT NULL,
    MaHP CHAR(9) NOT NULL,
    HocKyDeNghi TINYINT NOT NULL, -- HK khuyến nghị (1-9)
    LoaiHP CHAR(2) NOT NULL, -- BB=bắt buộc, TC=tự chọn
    CONSTRAINT PK_CTK PRIMARY KEY (MaNganh, MaHP),
    CONSTRAINT FK_CTK_Nganh FOREIGN KEY (MaNganh) REFERENCES Nganh (MaNganh),
    CONSTRAINT FK_CTK_HP FOREIGN KEY (MaHP) REFERENCES HocPhan (MaHP),
    CONSTRAINT CK_CTK_Loai CHECK (LoaiHP IN ('BB', 'TC')),
    CONSTRAINT CK_CTK_HK CHECK (HocKyDeNghi BETWEEN 1 AND 12)
);

-- ============================================================
-- 6. HOC KY
-- ============================================================
CREATE TABLE HocKy (
    MaHocKy CHAR(10) NOT NULL, -- VD: HK1_2425
    TenHocKy VARCHAR(50) NOT NULL, -- "Học kỳ 1 - 2024-2025"
    NamHoc CHAR(9) NOT NULL, -- "2024-2025"
    HocKySo TINYINT NOT NULL, -- 1, 2, 3 (hè)
    NgayBatDauDK DATE,
    NgayKetThucDK DATE,
    NgayBatDauHoc DATE,
    NgayKetThucHoc DATE,
    TrangThai VARCHAR(20) NOT NULL DEFAULT 'Chưa mở',
    CONSTRAINT PK_HocKy PRIMARY KEY (MaHocKy),
    CONSTRAINT CK_HK_So CHECK (HocKySo IN (1, 2, 3)),
    CONSTRAINT CK_HK_Status CHECK (
        TrangThai IN (
            'Chưa mở',
            'Đang mở đăng ký',
            'Đã đóng đăng ký',
            'Đang học',
            'Kết thúc'
        )
    )
);

-- ============================================================
-- 7. GIANG VIEN
-- ============================================================
CREATE TABLE GiangVien (
    MaGV CHAR(8) NOT NULL,
    HoTen VARCHAR(100) NOT NULL,
    GioiTinh VARCHAR(5) NOT NULL DEFAULT 'Nam',
    NgaySinh DATE,
    Email VARCHAR(100) NOT NULL UNIQUE,
    SoDienThoai VARCHAR(15),
    HocVi VARCHAR(20), -- ThS, TS, GS...
    MaKhoa CHAR(6),
    CONSTRAINT PK_GiangVien PRIMARY KEY (MaGV),
    CONSTRAINT FK_GV_Khoa FOREIGN KEY (MaKhoa) REFERENCES Khoa (MaKhoa),
    CONSTRAINT CK_GV_GT CHECK (GioiTinh IN ('Nam', 'Nữ'))
);

-- ============================================================
-- 8. LOP HOC PHAN
-- ============================================================
CREATE TABLE LopHocPhan (
    MaLHP CHAR(20) NOT NULL, -- VD: LHP_121000_01
    MaHP CHAR(9) NOT NULL,
    MaGV CHAR(8) NOT NULL,
    MaHocKy CHAR(10) NOT NULL,
    PhongHoc VARCHAR(20),
    ThuHoc TINYINT NOT NULL, -- 2=Thứ 2 ... 7=Thứ 7
    TietBatDau TINYINT NOT NULL, -- Tiết 1-12
    SoTiet TINYINT NOT NULL,
    SiSoToiDa SMALLINT NOT NULL DEFAULT 50,
    SiSoHienTai SMALLINT NOT NULL DEFAULT 0,
    TrangThai VARCHAR(20) NOT NULL DEFAULT 'Đang mở',
    CONSTRAINT PK_LopHocPhan PRIMARY KEY (MaLHP),
    CONSTRAINT FK_LHP_HP FOREIGN KEY (MaHP) REFERENCES HocPhan (MaHP),
    CONSTRAINT FK_LHP_GV FOREIGN KEY (MaGV) REFERENCES GiangVien (MaGV),
    CONSTRAINT FK_LHP_HK FOREIGN KEY (MaHocKy) REFERENCES HocKy (MaHocKy),
    CONSTRAINT CK_LHP_Thu CHECK (ThuHoc BETWEEN 2 AND 7),
    CONSTRAINT CK_LHP_Tiet CHECK (TietBatDau BETWEEN 1 AND 12),
    CONSTRAINT CK_LHP_SiSo CHECK (
        SiSoHienTai >= 0
        AND SiSoHienTai <= SiSoToiDa
    ),
    CONSTRAINT CK_LHP_Status CHECK (
        TrangThai IN (
            'Đang mở',
            'Đã đầy',
            'Đã đóng',
            'Đã hủy'
        )
    )
);

CREATE INDEX IX_LHP_HP_HK ON LopHocPhan (MaHP, MaHocKy);

CREATE INDEX IX_LHP_GV ON LopHocPhan (
    MaGV,
    MaHocKy,
    ThuHoc,
    TietBatDau
);

-- ============================================================
-- 9. SINH VIEN
-- ============================================================
CREATE TABLE SinhVien (
    MaSV CHAR(10) NOT NULL, -- VD: 2154010001
    HoTen VARCHAR(100) NOT NULL,
    NgaySinh DATE NOT NULL,
    GioiTinh VARCHAR(5) NOT NULL DEFAULT 'Nam',
    Email VARCHAR(100) NOT NULL UNIQUE,
    SoDienThoai VARCHAR(15),
    DiaChi VARCHAR(200),
    MaNganh CHAR(6) NOT NULL,
    NamNhapHoc SMALLINT NOT NULL,
    TrangThai VARCHAR(20) NOT NULL DEFAULT 'Đang học',
    CONSTRAINT PK_SinhVien PRIMARY KEY (MaSV),
    CONSTRAINT FK_SV_Nganh FOREIGN KEY (MaNganh) REFERENCES Nganh (MaNganh),
    CONSTRAINT CK_SV_GT CHECK (GioiTinh IN ('Nam', 'Nữ')),
    CONSTRAINT CK_SV_Status CHECK (
        TrangThai IN (
            'Đang học',
            'Bảo lưu',
            'Tốt nghiệp',
            'Thôi học'
        )
    )
);

CREATE INDEX IX_SV_Nganh ON SinhVien (MaNganh, NamNhapHoc);

-- ============================================================
-- 10. TAI KHOAN (đăng nhập hệ thống)
-- ============================================================
CREATE TABLE TaiKhoan (
    MaTK INT NOT NULL AUTO_INCREMENT,
    TenDangNhap VARCHAR(50) NOT NULL UNIQUE,
    MatKhau VARCHAR(255) NOT NULL, -- lưu hash
    VaiTro VARCHAR(20) NOT NULL DEFAULT 'SinhVien',
    MaSV CHAR(10) NULL,
    MaGV CHAR(8) NULL,
    TrangThai BOOLEAN NOT NULL DEFAULT 1, -- 1=active
    CONSTRAINT PK_TaiKhoan PRIMARY KEY (MaTK),
    CONSTRAINT FK_TK_SV FOREIGN KEY (MaSV) REFERENCES SinhVien (MaSV),
    CONSTRAINT FK_TK_GV FOREIGN KEY (MaGV) REFERENCES GiangVien (MaGV),
    CONSTRAINT CK_TK_VaiTro CHECK (
        VaiTro IN (
            'Admin',
            'GiangVien',
            'SinhVien'
        )
    ),
    -- Chỉ được link 1 trong 2: SV hoặc GV
    CONSTRAINT CK_TK_User CHECK (
        (
            MaSV IS NOT NULL
            AND MaGV IS NULL
        )
        OR (
            MaSV IS NULL
            AND MaGV IS NOT NULL
        )
        OR (
            MaSV IS NULL
            AND MaGV IS NULL
        )
    ) -- Admin không link
);

-- ============================================================
-- 11. DANG KY HOC PHAN
-- ============================================================
CREATE TABLE DangKyHocPhan (
    MaDK INT NOT NULL AUTO_INCREMENT,
    MaSV CHAR(10) NOT NULL,
    MaLHP CHAR(20) NOT NULL,
    NgayDangKy DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TrangThai VARCHAR(20) NOT NULL DEFAULT 'Đã đăng ký',
    CONSTRAINT PK_DangKy PRIMARY KEY (MaDK),
    CONSTRAINT FK_DK_SV FOREIGN KEY (MaSV) REFERENCES SinhVien (MaSV),
    CONSTRAINT FK_DK_LHP FOREIGN KEY (MaLHP) REFERENCES LopHocPhan (MaLHP),
    -- Mỗi SV chỉ đăng ký 1 lần cho mỗi lớp
    CONSTRAINT UQ_DK_SV_LHP UNIQUE (MaSV, MaLHP),
    CONSTRAINT CK_DK_Status CHECK (
        TrangThai IN (
            'Đã đăng ký',
            'Đã hủy',
            'Hoàn thành'
        )
    )
);

CREATE INDEX IX_DK_SV ON DangKyHocPhan (MaSV);

CREATE INDEX IX_DK_LHP ON DangKyHocPhan (MaLHP);

-- ============================================================
-- 12. DIEM
-- ============================================================
CREATE TABLE Diem (
    MaDiem INT NOT NULL AUTO_INCREMENT,
    MaDK INT NOT NULL UNIQUE, -- 1 đăng ký = 1 bộ điểm
    DiemQT DECIMAL(4, 2), -- Quá trình (40%)
    DiemThi DECIMAL(4, 2), -- Thi cuối kỳ (60%)
    DiemTK DECIMAL(4, 2) GENERATED ALWAYS AS (
        CASE
            WHEN DiemQT IS NOT NULL
            AND DiemThi IS NOT NULL THEN CAST(
                DiemQT * 0.4 + DiemThi * 0.6 AS DECIMAL(4, 2)
            )
            ELSE NULL
        END
    ) STORED,
    XepLoai VARCHAR(1) GENERATED ALWAYS AS (
        CASE
            WHEN DiemQT IS NULL
            OR DiemThi IS NULL THEN NULL
            WHEN DiemQT * 0.4 + DiemThi * 0.6 >= 8.5 THEN 'A'
            WHEN DiemQT * 0.4 + DiemThi * 0.6 >= 7.0 THEN 'B'
            WHEN DiemQT * 0.4 + DiemThi * 0.6 >= 5.5 THEN 'C'
            WHEN DiemQT * 0.4 + DiemThi * 0.6 >= 4.0 THEN 'D'
            ELSE 'F'
        END
    ) STORED,
    CONSTRAINT PK_Diem PRIMARY KEY (MaDiem),
    CONSTRAINT FK_Diem_DK FOREIGN KEY (MaDK) REFERENCES DangKyHocPhan (MaDK),
    CONSTRAINT CK_Diem_QT CHECK (
        DiemQT IS NULL
        OR (
            DiemQT >= 0
            AND DiemQT <= 10
        )
    ),
    CONSTRAINT CK_Diem_Thi CHECK (
        DiemThi IS NULL
        OR (
            DiemThi >= 0
            AND DiemThi <= 10
        )
    )
);

-- ============================================================
-- VIEWS HỮU ÍCH
-- ============================================================

-- View: Bảng điểm sinh viên
CREATE OR REPLACE VIEW V_BangDiemSinhVien AS
SELECT sv.MaSV, sv.HoTen AS TenSV, hp.MaHP, hp.TenHP, hp.SoTinChi, hk.TenHocKy, d.DiemQT, d.DiemThi, d.DiemTK, d.XepLoai, hp.CoTinhGPA, lhp.MaLHP
FROM
    DangKyHocPhan dk
    JOIN SinhVien sv ON dk.MaSV = sv.MaSV
    JOIN LopHocPhan lhp ON dk.MaLHP = lhp.MaLHP
    JOIN HocPhan hp ON lhp.MaHP = hp.MaHP
    JOIN HocKy hk ON lhp.MaHocKy = hk.MaHocKy
    LEFT JOIN Diem d ON dk.MaDK = d.MaDK
WHERE
    dk.TrangThai IN ('Đã đăng ký', 'Hoàn thành');
--   Bao gồm lịch sử đã hoàn thành

-- View: GPA từng học kỳ
CREATE OR REPLACE VIEW V_GPA_HocKy AS
SELECT
    v.MaSV,
    v.TenSV,
    v.TenHocKy,
    SUM(
        CASE
            WHEN v.CoTinhGPA = 1
            AND v.DiemTK IS NOT NULL THEN v.SoTinChi
            ELSE 0
        END
    ) AS TongTCTinhGPA,
    ROUND(
        SUM(
            CASE
                WHEN v.CoTinhGPA = 1
                AND v.DiemTK IS NOT NULL THEN v.DiemTK * v.SoTinChi
                ELSE 0
            END
        ) / NULLIF(
            SUM(
                CASE
                    WHEN v.CoTinhGPA = 1
                    AND v.DiemTK IS NOT NULL THEN v.SoTinChi
                    ELSE 0
                END
            ),
            0
        ),
        2
    ) AS GPA_HocKy
FROM V_BangDiemSinhVien v
GROUP BY
    v.MaSV,
    v.TenSV,
    v.TenHocKy;

-- View: GPA tích lũy
CREATE OR REPLACE VIEW V_GPA_TichLuy AS
SELECT
    sv.MaSV,
    sv.HoTen,
    SUM(
        CASE
            WHEN hp.CoTinhGPA = 1
            AND d.DiemTK IS NOT NULL THEN hp.SoTinChi
            ELSE 0
        END
    ) AS TongTCTichLuy,
    ROUND(
        SUM(
            CASE
                WHEN hp.CoTinhGPA = 1
                AND d.DiemTK IS NOT NULL THEN d.DiemTK * hp.SoTinChi
                ELSE 0
            END
        ) / NULLIF(
            SUM(
                CASE
                    WHEN hp.CoTinhGPA = 1
                    AND d.DiemTK IS NOT NULL THEN hp.SoTinChi
                    ELSE 0
                END
            ),
            0
        ),
        2
    ) AS GPA_TichLuy
FROM
    SinhVien sv
    LEFT JOIN DangKyHocPhan dk ON sv.MaSV = dk.MaSV
    AND dk.TrangThai IN ('Đã đăng ký', 'Hoàn thành') --   Đồng nhất với V_BangDiemSinhVien
    LEFT JOIN LopHocPhan lhp ON dk.MaLHP = lhp.MaLHP
    LEFT JOIN HocPhan hp ON lhp.MaHP = hp.MaHP
    LEFT JOIN Diem d ON dk.MaDK = d.MaDK
GROUP BY
    sv.MaSV,
    sv.HoTen;