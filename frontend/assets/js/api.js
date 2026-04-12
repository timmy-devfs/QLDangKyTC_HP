const BASE_URL = "/api"; // Proxy cùng origin – không cần http://localhost:3000

async function _request(method, endpoint, body = null) {
  const options = {
    method,
    headers: auth.getHeaders(),   // auth.js phải load trước
  };
  if (body) options.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(BASE_URL + endpoint, options);
  } catch (networkErr) {
    throw new Error("Không kết nối được đến server. Vui lòng thử lại.");
  }

  const data = await res.json();

  // Token hết hạn hoặc không hợp lệ → về trang login
  if (res.status === 401) {
    auth.logout();
    return;
  }
  // Không có quyền
  if (res.status === 403) {
    throw new Error("Bạn không có quyền thực hiện hành động này.");
  }
  // Lỗi khác từ server
  if (!res.ok) {
    throw new Error(data.message || `Lỗi server (${res.status})`);
  }

  return data;
}

const api = {
  get:  (endpoint)       => _request("GET",    endpoint),
  post: (endpoint, body) => _request("POST",   endpoint, body),
  put:  (endpoint, body) => _request("PUT",    endpoint, body),
  del:  (endpoint)       => _request("DELETE", endpoint),
};
