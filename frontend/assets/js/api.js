/**
 * api.js - Module goi REST API dung chung
 * TV-02 phu trach
 */
const BASE_URL = 'http://localhost:3000/api';

const api = {
   _getHeaders() {
     const token = localStorage.getItem('jwt_token');
     return {
       'Content-Type': 'application/json',
       ...(token ? { 'Authorization': `Bearer ${token}` } : {})
     };
   },
   async get(endpoint) {
     const res = await fetch(BASE_URL + endpoint, { headers: this._getHeaders() });
     if (!res.ok) throw await res.json();
     return res.json();
   },
   async post(endpoint, data) {
     const res = await fetch(BASE_URL + endpoint, {
       method: 'POST', headers: this._getHeaders(), body: JSON.stringify(data)
     });
     if (!res.ok) throw await res.json();
     return res.json();
   },
   async put(endpoint, data) {
     const res = await fetch(BASE_URL + endpoint, {
       method: 'PUT', headers: this._getHeaders(), body: JSON.stringify(data)
     });
     if (!res.ok) throw await res.json();
     return res.json();
   },
   async del(endpoint) {
     const res = await fetch(BASE_URL + endpoint, {
       method: 'DELETE', headers: this._getHeaders()
     });
     if (!res.ok) throw await res.json();
     return res.json();
   }
};