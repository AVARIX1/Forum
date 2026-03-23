const API = "";

let token = localStorage.getItem("token");
let email = localStorage.getItem("email");

/* UI UPDATE */
function updateUI() {
  if (token) {
    document.getElementById("btn-login").style.display = "none";
    document.getElementById("btn-register").style.display = "none";
    document.getElementById("user-info").style.display = "flex";
    document.getElementById("user-email").textContent = email;
    document.getElementById("post-box").style.display = "block";
  }
}
updateUI();

/* MODALS */
function openLogin() { document.getElementById("login-modal").style.display = "flex"; }
function closeLogin() { document.getElementById("login-modal").style.display = "none"; }
function openRegister() { document.getElementById("register-modal").style.display = "flex"; }
function closeRegister() { document.getElementById("register-modal").style.display = "none"; }

/* AUTH */
async function register() {
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-pass").value;
  const msg = document.getElementById("reg-msg");

  const res = await fetch(API + "/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  msg.textContent = data.success ? "Cont creat!" : data.error;
}

async function login() {
  const emailInput = document.getElementById("log-email").value;
  const password = document.getElementById("log-pass").value;
  const msg = document.getElementById("log-msg");

  const res = await fetch(API + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: emailInput, password })
  });

  const data = await res.json();

  if (data.success) {
    token = data.token;
    email = emailInput;
    localStorage.setItem("token", token);
    localStorage.setItem("email", email);
    location.reload();
  } else {
    msg.textContent = data.error;
  }
}

function logout() {
  localStorage.clear();
  location.reload();
}

/* POSTS */
async function createPost() {
  const content = document.getElementById("post-content").value;
  const msg = document.getElementById("post-msg");

  const res = await fetch(API + "/post", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({ content })
  });

  const data = await res.json();
  msg.textContent = data.success ? "Postat!" : data.error;

  document.getElementById("post-content").value = "";
  loadPosts();
}

async function loadPosts() {
  const container = document.getElementById("posts");
  container.innerHTML = "Se încarcă...";

  const res = await fetch(API + "/posts");
  const posts = await res.json();

  container.innerHTML = "";

  posts.forEach(p => {
    const div = document.createElement("div");
    div.className = "post";

    div.innerHTML = `
      <div class="meta">${p.email} • ${new Date(p.created_at).toLocaleString()}</div>
      <div>${p.content}</div>
    `;

    container.appendChild(div);
  });
}

loadPosts();
