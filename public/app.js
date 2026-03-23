// === CONFIG ===
const API = ""; // gol = același domeniu (Vercel)

// === STATE AUTH ===
let token = localStorage.getItem("token") || null;
let email = localStorage.getItem("email") || null;

// === STATE PROFIL (LOCAL) ===
let profileName = localStorage.getItem("profileName") || "Guest";
let profileBio = localStorage.getItem("profileBio") || "";

// === STATE UI ===
let allTopics = [];      // toate topicurile de la backend
let filteredTopics = []; // după search + categorie
let currentCategory = "Toate";
let currentSearch = "";

// === UTILS ===
function firstLetter(str) {
  if (!str) return "G";
  return str.trim()[0].toUpperCase();
}

// === UI INIT ===
function updateAuthUI() {
  const btnLogin = document.getElementById("btn-login");
  const btnRegister = document.getElementById("btn-register");
  const userInfo = document.getElementById("user-info");
  const userEmailTop = document.getElementById("user-email-top");
  const postBox = document.getElementById("post-box");
  const profileEmail = document.getElementById("profile-email");

  if (token && email) {
    btnLogin.style.display = "none";
    btnRegister.style.display = "none";
    userInfo.style.display = "flex";
    userEmailTop.textContent = email;
    postBox.style.display = "flex";
    profileEmail.textContent = email;
  } else {
    btnLogin.style.display = "inline-flex";
    btnRegister.style.display = "inline-flex";
    userInfo.style.display = "none";
    postBox.style.display = "none";
    profileEmail.textContent = "";
  }
}

function updateProfileUI() {
  document.getElementById("profile-name").textContent = profileName;
  document.getElementById("profile-bio").textContent = profileBio || "";
  document.getElementById("avatar-circle").textContent = firstLetter(profileName === "Guest" ? "G" : profileName);
}

updateAuthUI();
updateProfileUI();

// === MODALE ===
function openModal(id) {
  document.getElementById(id).style.display = "flex";
}
function closeModal(id) {
  document.getElementById(id).style.display = "none";
  if (id === "login-modal") document.getElementById("log-msg").textContent = "";
  if (id === "register-modal") document.getElementById("reg-msg").textContent = "";
  if (id === "profile-modal") document.getElementById("prof-msg").textContent = "";
}

// butoane navbar
document.getElementById("btn-login").onclick = () => openModal("login-modal");
document.getElementById("btn-register").onclick = () => openModal("register-modal");
document.getElementById("btn-logout").onclick = logout;

// butoane modale
document.getElementById("btn-login-submit").onclick = login;
document.getElementById("btn-register-submit").onclick = register;
document.getElementById("profile-edit-btn").onclick = () => {
  if (!token) {
    alert("Trebuie să fii logat ca să îți editezi profilul.");
    return;
  }
  document.getElementById("prof-name").value = profileName === "Guest" ? "" : profileName;
  document.getElementById("prof-bio").value = profileBio;
  openModal("profile-modal");
};
document.getElementById("btn-profile-save").onclick = saveProfile;

// close icons
document.querySelectorAll(".close").forEach(el => {
  el.addEventListener("click", () => {
    const id = el.getAttribute("data-close");
    if (id) closeModal(id);
  });
});

// === REGISTER ===
async function register() {
  const emailVal = document.getElementById("reg-email").value.trim();
  const passVal = document.getElementById("reg-pass").value.trim();
  const msg = document.getElementById("reg-msg");

  msg.style.color = "#f97373";
  msg.textContent = "";

  if (!emailVal || !passVal) {
    msg.textContent = "Completează email și parolă.";
    return;
  }

  try {
    const res = await fetch(API + "/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailVal, password: passVal })
    });
    const data = await res.json();
    if (data.success) {
      msg.style.color = "#4ade80";
      msg.textContent = "Cont creat. Acum poți face login.";
    } else {
      msg.textContent = data.error || "Eroare la înregistrare.";
    }
  } catch {
    msg.textContent = "Eroare de rețea.";
  }
}

// === LOGIN ===
async function login() {
  const emailVal = document.getElementById("log-email").value.trim();
  const passVal = document.getElementById("log-pass").value.trim();
  const msg = document.getElementById("log-msg");

  msg.style.color = "#f97373";
  msg.textContent = "";

  if (!emailVal || !passVal) {
    msg.textContent = "Completează email și parolă.";
    return;
  }

  try {
    const res = await fetch(API + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailVal, password: passVal })
    });
    const data = await res.json();
    if (data.success && data.token) {
      token = data.token;
      email = emailVal;
      localStorage.setItem("token", token);
      localStorage.setItem("email", email);
      closeModal("login-modal");
      updateAuthUI();
      loadTopics();
    } else {
      msg.textContent = data.error || "Eroare la login.";
    }
  } catch {
    msg.textContent = "Eroare de rețea.";
  }
}

// === LOGOUT ===
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("email");
  token = null;
  email = null;
  updateAuthUI();
  loadTopics();
}

// === PROFIL LOCAL ===
function saveProfile() {
  const nameVal = document.getElementById("prof-name").value.trim();
  const bioVal = document.getElementById("prof-bio").value.trim();
  const msg = document.getElementById("prof-msg");

  profileName = nameVal || "Guest";
  profileBio = bioVal;

  localStorage.setItem("profileName", profileName);
  localStorage.setItem("profileBio", profileBio);

  updateProfileUI();

  msg.style.color = "#4ade80";
  msg.textContent = "Profil salvat local.";
  setTimeout(() => closeModal("profile-modal"), 700);
}

// === CREARE TOPIC ===
// stocăm în content: "cat||titlu||body"
document.getElementById("btn-post").onclick = createTopic;

async function createTopic() {
  const title = document.getElementById("topic-title").value.trim();
  const category = document.getElementById("topic-category").value;
  const body = document.getElementById("post-content").value.trim();
  const msg = document.getElementById("post-msg");

  msg.style.color = "#f97373";
  msg.textContent = "";

  if (!token) {
    msg.textContent = "Trebuie să fii logat.";
    return;
  }
  if (!title || !body) {
    msg.textContent = "Completează titlul și conținutul.";
    return;
  }

  const packed = `${category}||${title}||${body}`;

  try {
    const res = await fetch(API + "/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ content: packed })
    });
    const data = await res.json();
    if (data.success) {
      msg.style.color = "#4ade80";
      msg.textContent = "Topic publicat.";
      document.getElementById("topic-title").value = "";
      document.getElementById("post-content").value = "";
      loadTopics();
    } else {
      msg.textContent = data.error || "Eroare la postare.";
    }
  } catch {
    msg.textContent = "Eroare de rețea.";
  }
}

// === ÎNCĂRCARE TOPICURI ===
async function loadTopics() {
  const container = document.getElementById("posts");
  container.innerHTML = "<div style='font-size:14px;color:#9ca3af;'>Se încarcă...</div>";

  try {
    const res = await fetch(API + "/posts");
    const data = await res.json();

    if (!Array.isArray(data)) {
      container.innerHTML = "<div style='font-size:14px;color:#9ca3af;'>Nu s-au putut încărca topicurile.</div>";
      return;
    }

    // transformăm fiecare post în topic structurat
    allTopics = data.map(p => {
      let cat = "General";
      let title = "Topic";
      let body = p.content || "";

      if (typeof p.content === "string" && p.content.includes("||")) {
        const parts = p.content.split("||");
        if (parts.length >= 3) {
          cat = parts[0] || "General";
          title = parts[1] || "Topic";
          body = parts.slice(2).join("||") || "";
        }
      }

      return {
        id: p.id,
        email: p.email,
        created_at: p.created_at,
        category: cat,
        title,
        body
      };
    });

    applyFilters();
  } catch {
    container.innerHTML = "<div style='font-size:14px;color:#9ca3af;'>Eroare la încărcarea topicurilor.</div>";
  }
}

// === FILTRARE (categorie + search) ===
function applyFilters() {
  const container = document.getElementById("posts");
  const search = currentSearch.toLowerCase();
  const cat = currentCategory;

  filteredTopics = allTopics.filter(t => {
    const matchesCat = (cat === "Toate") || (t.category === cat);
    const text = (t.title + " " + t.body + " " + t.category).toLowerCase();
    const matchesSearch = !search || text.includes(search);
    return matchesCat && matchesSearch;
  });

  if (filteredTopics.length === 0) {
    container.innerHTML = "<div style='font-size:14px;color:#9ca3af;'>Nu există topicuri pentru filtrul curent.</div>";
    return;
  }

  container.innerHTML = "";
  filteredTopics.forEach(t => {
    const div = document.createElement("div");
    div.className = "post";

    const header = document.createElement("div");
    header.className = "post-header";

    const avatar = document.createElement("div");
    avatar.className = "post-avatar";

    // niciodată email ca nume; pentru alții: "Member"
    let displayName = "Member";
    if (email && t.email === email) {
      displayName = profileName || "Member";
    }

    avatar.textContent = firstLetter(displayName);

    const info = document.createElement("div");
    const user = document.createElement("div");
    user.className = "post-user";
    user.textContent = displayName;

    const meta = document.createElement("div");
    meta.className = "post-meta";
    meta.textContent = new Date(t.created_at).toLocaleString();

    info.appendChild(user);
    info.appendChild(meta);

    header.appendChild(avatar);
    header.appendChild(info);

    const titleEl = document.createElement("div");
    titleEl.className = "post-title";
    titleEl.textContent = t.title;

    const catTag = document.createElement("span");
    catTag.className = "post-category-tag";
    catTag.textContent = t.category;

    titleEl.appendChild(catTag);

    const content = document.createElement("div");
    content.className = "post-content";
    content.textContent = t.body;

    div.appendChild(header);
    div.appendChild(titleEl);
    div.appendChild(content);

    container.appendChild(div);
  });
}

// === CATEGORII CLICK ===
document.getElementById("category-list").addEventListener("click", e => {
  const li = e.target.closest("li");
  if (!li) return;
  const cat = li.getAttribute("data-cat");
  if (!cat) return;

  currentCategory = cat;
  document.querySelectorAll("#category-list li").forEach(el => el.classList.remove("active"));
  li.classList.add("active");
  applyFilters();
});

// === SEARCH ===
const searchInput = document.getElementById("search-input");
const searchClear = document.getElementById("search-clear");

searchInput.addEventListener("input", () => {
  currentSearch = searchInput.value;
  applyFilters();
});

searchClear.addEventListener("click", () => {
  currentSearch = "";
  searchInput.value = "";
  applyFilters();
});

// === START ===
loadTopics();

