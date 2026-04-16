# Tài liệu Kiểm thử – TV-03: Module Học phần & Lớp Học phần

**Người thực hiện:** TV-03  
**Tuần:** 5  
**Công cụ:** Postman / Browser / SSMS

---

## A. DANH SÁCH TEST CASE

### TC-01: Thêm điều kiện tiên quyết vòng tròn → phải báo lỗi

| Mục | Nội dung |
|-----|----------|
| **Mục tiêu** | Ngăn chặn A tiên quyết B, B tiên quyết A (vòng tròn) |
| **Chuẩn bị** | Có HP `HP_A` và `HP_B` trong DB. Thêm `HP_A` làm tiên quyết của `HP_B` trước. |
| **Bước thực hiện** | `POST /api/hoc-phan/HP_B/dieu-kien` với `{ "maHPTruoc": "HP_A", "loaiDK": "b" }` → thành công. Sau đó `POST /api/hoc-phan/HP_A/dieu-kien` với `{ "maHPTruoc": "HP_B" }` |
| **Kết quả mong đợi** | HTTP 400: `{ "success": false, "message": "Không thể thêm: tạo ra vòng tròn tiên quyết." }` |
| **Kết quả thực tế** | *(Ghi vào khi test)* |
| **Trạng thái** | ⬜ Chưa test |

---

### TC-02: Mở 2 lớp trùng lịch giảng viên → phải báo lỗi

| Mục | Nội dung |
|-----|----------|
| **Mục tiêu** | GV không thể dạy 2 lớp cùng thứ, cùng khoảng tiết trong 1 HK |
| **Chuẩn bị** | Đã có lớp `LHP_001` của GV `GV001` trong `HK1_2526`, Thứ 2, Tiết 3–5. |
| **Bước thực hiện** | `POST /api/lop-hoc-phan` tạo lớp mới cùng GV `GV001`, Thứ 2, Tiết 4–6, HK `HK1_2526` |
| **Kết quả mong đợi** | HTTP 400: `"Giảng viên đã có lớp … trong khung giờ này (Thứ 2, Tiết 3–5)"` |
| **Kết quả thực tế** | *(Ghi vào khi test)* |
| **Trạng thái** | ⬜ Chưa test |

---

### TC-03: Lấy lớp còn chỗ khi tất cả lớp đã đầy → trả mảng rỗng

| Mục | Nội dung |
|-----|----------|
| **Mục tiêu** | `sp_LayLopConCho` chỉ trả lớp `SiSoHienTai < SiSoToiDa` |
| **Chuẩn bị** | Đặt `SiSoHienTai = SiSoToiDa` cho tất cả lớp trong `HK1_2526` trên SSMS: `UPDATE LopHocPhan SET SiSoHienTai = SiSoToiDa WHERE MaHocKy = 'HK1_2526'` |
| **Bước thực hiện** | `GET /api/lop-hoc-phan/dang-ky?maHK=HK1_2526` |
| **Kết quả mong đợi** | HTTP 200: `{ "success": true, "data": [] }` – mảng rỗng |
| **Kết quả thực tế** | *(Ghi vào khi test)* |
| **Trạng thái** | ⬜ Chưa test |

---

### TC-04: Thêm HP tiên quyết hợp lệ → thành công, hiện trong danh sách

| Mục | Nội dung |
|-----|----------|
| **Mục tiêu** | Thêm tiên quyết hợp lệ (không vòng tròn) phải thành công |
| **Chuẩn bị** | Có HP `121000001` (Giải tích 1) và `121000002` (Giải tích 2) trong DB |
| **Bước thực hiện** | `POST /api/hoc-phan/121000002/dieu-kien` với `{ "maHPTruoc": "121000001", "loaiDK": "b" }` |
| **Kết quả mong đợi** | HTTP 201: trả danh sách tiên quyết có `121000001`. Kiểm tra lại bằng `GET /api/hoc-phan/121000002/dieu-kien` |
| **Kết quả thực tế** | *(Ghi vào khi test)* |
| **Trạng thái** | ⬜ Chưa test |

---

### TC-05: Xóa HP đang được dùng trong LHP → phải báo lỗi (FK constraint)

| Mục | Nội dung |
|-----|----------|
| **Mục tiêu** | Không cho xóa HP khi có LHP đang mở |
| **Chuẩn bị** | HP `121000001` đang có lớp `LHP_121000_01` ở trạng thái `Đang mở` |
| **Bước thực hiện** | `DELETE /api/hoc-phan/121000001` |
| **Kết quả mong đợi** | HTTP 400: `"Học phần đang được sử dụng ở 1 lớp học phần. Hãy đóng các lớp trước."` |
| **Kết quả thực tế** | *(Ghi vào khi test)* |
| **Trạng thái** | ⬜ Chưa test |

---

### TC-06: SP sp_MoLopHocPhan với HK đã kết thúc → phải báo lỗi

| Mục | Nội dung |
|-----|----------|
| **Mục tiêu** | Không cho mở lớp vào HK đã kết thúc |
| **Chuẩn bị** | HK `HK1_2223` có TrangThai = `Kết thúc` |
| **Bước thực hiện** | `POST /api/lop-hoc-phan/LHP_001/mo` với `{ "maHK": "HK1_2223" }` |
| **Kết quả mong đợi** | HTTP 400 (lỗi từ THROW 50002): `"Học kỳ không ở trạng thái có thể mở lớp."` |
| **Kết quả thực tế** | *(Ghi vào khi test)* |
| **Trạng thái** | ⬜ Chưa test |

---

### TC-07: Mở lớp trùng lịch phòng học → phải báo lỗi

| Mục | Nội dung |
|-----|----------|
| **Mục tiêu** | Phòng học không thể có 2 lớp cùng thứ, cùng tiết |
| **Chuẩn bị** | Phòng `A101` đã có lớp Thứ 3, Tiết 1–3 trong `HK1_2526` |
| **Bước thực hiện** | Tạo lớp mới với phòng `A101`, Thứ 3, Tiết 2–4 |
| **Kết quả mong đợi** | HTTP 400: `"Phòng "A101" đã được sử dụng bởi lớp … (Thứ 3, Tiết 1–3)"` |
| **Kết quả thực tế** | *(Ghi vào khi test)* |
| **Trạng thái** | ⬜ Chưa test |

---

### TC-08: Xóa HP tiên quyết → kiểm tra GET không còn hiện

| Mục | Nội dung |
|-----|----------|
| **Mục tiêu** | Xóa tiên quyết phải phản ánh ngay trong DB |
| **Chuẩn bị** | HP `121000002` đang có tiên quyết `121000001` (sau TC-04) |
| **Bước thực hiện** | `DELETE /api/hoc-phan/121000002/dieu-kien/121000001` |
| **Kết quả mong đợi** | HTTP 200: success. Gọi `GET /api/hoc-phan/121000002/dieu-kien` → mảng rỗng |
| **Kết quả thực tế** | *(Ghi vào khi test)* |
| **Trạng thái** | ⬜ Chưa test |

---

## B. TEST TRỰC TIẾP TRÊN SSMS

```sql
-- Kiểm tra SP sp_LayLopConCho trả đúng số lớp còn chỗ
EXEC sp_LayLopConCho @maHK = N'HK1_2526'
-- Đếm thủ công để so sánh:
SELECT COUNT(*) FROM LopHocPhan
WHERE MaHocKy = N'HK1_2526'
  AND TrangThai = N'Đang mở'
  AND SiSoHienTai < SiSoToiDa

-- Test sp_DongLopHocPhan với lớp không tồn tại → phải THROW 50003
EXEC sp_DongLopHocPhan @maLHP = N'LHP_KHONG_TON_TAI'

-- Kiểm tra vòng tròn tiên quyết bằng CTE trực tiếp
WITH CTE AS (
  SELECT MaHP, MaHPTruoc FROM DieuKienHP WHERE MaHP = N'HP_B'
  UNION ALL
  SELECT d.MaHP, d.MaHPTruoc FROM DieuKienHP d
  INNER JOIN CTE c ON d.MaHP = c.MaHPTruoc
)
SELECT * FROM CTE
```

---

## C. GIẢI THÍCH CHO THẦY

### Tại sao dùng Recursive CTE để kiểm tra vòng tròn?

```
Chuỗi tiên quyết: A → B → C (A phải học trước B, B phải học trước C)

Nếu thêm C là tiên quyết của A → VÒng TRÒN: A → B → C → A

CTE đệ quy bắt đầu từ C, duyệt ngược:
  - Tầng 1: C có tiên quyết B
  - Tầng 2: B có tiên quyết A
  - Tầng 3: A = maHP đang cần thêm → PHÁT HIỆN VÒNG TRÒN → THROW ERROR

Tại sao không dùng vòng lặp thông thường?
→ Vì không biết trước độ sâu của chuỗi tiên quyết. CTE đệ quy tự dừng khi không còn dòng mới.
```

### Tại sao khoảng [a,b] và [c,d] giao nhau khi a≤d VÀ c≤b?

```
Lớp A: Tiết 3 → 5   (a=3, b=5)
Lớp B: Tiết 4 → 6   (c=4, d=6)

Kiểm tra: a≤d: 3≤6 ✓   VÀ   c≤b: 4≤5 ✓  →  GIAO NHAU

Lớp A: Tiết 1 → 3   (a=1, b=3)
Lớp C: Tiết 4 → 6   (c=4, d=6)

Kiểm tra: a≤d: 1≤6 ✓   VÀ   c≤b: 4≤3 ✗  →  KHÔNG GIAO

SQL:  TietBatDau <= @tietKetThuc  AND  (TietBatDau + SoTiet - 1) >= @tietBatDau
      ↑ đây là c ≤ b                    ↑ đây là d ≥ a  (tương đương a ≤ d)
```

---

*Tài liệu được cập nhật sau mỗi lần test. Screenshot kết quả lưu vào thư mục `docs/test-screenshots/`.*
