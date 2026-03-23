const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Servește fișierele statice din folderul public
app.use(express.static("public"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Creează tabelele dacă nu există
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}
initDB();

// REGISTER
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2)",
      [email, hashed]
    );

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: "Email already exists" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  if (result.rows.length === 0) {
    return res.json({ success: false, error: "User not found" });
  }

  const user = result.rows[0];
  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.json({ success: false, error: "Wrong password" });
  }

  const token = jwt.sign({ id: user.id }, process.env.SECRET, {
    expiresIn: "7d"
  });

  res.json({ success: true, token });
});

// AUTH middleware
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.json({ success: false, error: "No token" });

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    req.user = decoded;
    next();
  } catch {
    res.json({ success: false, error: "Invalid token" });
  }
}

// CREATE POST
app.post("/post", auth, async (req, res) => {
  const { content } = req.body;

  await pool.query(
    "INSERT INTO posts (user_id, content) VALUES ($1, $2)",
    [req.user.id, content]
  );

  res.json({ success: true });
});

// GET POSTS
app.get("/posts", async (req, res) => {
  const result = await pool.query(`
    SELECT posts.id, posts.content, posts.created_at, users.email
    FROM posts
    JOIN users ON posts.user_id = users.id
    ORDER BY posts.id DESC
  `);

  res.json(result.rows);
});

// HOME PAGE — trimite index.html când intri pe /
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Export pentru Vercel
module.exports = app;

