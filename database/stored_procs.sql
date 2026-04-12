DELIMITER //

-- 1. Mở lớp: Chuyển trạng thái sang 1 (Mở)
CREATE PROCEDURE sp_MoLopHocPhan(IN p_MaLHP VARCHAR(20), IN p_MaHK VARCHAR(10))
BEGIN
    UPDATE LopHocPhan 
    SET TrangThai = 1 
    WHERE MaLHP = p_MaLHP AND MaHocKy = p_MaHK;
END //

-- 2. Đóng lớp: Chuyển trạng thái sang 0 (Đóng)
CREATE PROCEDURE sp_DongLopHocPhan(IN p_MaLHP VARCHAR(20))
BEGIN
    UPDATE LopHocPhan 
    SET TrangThai = 0 
    WHERE MaLHP = p_MaLHP;
END //

-- 3. Lấy lớp còn chỗ: Dựa trên sĩ số hiện tại và tối đa
CREATE PROCEDURE sp_LayLopConCho(IN p_MaHK VARCHAR(10))
BEGIN
    SELECT * FROM LopHocPhan 
    WHERE MaHocKy = p_MaHK AND SiSoHienTai < SiSoToiDa;
END //

DELIMITER ;