const db = require("../config/db");

exports.dangKyHocPhan = async (maSV, maLopHP) => {
  // kiểm tra trùng
  const [exist] = await db.execute(
    "SELECT * FROM DangKyHocPhan WHERE maSV=? AND maLopHP=?",
    [maSV, maLopHP]
  );

  if (exist.length > 0) {
    throw new Error("Đã đăng ký rồi");
  }

  // insert
  await db.execute(
    "INSERT INTO DangKyHocPhan(maSV, maLopHP) VALUES (?,?)",
    [maSV, maLopHP]
  );
};

exports.huyDangKy = async (maSV, maLopHP) => {
  await db.execute(
    "DELETE FROM DangKyHocPhan WHERE maSV=? AND maLopHP=?",
    [maSV, maLopHP]
  );
};