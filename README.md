<div align="center">
  <h1 align="center">🎓 Quản lý Đăng ký Học phần Tín chỉ (QLDangKyHP)</h1>
  <p align="center">
    <strong>Dự án Hệ Quản trị Cơ sở dữ liệu — MySQL 8.0+ Migration & Code Audit</strong>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/MySQL_8.0+-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
    <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  </p>
</div>

<br />

## Giới thiệu dự án

Hệ thống **Quản lý Đăng ký Học phần** là một giải pháp quản lý đào tạo theo học chế tín chỉ, được xây dựng với kiến trúc **3-Tier** và chuẩn **RESTful API**. 

Dự án vừa hoàn thành giai đoạn **Migration & Optimization**:
- **Chuyển đổi hoàn toàn** từ SQL Server sang **MySQL 8.0+**.
- **Code Audit & Refactoring**: Chuẩn hóa toàn bộ mã nguồn Node.js, dọn dẹp Dead Code, và tối ưu hóa xử lý ngoại lệ tập trung.
- **Database-First Logic**: Đẩy các ràng buộc nghiệp vụ phức tạp xuống tầng CSDL thông qua Triggers và Stored Procedures để đảm bảo hiệu năng và tính toàn vẹn dữ liệu cực cao.

---

## Các chức năng chính

### Sinh viên
- **Đăng ký học phần**: Tự động kiểm tra 4 ràng buộc: Thời gian đăng ký, Sĩ số lớp (`SiSo < ToiDa`), Trùng lịch học (thứ/tiết), và Môn học tiên quyết.
- **Hủy đăng ký**: Hủy môn học trong thời gian cho phép, tự động cập nhật lại sĩ số lớp.
- **Tra cứu**: Xem thời khóa biểu, bảng điểm chi tiết, và điểm trung bình tích lũy (GPA).

### Giảng viên
- **Quản lý lớp dạy**: Xem danh sách sinh viên các lớp được phân công.
- **Nhập điểm**: Nhập điểm Quá trình & Điểm thi. Hệ thống tự động tính điểm tổng kết và xếp loại ngay tại CSDL.

### 🛠 Quản trị viên (Admin)
- **Quản lý dữ liệu (CRUD)**: Sinh viên, Giảng viên, Học phần, Lớp học phần, Học kỳ.
- **Điều phối đào tạo**: Mở/Đóng lớp học phần, thiết lập thời gian đăng ký học kỳ.
- **Báo cáo & Thống kê**: Thống kê tỉ lệ đăng ký, kết quả học tập thông qua Stored Procedures chuyên biệt.

---

## Kiến trúc Cơ sở dữ liệu (Core DBMS)

Dự án tận dụng tối đa các tính năng mạnh mẽ của **MySQL 8.0+**:

### 1. Cấu trúc & Tối ưu
- **Schema**: 12 bảng chuẩn hóa 3NF, sử dụng `utf8mb4` cho hỗ trợ tiếng Việt hoàn hảo.
- **Indexes**: Tối ưu truy vấn tìm kiếm và lịch học:
  - `IX_SV_Nganh`: Tìm kiếm sinh viên theo ngành & khóa.
  - `IX_LHP_HP_HK`: Tăng tốc lọc lớp học phần theo môn và học kỳ.
  - `IX_LHP_GV`: Tăng tốc hiển thị lịch dạy của giảng viên.

### 2. Logic nghiệp vụ tại tầng DB
- **Computed Columns (Generated Always Stored)**: 
  - `DiemTK`: Tự động tính `DiemQT * 0.4 + DiemThi * 0.6`.
  - `XepLoai`: Tự động quy đổi A/B/C/D/F dựa trên `DiemTK`.
- **Triggers**:
  - `trg_KiemTraDangKyHopLe` (BEFORE INSERT): Chặn đứng các đăng ký không hợp lệ (lớp đầy, trùng lịch).
  - `trg_CapNhatSiSo_Insert/Delete` (AFTER): Tự động duy trì sĩ số thực tế của lớp học phần.
- **Stored Procedures**:
  - `sp_MoLopHocPhan` / `sp_DongLopHocPhan`: Quản lý trạng thái vận hành của lớp.
  - `sp_LayLopConCho`: Lọc nhanh danh sách lớp sẵn sàng cho sinh viên đăng ký.
  - `sp_ThongKeDangKy`: Tổng hợp dữ liệu báo cáo (số lượng ĐK, tỉ lệ đạt/rớt, điểm TB lớp).

### 3. Views (Khung nhìn)
- `V_BangDiemSinhVien`: Tổng hợp thông tin điểm số, môn học và học kỳ.
- `V_GPA_HocKy`: Tính điểm trung bình theo từng học kỳ.
- `V_GPA_TichLuy`: Tính điểm trung bình tích lũy toàn khóa.

---

## Cá trúc thư mục (Database Layer)

```plaintext
database/
├── schema.sql           # Khởi tạo Database, Tables và Indexes
├── views.sql            # Định nghĩa các Views báo cáo
├── triggers.sql         # Logic kiểm tra và cập nhật sĩ số tự động
├── stored_procs.sql     # Các thủ tục nghiệp vụ và báo cáo
├── seed_data.sql        # Dữ liệu mẫu (Dummy data) để kiểm thử
├── run_all.sql          # Script chạy toàn bộ setup theo đúng thứ tự
└── test_script.sql      # Script kiểm thử toàn diện mọi Database Objects
```

---

## Hướng dẫn cài đặt

### 1. Thiết lập Cơ sở dữ liệu
1. Tạo Database: `CREATE DATABASE QLDangKyHP CHARACTER SET utf8mb4;`
2. Để setup nhanh toàn bộ hệ thống, sử dụng MySQL CLI từ thư mục `database/`:
   ```bash
   mysql -u root -p < run_all.sql
   ```
3. Sau khi setup, bạn có thể kiểm tra tính đúng đắn bằng script test:
   ```bash
   mysql -u root -p QLDangKyHP < test_script.sql
   ```

### 2. Khởi chạy Backend
1. Tạo file `.env` tại thư mục gốc hoặc `backend/`:
   ```env
   DB_SERVER=localhost
   DB_NAME=QLDangKyHP
   DB_USER=root
   DB_PASSWORD=your_password
   DB_PORT=3306
   JWT_SECRET=your_secret_key
   PORT=3000
   ```
2. Cài đặt dependencies và chạy server:
   ```bash
   cd backend
   npm install
   npm start
   ```

---

## Nhóm thực hiện

| Vai trò | Thành viên | Mã số Sinh viên |
| :--- | :--- | :--- |
| **Leader (TV-01)** | Thái Thuận | 079205019923 |
| **Thành viên (TV-02)** | Trí Nguyên | ... |
| **Thành viên (TV-03)** | Ngọc Minh | ... |
| **Thành viên (TV-04)** | Ngọc Sơn | ... |
| **Thành viên (TV-05)** | Trung Hậu | ... |