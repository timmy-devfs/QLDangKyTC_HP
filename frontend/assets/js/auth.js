/**
 * auth.js - Xu ly dang nhap / dang xuat / JWT
 * TV-05 phu trach
 */
const auth = {
  login(token, user) {
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('current_user');
    window.location.href = '/index.html';
  },
  getToken() { return localStorage.getItem('jwt_token'); },
  getUser() { return JSON.parse(localStorage.getItem('current_user') || 'null'); },
  isLoggedIn() { return !!this.getToken(); },
  redirectByRole(role) {
    const map = {
      'Admin': '/admin/dashboard.html',
      'GiangVien': '/gv/lop-hoc-phan.html',
      'SinhVien': '/sv/dang-ky.html'
    };
    window.location.href = map[role] || '/index.html';
  }
};

/* Login form handler */
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const data = await api.post('/auth/login', {
      tenDangNhap: document.getElementById('username').value,
      matKhau: document.getElementById('password').value
    });
    // Backend trả về: { success, token, data: { vaiTro, maSV, maGV } }
    // Không có field 'data.user' → phải đọc 'data.data'
    const user = data.data;
    auth.login(data.token, user);
    auth.redirectByRole(user.vaiTro);
  } catch (err) {
    document.getElementById('errorMsg').textContent = err.message || 'Dang nhap that bai';
  }
});