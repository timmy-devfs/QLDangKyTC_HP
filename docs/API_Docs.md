# API Documentation - QLDangKyHP

## Base URL: http://localhost:3000/api

## Auth Header
Authorization: Bearer <jwt_token>

---

## POST /auth/login
**Body:** { "tenDangNhap": "...", "matKhau": "..." }
**Response:** { "token": "...", "user": { "vaiTro": "..." } }

---
## TODO: Bo sung day du cac endpoint