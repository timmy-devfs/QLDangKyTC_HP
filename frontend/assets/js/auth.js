const auth = {
  // ─── Lưu thông tin sau login ────────────────────────────────────────────
  setUser(token, info) {
    localStorage.setItem("token", token);
    localStorage.setItem("userInfo", JSON.stringify(info));
  },

  // ─── Lấy token ──────────────────────────────────────────────────────────
  getToken() {
    return localStorage.getItem("token");
  },

  // ─── Lấy thông tin user đang đăng nhập ──────────────────────────────────
  getUser() {
    const info = localStorage.getItem("userInfo");
    return info ? JSON.parse(info) : null;
  },

  // ─── Kiểm tra đã đăng nhập chưa ─────────────────────────────────────────
  isLoggedIn() {
    return !!this.getToken();
  },

  // ─── Đăng xuất ──────────────────────────────────────────────────────────
  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    window.location.href = "/index.html";
  },

  /**
   * Bảo vệ trang – gọi ở đầu mỗi trang cần đăng nhập
   * @param {string[]} allowedRoles - [] = chỉ cần đăng nhập, không check role
   * @returns {boolean} true nếu được phép, false nếu bị redirect
   */
  requireAuth(allowedRoles = []) {
    if (!this.isLoggedIn()) {
      window.location.href = "/index.html";
      return false;
    }
    const user = this.getUser();
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.vaiTro)) {
      alert("Bạn không có quyền truy cập trang này.");
      window.location.href = "/index.html";
      return false;
    }
    // Hiển thị tên user nếu có element #tenUser trên trang
    const el = document.getElementById("tenUser");
    if (el && user) el.textContent = user.hoTen;
    return true;
  },

  /**
   * Lấy headers chuẩn để fetch API (có JWT)
   */
  getHeaders() {
    return {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + (this.getToken() || ""),
    };
  },
};
