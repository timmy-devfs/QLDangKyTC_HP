<div align="center">
  <h1 align="center">🎓 Quản lý Sinh viên Đăng ký Học phần Tín chỉ</h1>
  <p align="center">
    <strong>Dự án môn học Hệ Quản trị Cơ sở dữ liệu</strong>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
    <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
    <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
    <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  </p>
</div>

<br />

## 📌 Giới thiệu dự án

Hệ thống **Quản lý Sinh viên Đăng ký Học phần Tín chỉ** là một dự án phần mềm được thiết kế và phát triển nhằm phục vụ cho đồ án môn học **Hệ Quản trị Cơ sở dữ liệu**. Giải pháp được xây dựng theo mô hình kiến trúc **3-Tier Architecture**, áp dụng chuẩn **REST API** cho backend và thiết kế theo **MVC Pattern**.

Dự án này mang điểm nhấn kỹ thuật đặc biệt ở việc thao tác sâu vào sức mạnh cốt lõi của **MySQL**. Phần lớn các logic nghiệp vụ quan trọng được đẩy trực tiếp xuống Database Layer nhằm đảm bảo tính toàn vẹn dữ liệu (Data Integrity) và hiệu năng.

---

## ✨ Các chức năng chính

Hệ thống phân quyền chức năng riêng biệt cho 3 nhóm đối tượng người dùng:

### 🎓 Sinh viên
- **Đăng ký học phần**: Chức năng cốt lõi áp dụng kiểm tra 4 ràng buộc ngặt nghèo ngay từ CSDL:
  1. Học kỳ phải trong thời gian được phép đăng ký.
  2. Lớp học phần vẫn còn chỉ tiêu (`SiSo < MaxSiSo`).
  3. Không trùng lịch học (thứ, tiết) với các học phần đã đăng ký trước đó.
  4. Đã hoàn thành (qua) môn học tiên quyết bắt buộc.
- **Hủy học phần**: Rút đăng ký trong thời gian cho phép của nhà trường.
- **Tra cứu cá nhân**: Xem thời khóa biểu theo học kỳ, tra cứu điểm chi tiết môn học, xem điểm trung bình (GPA) tích lũy toàn khóa.

### 👨‍🏫 Giảng viên
- **Quản lý lớp học phần**: Dễ dàng tra cứu danh sách các lớp học phần được phân công giảng dạy cùng sĩ số thực tế.
- **Cập nhật điểm**: Cập nhật điểm quá trình và điểm thi cho sinh viên trực tiếp. Các điểm số tổng kết sẽ được hệ thống dữ liệu tự động tính toán.

### 🛠 Admin (Ban quản trị)
- **Quản lý danh mục (CRUD)**: Toàn quyền truy xuất và hiệu chỉnh dữ liệu đối với Sinh viên, Giảng viên, Học kỳ, Học phần, Lớp học phần.
- **Báo cáo, Thống kê trực quan**:
  - Tích hợp biểu đồ **Chart.js** hiển thị các báo cáo học thuật sinh động.
  - Hỗ trợ xuất dữ liệu ra file **Excel** tiện lợi cho công tác lưu trữ và nộp báo cáo.

---

## 🗄️ Kiến trúc Cơ sở dữ liệu (Trọng tâm)

Thế mạnh của hệ thống là việc ứng dụng hoàn toàn các tính năng ưu việt từ cơ sở hữu liệu quan hệ MySQL:

- **12 Bảng cấu trúc chuẩn 3NF (Third Normal Form)**: Triệt để loại bỏ dư thừa. Tận dụng sức mạnh ràng buộc 무 hạn như `CHECK Constraint`, `UNIQUE`, `FOREIGN KEY`, đánh `INDEX` nâng cao tốc độ tải các cột thường xuyên query.
- **Views (Khung nhìn dữ liệu)**:
  - `V_BangDiemSinhVien`: Trích xuất và tổng hợp bảng điểm chuẩn hóa nhanh chóng.
  - `V_GPA_HocKy`: Tổng kết điểm GPA theo từng kỳ học của sinh viên.
  - `V_GPA_TichLuy`: View tính nhanh điểm tích lũy xuyên suốt từ khi nhập học.
- **Stored Procedures (Thủ tục nội tại)**:
  - `sp_MoLopHocPhan`: Quản lý quy trình nghiệp vụ cấp phát một lớp học phần mới.
  - `sp_DongLopHocPhan`: Thủ tục đóng khóa lớp học, ngăn chặn tương tác sai lệch sau khi hết hạn.
  - `sp_LayLopConCho`: Trích xuất tức thời các lớp vẫn còn dư `MaxSiSo` phục vụ SV tìm kiếm.
  - `sp_ThongKeDangKy`: Xuất thống kê tình hình đăng ký tín chỉ chuyên sâu tại Data Tier.
- **Triggers (Trình kích hoạt Trigger tự động)**:
  - `trg_CapNhatSiSo`: Tự động (+) hoặc (-) sĩ số lớp học phần mỗi khi xảy ra sự kiện sinh viên đăng ký hay hủy môn thành công.
  - `trg_KiemTraDangKyHopLe`: Can thiệp lập tức ở mức `BEFORE INSERT`. Nếu lớp đã đầy hoặc vi phạm quy chế (như môn tiên quyết, trùng lịch), trigger sẽ ném ngoại lệ (`SIGNAL SQLSTATE`) chặn ngay luồng đăng ký.
- **Computed Columns (Cột tự tính toán gốc)**: Điểm trung bình môn (`DiemTK`) và Xếp loại môn học (`XepLoai`) không cần tính trên Code mà tự động render thông qua logic Generated Columns của MySQL.

---

## 🛠 Công nghệ sử dụng

| Tầng (Tier) | Ngôn ngữ / Công cụ | Mô tả vai trò |
| :--- | :--- | :--- |
| **Backend** | `Node.js`, `Express.js` | Viết logic Restful API, thực thi request nhận từ Client. Khởi tạo `pool` kết nối Database. |
| **Frontend** | `HTML5`, `CSS3`, `Vanilla JS` | Client được dựng nhẹ và thuần. Gọi API qua giao thức `Fetch API`. Các Actor có phân vùng giao diện rõ ràng. |
| **Database** | `MySQL` | Hệ quản trị cơ sở dữ liệu quan hệ, nắm giữ kiến trúc các bảng biểu, Proc, Trigger nghiệp vụ cốt lõi. |

---

## 📂 Cấu trúc thư mục

Nguyên tắc phân chia theo chuẩn **Clean Folder Structure**, cụ thể như sau:

```plaintext
QLDangKyHP/
├── backend/                  # Nơi lưu trữ mã nguồn cho Server-side
│   ├── controllers/          # Nhận Request, xử lý gửi trả Response
│   ├── routes/               # API endpoints
│   ├── db.js                 # File thiết lập Connection CSDL MySQL
│   └── server.js             # Entry point chứa logic khởi chạy Backend
├── frontend/                 # Nơi chứa tài nguyên HTML, CSS, JS tĩnh
│   ├── admin/                # Workspace giao diện người quản trị
│   ├── gv/                   # Workspace giao diện giảng viên
│   └── sv/                   # Workspace giao diện sinh viên
├── database/                 # Chứa các Script SQL tạo và setup cơ sở dữ liệu
│   ├── schema.sql            # Lệnh DDL thiết lập 12 bảng 3NF
│   ├── seed_data.sql         # Chuỗi insert cung cấp dummy-data kiểm thử
│   ├── stored_procs.sql      # Các định nghĩa thủ tục lưu trữ 
│   └── triggers.sql          # Các định nghĩa trigger kích hoạt
└── docs/                     # Tài liệu kỹ thuật đi kèm 
    ├── ERD.png               # Bản đồ quan hệ thực thể của Database
    ├── Bao_cao_do_an.pdf     # Bản báo cáo giải trình đề tài
    └── API_Docs.md           # Hướng dẫn chi tiết sử dụng API 
```

---

## 🚀 Hướng dẫn cài đặt và khởi chạy (Getting Started)

Quá trình triển khai theo các bước đơn giản sau để start up môi trường Local:

**Bước 1: Clone kho lưu trữ này**
```bash
git clone https://github.com/timmy-devfs/QLDangKyTCHP.git
cd QLDangKyHP
```

**Bước 2: Cấu hình Hệ quản trị MySQL Database**
1. Đăng nhập vào bất kỳ UI quản lý nào của SQL (Ví dụ: MySQL Workbench, DBeaver).
2. Tạo CSDL: `CREATE DATABASE QL_DangKyHocPhan;`
3. Thực thi tuần tự các scripts bên trong thư mục `database/` theo thứ tự:
   - Chạy `schema.sql` để thiết lập các Tables cơ bản.
   - Chạy `stored_procs.sql` và `triggers.sql` để đưa các logic ngầm xuống DB.
   - Chạy `seed_data.sql` để bơm một lượng dữ liệu mẫu đầy đủ.

**Bước 3: Setting thông số Backend Server**
Điều hướng vào thư mục backend và tiến hành thiết lập cấu hình môi trường. (Thay đổi user & pass MySQL của bạn trong file configuration của dự án hoặc tạo file `.env` chứa `DB_USER`, `DB_PASS`, `DB_NAME` tương ứng).

**Bước 4: Cài thư viện và Bật Server**
```bash
cd backend
npm install
npm start
# 💡 Server rẽ khởi chạy mặc định tại cổng (VD: http://localhost:3000)
```

**Bước 5: Khởi động Frontend Client**
Chỉ cần mở các tệp tin `HTML` bằng Extension như **Live Server** (Trên VSCode) để Load giao diện tương đối, do Frontend sử dụng Fetch API độc lập.

---

## 👥 Thông tin nhóm (Nhóm 5 thành viên)

| STT | Họ và Tên | Mã số Sinh viên | Vai trò tham gia tiến độ |
| :-: | :--- | :-: | :--- |
| 1 |  |  |  |
| 2 |  |  |  |
| 3 |  |  |  |
| 4 |  |  |  |
| 5 |  |  |  |

> Đồ án này được thực hiện vì mục đích học thuật nhằm nâng cao kiến thức về khả năng quản lý và tối ưu hệ thống dữ liệu MySQL trên ứng dụng thực tế. 💖 Cảm ơn bạn đã quan tâm.