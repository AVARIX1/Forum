// === CONFIG ===
const API = ""; // gol = același domeniu (Vercel)

// === STATE AUTH ===
let token = localStorage.getItem("token") || null;
let email = localStorage.getItem("email") || null;

// === STATE PROFIL (LOCAL) ===
let profileName = localStorage.getItem("profileName") || "Guest";
let profileBio = localStorage.getItem("profileBio") || "";

// === STATE TOPICURI ===
let allTopics = [];      // din backend
let filteredTopics = []; // după search
let currentSearch = "";
let currentTopic = null; // topic selectat
let localComments = {};  // comentarii doar local: { topicId: [ {text, imageUrl, time} ] }

// === UTILS ===
function firstLetter(str) {
  if (!str) return "G";
  return str.trim()[0].toUpperCase();
}

function detectTag(text) {
  const t = (text || "").toLowerCase();
  if (t.includes("game") || t.includes("joc") || t.includes("gaming") || t.includes("fps") || t.includes("minecraft")) return "Gaming";
  if (t.includes("update") || t.includes("patch") || t.includes("v1.") || t.includes("v2.")) return "Update";
  if (t.includes("help") || t.includes("ajutor") || t.includes("?")) return "Ajutor";
  return "General";
}

// === UI AUTH ===
function updateAuthUI() {
  const btnLogin = document.getElementById("btn-login");
  const btnRegister = document.getElementById("btn-register");
  const userInfo = document.getElementById("user-info");
  const userEmailTop = document.getElementById("user-email-top");
  const profileEmail = document.getElementById("profile-email");

  if (token && email) {
    btnLogin.style.display = "none";
    btnRegister.style.display = "none";
    userInfo.style.display = "flex";
    userEmailTop.textContent = email;
    profileEmail.textContent = email;
  } else {
    btnLogin.style.display = "inline-flex";
    btnRegister.style.display = "inline-flex";
    userInfo.style.display = "none";
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
  if (id === "topic-modal") document.getElementById("topic-msg").textContent = "";
}

// navbar
document.getElementById("btn-login").onclick = () => openModal("login-modal");
document.getElementById("btn-register").onclick = () => openModal("register-modal");
document.getElementById("btn-logout").onclick = logout;

// modale
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

document.getElementById("btn-new-topic").onclick = () => {
  if (!token) {
    alert("Trebuie să fii logat ca să creezi un topic.");
    return;
  }
  document.getElementById("topic-title-input").value = "";
  document.getElementById("topic-body-input").value = "";
  document.getElementById("topic-image-url-input").value = "";
  openModal("topic-modal");
};
document.getElementById("btn-topic-save").onclick = createTopic;

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
  showTopicsView();
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
// content = "TITLE||BODY||IMAGE_URL"
async function createTopic() {
  const title = document.getElementById("topic-title-input").value.trim();
  const body = document.getElementById("topic-body-input").value.trim();
  const imageUrl = document.getElementById("topic-image-url-input").value.trim();
  const msg = document.getElementById("topic-msg");

  msg.style.color = "#f97373";
  msg.textContent = "";

  if (!token) {
    msg.textContent = "Trebuie să fii logat.";
    return;
  }
  if (!title || !body) {
    msg.textContent = "Completează titlul și descrierea.";
    return;
  }

  const packed = `${title}||${body}||${imageUrl}`;

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
      setTimeout(() => {
        closeModal("topic-modal");
        loadTopics();
      }, 600);
    } else {
      msg.textContent = data.error || "Eroare la postare.";
    }
  } catch {
    msg.textContent = "Eroare de rețea.";
  }
}

// === ÎNCĂRCARE TOPICURI ===
async function loadTopics() {
  const container = document.getElementById("topics-list");
  container.innerHTML = "<div style='font-size:14px;color:#9ca3af;'>Se încarcă...</div>";

  try {
    const res = await fetch(API + "/posts");
    const data = await res.json();

    if (!Array.isArray(data)) {
      container.innerHTML = "<div style='font-size:14px;color:#9ca3af;'>Nu s-au putut încărca topicurile.</div>";
      return;
    }

    allTopics = data.map(p => {
      let title = "Topic";
      let body = p.content || "";
      let imageUrl = "";

      if (typeof p.content === "string" && p.content.includes("||")) {
        const parts = p.content.split("||");
        title = parts[0] || "Topic";
        body = parts[1] || "";
        imageUrl = parts[2] || "";
      }

      const tag = detectTag(title + " " + body);

      return {
        id: p.id,
        email: p.email,
        created_at: p.created_at,
        title,
        body,
        imageUrl,
        tag
      };
    });

    applyFilters();
  } catch {
    container.innerHTML = "<div style='font-size:14px;color:#9ca3af;'>Eroare la încărcarea topicurilor.</div>";
  }
}

// === FILTRARE + RENDER LISTĂ ===
function applyFilters() {
  const container = document.getElementById("topics-list");
  const search = currentSearch.toLowerCase();

  filteredTopics = allTopics.filter(t => {
    const text = (t.title + " " + t.body + " " + t.tag).toLowerCase();
    return !search || text.includes(search);
  });

  if (filteredTopics.length === 0) {
    container.innerHTML = "<div style='font-size:14px;color:#9ca3af;'>Nu există topicuri pentru filtrul curent.</div>";
    return;
  }

  container.innerHTML = "";
  filteredTopics.forEach(t => {
    const card = document.createElement("div");
    card.className = "topic-card";

    const avatar = document.createElement("div");
    avatar.className = "topic-avatar";

    let displayName = "Member";
    if (email && t.email === email) {
      displayName = profileName || "Member";
    }
    avatar.textContent = firstLetter(displayName);

    const main = document.createElement("div");
    main.className = "topic-main";

    const row = document.createElement("div");
    row.className = "topic-title-row";

    const titleEl = document.createElement("div");
    titleEl.className = "topic-title";
    titleEl.textContent = t.title;

    const tagEl = document.createElement("div");
    tagEl.className = "topic-tag";
    tagEl.textContent = t.tag;

    row.appendChild(titleEl);
    row.appendChild(tagEl);

    const meta = document.createElement("div");
    meta.className = "topic-meta";
    meta.textContent = new Date(t.created_at).toLocaleString();

    const preview = document.createElement("div");
    preview.className = "topic-preview";
    preview.textContent = t.body;

    main.appendChild(row);
    main.appendChild(meta);
    main.appendChild(preview);

    card.appendChild(avatar);
    card.appendChild(main);

    card.onclick = () => openTopic(t);

    container.appendChild(card);
  });
}

// === VIEW SWITCH ===
function showTopicsView() {
  document.getElementById("view-topics").style.display = "flex";
  document.getElementById("view-topic").style.display = "none";
}

function showTopicView() {
  document.getElementById("view-topics").style.display = "none";
  document.getElementById("view-topic").style.display = "flex";
}

document.getElementById("btn-back").onclick = () => {
  currentTopic = null;
  showTopicsView();
};

// === DESCHIDERE TOPIC ===
function openTopic(topic) {
  currentTopic = topic;
  showTopicView();

  document.getElementById("topic-title-full").textContent = topic.title;
  document.getElementById("topic-tag-full").textContent = topic.tag;
  document.getElementById("topic-meta-full").textContent = new Date(topic.created_at).toLocaleString();
  document.getElementById("topic-body-full").textContent = topic.body;

  const img = document.getElementById("topic-image");
  if (topic.imageUrl) {
    img.src = topic.imageUrl;
    img.style.display = "block";
  } else {
    img.style.display = "none";
  }

  renderChat();
}

// === CHAT LOCAL (comentarii doar în browser) ===
document.getElementById("btn-chat-send").onclick = sendChat;

function sendChat() {
  const text = document.getElementById("chat-text-input").value.trim();
  const imageUrl = document.getElementById("chat-image-url").value.trim();
  const msg = document.getElementById("chat-msg");

  msg.style.color = "#f97373";
  msg.textContent = "";

  if (!token) {
    msg.textContent = "Trebuie să fii logat ca să răspunzi.";
    return;
  }
  if (!currentTopic) {
    msg.textContent = "Niciun topic selectat.";
    return;
  }
  if (!text && !imageUrl) {
    msg.textContent = "Scrie ceva sau adaugă o imagine.";
    return;
  }

  const topicId = currentTopic.id || "local-" + currentTopic.created_at;
  if (!localComments[topicId]) localComments[topicId] = [];

  localComments[topicId].push({
    text,
    imageUrl,
    time: new Date().toISOString(),
    authorEmail: email
  });

  document.getElementById("chat-text-input").value = "";
  document.getElementById("chat-image-url").value = "";
  msg.style.color = "#4ade80";
  msg.textContent = "Mesaj adăugat (local).";

  renderChat();
}

function renderChat() {
  const container = document.getElementById("topic-chat");
  container.innerHTML = "";

  if (!currentTopic) return;

  const topicId = currentTopic.id || "local-" + currentTopic.created_at;
  const comments = localComments[topicId] || [];

  if (comments.length === 0) {
    container.innerHTML = "<div style='font-size:13px;color:#9ca3af;'>Nu există încă răspunsuri în acest topic.</div>";
    return;
  }

  comments.forEach(c => {
    const row = document.createElement("div");
    row.className = "chat-msg";

    const avatar = document.createElement("div");
    avatar.className = "chat-avatar";

    let displayName = "Member";
    if (email && c.authorEmail === email) {
      displayName = profileName || "Member";
    }
    avatar.textContent = firstLetter(displayName);

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";

    const nameTime = document.createElement("div");
    nameTime.className = "chat-name-time";
    nameTime.textContent = `${displayName} • ${new Date(c.time).toLocaleString()}`;

    const text = document.createElement("div");
    text.className = "chat-text";
    text.textContent = c.text;

    bubble.appendChild(nameTime);
    bubble.appendChild(text);

    if (c.imageUrl) {
      const img = document.createElement("img");
      img.className = "chat-image";
      img.src = c.imageUrl;
      bubble.appendChild(img);
    }

    row.appendChild(avatar);
    row.appendChild(bubble);

    container.appendChild(row);
  });

  container.scrollTop = container.scrollHeight;
}

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
showTopicsView();
loadTopics();

