const API = "/api";
let token = localStorage.getItem("token");

// Helper pentru request-uri
async function api(url, method = "GET", body = null) {
  const opts = { method, headers: {} };

  if (token) opts.headers["Authorization"] = "Bearer " + token;
  if (body) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(API + url, opts);
  return res.json();
}

// Logout
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}
