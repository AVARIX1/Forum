const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3000;
const SECRET = "secretul_tau_super_puternic";

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// DB
const db = new sqlite3.Database("database.db");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER,
    user_id INTEGER,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Helper: auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// Register
app.post("/api/register", (req, res) => {
  const { username, email, password } = req.body;
  const hash = bcrypt.hashSync(password, 10);

  db.run(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username, email, hash],
    function (err) {
      if (err) return res.json({ error: "User exists" });
      res.json({ success: true });
    }
  );
});

// Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (!user) return res.json({ error: "User not found" });

    if (!bcrypt.compareSync(password, user.password))
      return res.json({ error: "Wrong password" });

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET);
    res.json({ token });
  });
});

// Create post
app.post("/api/posts", auth, (req, res) => {
  const { title, content } = req.body;

  db.run(
    "INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)",
    [req.user.id, title, content],
    function () {
      res.json({ id: this.lastID });
    }
  );
});

// Get all posts
app.get("/api/posts", (req, res) => {
  db.all(
    `SELECT posts.*, users.username 
     FROM posts 
     JOIN users ON posts.user_id = users.id 
     ORDER BY posts.id DESC`,
    (err, rows) => res.json(rows)
  );
});

// Get single post + comments
app.get("/api/posts/:id", (req, res) => {
  const postId = req.params.id;

  db.get(
    `SELECT posts.*, users.username 
     FROM posts 
     JOIN users ON posts.user_id = users.id 
     WHERE posts.id = ?`,
    [postId],
    (err, post) => {
      if (!post) return res.json({ error: "Not found" });

      db.all(
        `SELECT comments.*, users.username 
         FROM comments 
         JOIN users ON comments.user_id = users.id 
         WHERE post_id = ?`,
        [postId],
        (err, comments) => {
          res.json({ post, comments });
        }
      );
    }
  );
});

// Add comment
app.post("/api/comments", auth, (req, res) => {
  const { post_id, content } = req.body;

  db.run(
    "INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)",
    [post_id, req.user.id, content],
    function () {
      res.json({ id: this.lastID });
    }
  );
});

app.listen(PORT, () => {
  console.log("Forum running on http://localhost:" + PORT);
});
