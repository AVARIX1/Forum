// === CONFIG ===
const API = ""; // lasă gol dacă frontend-ul e servit de același domeniu ca backend-ul

// === STATE AUTH ===
let token = localStorage.getItem("token") || null;
let email = localStorage.getItem("email") || null;

// === STATE PROFIL (LOCAL + SERVER) ===
let profileName = localStorage.getItem("profileName") || "Guest";
let profileBio = localStorage.getItem("profileBio") || "";
let avatarUrl = localStorage.getItem("avatarUrl") || "";

// === STATE TOPICURI ===
let allTopics = [];
let filteredTopics = [];
let currentSearch = "";
let currentTopic = null;
let currentTopicMessages = [];

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

function authHeaders() {
  return token
    ? { Authorization: "Bearer " + token }
    : {};
}

// === UI AUTH ===
function updateAuthUI() {
  const btnLogin = document.getElementById("btn-login");
  const btnRegister = document.getElementById("btn-register");
  const userInfo = document.getElementById("user-info");
  const profileEmail = document.getElementById("profile-email");

  if (token && email) {
    btnLogin.style.display = "none";
    btnRegister.style.display = "none";
    userInfo.style.display = "flex";
    profileEmail.textContent = email;
  } else {
    btnLogin.style.display = "inline-flex";
    btnRegister.style.display = "inline-flex";
    userInfo.style.display = "none";
    profileEmail.textContent = "";
  }
}

function updateAvatarUI() {
  const circle = document.getElementById("avatar-circle");
  const letter = document.getElementById("avatar-letter");
  const img = document.getElementById("avatar-image");

  if (avatarUrl) {
    img.src = avatarUrl;
    img.style.display = "block";
    letter.style.display = "none";
  } else {
    img.style.display = "none";
    letter.style.display = "block";
    letter.textContent = firstLetter(profileName === "Guest" ? "G" : profileName);
  }
}

function updateProfileUI() {
  document.getElementById("profile-name").textContent = profileName;
  document.getElementById("profile-bio").textContent = profileBio || "";
  updateAvatarUI();
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
document.getElementById("btn-settings").onclick = () => {
  if (!token) {
    alert("Trebuie să fii logat pentru setări.");
    return;
  }
  document.getElementById("prof-name").value = profileName === "Guest" ? "" : profileName;
  document.getElementById("prof-bio").value = profileBio;
  openModal("profile-modal");
};

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
document.getElementById("btn-avatar-upload").onclick = uploadAvatar;

document.getElementById("btn-new-topic").onclick = () => {
  if (!token) {
    alert("Trebuie să fii logat ca să creezi un topic.");
    return;
  }
  document.getElementById("topic-title-input").value = "";
  document.getElementById("topic-body-input").value = "";
  document.getElementById("topic-image-url-input").value = "";
  document.getElementById("topic-image-file-input").value = "";
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
      msg.textContent = "Cont creat. Verifică emailul pentru confirmare.";
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
      profileName = data.display_name || "Guest";
      profileBio = data.bio || "";
      avatarUrl = data.avatar_url || "";

      localStorage.setItem("token", token);
      localStorage.setItem("email", email);
      localStorage.setItem("profileName", profileName);
      localStorage.setItem("profileBio", profileBio);
      localStorage.setItem("avatarUrl", avatarUrl);

      closeModal("login-modal");
      updateAuthUI();
      updateProfileUI();
      showTopicsView();
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
  localStorage.removeItem("profileName");
  localStorage.removeItem("profileBio");
  localStorage.removeItem("avatarUrl");
  token = null;
  email = null;
  profileName = "Guest";
  profileBio = "";
  avatarUrl = "";
  updateAuthUI();
  updateProfileUI();
  showTopicsView();
  loadTopics();
}

// === PROFIL LOCAL + SERVER (doar nume/bio local, avatar pe server) ===
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

// === UPLOAD AVATAR ===
async function uploadAvatar() {
  const fileInput = document.getElementById("avatar-file");
  const msg = document.getElementById("prof-msg");

  msg.style.color = "#f97373";
  msg.textContent = "";

  if (!token) {
    msg.textContent = "Trebuie să fii logat.";
    return;
  }

  if (!fileInput.files || !fileInput.files[0]) {
    msg.textContent = "Alege un fișier.";
    return;
  }

  const formData = new FormData();
  formData.append("avatar", fileInput.files[0]);

  try {
    const res = await fetch(API + "/upload/avatar", {
      method: "POST",
      headers: authHeaders(),
      body: formData
    });
    const data = await res.json();
    if (data.success && data.avatar_url) {
      avatarUrl = data.avatar_url;
      localStorage.setItem("avatarUrl", avatarUrl);
      updateAvatarUI();
      msg.style.color = "#4ade80";
      msg.textContent = "Avatar actualizat.";
    } else {
      msg.textContent = data.error || "Eroare la upload avatar.";
    }
  } catch {
    msg.textContent = "Eroare de rețea.";
  }
}

// === CREARE TOPIC ===
async function createTopic() {
  const title = document.getElementById("topic-title-input").value.trim();
  const body = document.getElementById("topic-body-input").value.trim();
  const imageUrlInput = document.getElementById("topic-image-url-input").value.trim();
  const fileInput = document.getElementById("topic-image-file-input");
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

  let finalImageUrl = imageUrlInput;

  // dacă are fișier, îl urcăm
  if (fileInput.files && fileInput.files[0]) {
    const formData = new FormData();
    formData.append("image", fileInput.files[0]);
    try {
      const resUp = await fetch(API + "/upload/image", {
        method: "POST",
        headers: authHeaders(),
        body: formData
      });
      const dataUp = await resUp.json();
      if (dataUp.success && dataUp.url) {
        finalImageUrl = dataUp.url;
      } else {
        msg.textContent = dataUp.error || "Eroare la upload imagine.";
        return;
      }
    } catch {
      msg.textContent = "Eroare de rețea la upload imagine.";
      return;
    }
  }

  const tag = detectTag(title + " " + body);

  try {
    const res = await fetch(API + "/topics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders()
      },
      body: JSON.stringify({
        title,
        body,
        image_url: finalImageUrl,
        tag
      })
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
    const res = await fetch(API + "/topics");
    const data = await res.json();

    if (!Array.isArray(data)) {
      container.innerHTML = "<div style='font-size:14px;color:#9ca3af;'>Nu s-au putut încărca topicurile.</div>";
      return;
    }

    allTopics = data.map(t => ({
      id: t.id,
      title: t.title,
      body: t.body,
      imageUrl: t.image_url || "",
      tag: t.tag || detectTag(t.title + " " + t.body),
      created_at: t.created_at,
      display_name: t.display_name || "Member",
      avatar_url: t.avatar_url || ""
    }));

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

    const avatarImg = document.createElement("img");
    const avatarSpan = document.createElement("span");

    if (t.avatar_url) {
      avatarImg.src = t.avatar_url;
      avatarImg.style.display = "block";
      avatarSpan.style.display = "none";
    } else {
      avatarImg.style.display = "none";
      avatarSpan.style.display = "block";
      avatarSpan.textContent = firstLetter(t.display_name || "M");
    }

    avatar.appendChild(avatarImg);
    avatar.appendChild(avatarSpan);

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
  currentTopicMessages = [];
  showTopicsView();
};

// === DESCHIDERE TOPIC ===
async function openTopic(topic) {
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

  await loadTopicMessages(topic.id);
  renderChat();
}

// === ÎNCĂRCARE MESAJ TOPIC ===
async function loadTopicMessages(topicId) {
  const container = document.getElementById("topic-chat");
  container.innerHTML = "<div style='font-size:13px;color:#9ca3af;'>Se încarcă mesajele...</div>";

  try {
    const res = await fetch(API + `/topics/${topicId}/messages`);
    const data = await res.json();
    if (!Array.isArray(data)) {
      currentTopicMessages = [];
    } else {
      currentTopicMessages = data.map(m => ({
        id: m.id,
        body: m.body,
        image_url: m.image_url || "",
        created_at: m.created_at,
        display_name: m.display_name || "Member",
        avatar_url: m.avatar_url || ""
      }));
    }
  } catch {
    currentTopicMessages = [];
  }
}

// === TRIMITERE MESAJ ÎN TOPIC ===
document.getElementById("btn-chat-send").onclick = sendChat;

async function sendChat() {
  const text = document.getElementById("chat-text-input").value.trim();
  const imageUrlInput = document.getElementById("chat-image-url").value.trim();
  const fileInput = document.getElementById("chat-image-file");
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
  if (!text && !imageUrlInput && !(fileInput.files && fileInput.files[0])) {
    msg.textContent = "Scrie ceva sau adaugă o imagine.";
    return;
  }

  let finalImageUrl = imageUrlInput;

  // upload fișier dacă există
  if (fileInput.files && fileInput.files[0]) {
    const formData = new FormData();
    formData.append("image", fileInput.files[0]);
    try {
      const resUp = await fetch(API + "/upload/image", {
        method: "POST",
        headers: authHeaders(),
        body: formData
      });
      const dataUp = await resUp.json();
      if (dataUp.success && dataUp.url) {
        finalImageUrl = dataUp.url;
      } else {
        msg.textContent = dataUp.error || "Eroare la upload imagine.";
        return;
      }
    } catch {
      msg.textContent = "Eroare de rețea la upload imagine.";
      return;
    }
  }

  try {
    const res = await fetch(API + `/topics/${currentTopic.id}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders()
      },
      body: JSON.stringify({
        body: text,
        image_url: finalImageUrl
      })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById("chat-text-input").value = "";
      document.getElementById("chat-image-url").value = "";
      document.getElementById("chat-image-file").value = "";
      msg.style.color = "#4ade80";
      msg.textContent = "Mesaj trimis.";
      await loadTopicMessages(currentTopic.id);
      renderChat();
    } else {
      msg.textContent = data.error || "Eroare la trimiterea mesajului.";
    }
  } catch {
    msg.textContent = "Eroare de rețea.";
  }
}

// === RENDER CHAT ===
function renderChat() {
  const container = document.getElementById("topic-chat");
  container.innerHTML = "";

  if (!currentTopic) return;

  if (currentTopicMessages.length === 0) {
    container.innerHTML = "<div style='font-size:13px;color:#9ca3af;'>Nu există încă răspunsuri în acest topic.</div>";
    return;
  }

  currentTopicMessages.forEach(c => {
    const row = document.createElement("div");
    row.className = "chat-msg";

    const avatar = document.createElement("div");
    avatar.className = "chat-avatar";

    const avatarImg = document.createElement("img");
    const avatarSpan = document.createElement("span");

    if (c.avatar_url) {
      avatarImg.src = c.avatar_url;
      avatarImg.style.display = "block";
      avatarSpan.style.display = "none";
    } else {
      avatarImg.style.display = "none";
      avatarSpan.style.display = "block";
      avatarSpan.textContent = firstLetter(c.display_name || "M");
    }

    avatar.appendChild(avatarImg);
    avatar.appendChild(avatarSpan);

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";

    const nameTime = document.createElement("div");
    nameTime.className = "chat-name-time";
    nameTime.textContent = `${c.display_name || "Member"} • ${new Date(c.created_at).toLocaleString()}`;

    const text = document.createElement("div");
    text.className = "chat-text";
    text.textContent = c.body;

    bubble.appendChild(nameTime);
    bubble.appendChild(text);

    if (c.image_url) {
      const img = document.createElement("img");
      img.className = "chat-image";
      img.src = c.image_url;
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

