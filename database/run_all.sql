-- ============================================================
-- FILE: database/run_all.sql
-- Mục đích: Chạy toàn bộ database setup theo đúng thứ tự
--
-- CÁCH DÙNG (MySQL Workbench hoặc CLI):
--   mysql -u root -p < run_all.sql
--   HOẶC mở file này trong Workbench → Run (Ctrl+Shift+Enter)
--
-- THỨ TỰ CHẠY:
--   1. schema.sql       → DROP + CREATE tables, indexes
--   2. views.sql        → CREATE views (phụ thuộc bảng)
--   3. triggers.sql     → CREATE triggers (phụ thuộc bảng)
--   4. stored_procs.sql → CREATE stored procedures
--   5. seed_data.sql    → INSERT dữ liệu mẫu
--   [6. test_script.sql → Kiểm thử — chạy riêng sau khi setup xong]
-- ============================================================

-- Lấy đường dẫn folder: thay bằng đường dẫn thực trên máy bạn nếu cần
-- Mặc định dùng SOURCE (cú pháp MySQL CLI)

SOURCE schema.sql;
SOURCE views.sql;
SOURCE triggers.sql;
SOURCE stored_procs.sql;
SOURCE seed_data.sql;

SELECT 'Setup hoàn tất! Chạy test_script.sql để kiểm thử.' AS ThongBao;
