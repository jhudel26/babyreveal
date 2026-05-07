const express = require("express");
const path = require("path");
const crypto = require("crypto");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";
const JWT_SECRET = process.env.JWT_SECRET || "change-this-in-production";
const COOKIE_NAME = "gr_admin_session";
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const DEMO_USER = process.env.DEMO_USER || "demo";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "demo123";
const VALID_GENDERS = new Set(["boy", "girl"]);
const VALID_REVEAL_TYPES = new Set(["scratch", "balloon", "gift", "tap"]);

if (IS_PRODUCTION && JWT_SECRET === "change-this-in-production" && require.main === module) {
  throw new Error("JWT_SECRET must be set in production.");
}

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true
};

const pool = mysql.createPool(DB_CONFIG);
let dbReady = false;

function generateRevealCode() {
  return crypto.randomBytes(4).toString("base64url").toUpperCase();
}

async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        father_name VARCHAR(100) NOT NULL,
        mother_name VARCHAR(100) NOT NULL,
        code VARCHAR(16) NOT NULL UNIQUE,
        gender ENUM('boy', 'girl') NOT NULL,
        reveal_type ENUM('scratch', 'balloon', 'gift', 'tap') NOT NULL DEFAULT 'scratch',
        revealed BOOLEAN NOT NULL DEFAULT FALSE,
        revealed_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_code (code),
        INDEX idx_revealed (revealed)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [rows] = await pool.query("SELECT COUNT(*) as count FROM users");
    if (rows[0].count === 0) {
      await seedUsers();
    }
    console.log("Database initialized");
  } catch (err) {
    console.error("Database init failed:", err.message);
  }
}

async function seedUsers() {
  const users = [
    {
      id: uuidv4(),
      father_name: "John Doe",
      mother_name: "Jane Smith",
      code: generateRevealCode(),
      gender: "boy",
      reveal_type: "scratch",
      revealed: false
    },
    {
      id: uuidv4(),
      father_name: "Michael Brown",
      mother_name: "Sarah Brown",
      code: generateRevealCode(),
      gender: "girl",
      reveal_type: "balloon",
      revealed: true,
      revealed_at: new Date()
    }
  ];
  for (const u of users) {
    await pool.query(
      `INSERT INTO users (id, father_name, mother_name, code, gender, reveal_type, revealed, revealed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.father_name, u.mother_name, u.code, u.gender, u.reveal_type, u.revealed, u.revealed_at || null]
    );
  }
}

function dbRowToUser(row) {
  return {
    id: row.id,
    fatherName: row.father_name,
    motherName: row.mother_name,
    code: row.code,
    gender: row.gender,
    revealType: row.reveal_type,
    revealed: Boolean(row.revealed),
    revealedAt: row.revealed_at,
    createdAt: row.created_at
  };
}

const adminAccounts = [
  {
    username: ADMIN_USER,
    passwordHash: bcrypt.hashSync(ADMIN_PASSWORD, 10)
  },
  {
    username: DEMO_USER,
    passwordHash: bcrypt.hashSync(DEMO_PASSWORD, 10)
  }
];

app.use(cors({ origin: true, credentials: true }));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"]
      }
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  })
);
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json());
app.use(cookieParser());

async function ensureDb() {
  if (dbReady) return;
  try {
    console.log("DB_CONFIG:", {
      host: DB_CONFIG.host ? "SET" : "MISSING",
      user: DB_CONFIG.user ? "SET" : "MISSING",
      password: DB_CONFIG.password ? "SET" : "MISSING",
      database: DB_CONFIG.database ? "SET" : "MISSING"
    });
    await initDatabase();
    dbReady = true;
    console.log("Database connected successfully");
  } catch (err) {
    console.error("DB init error:", err.message);
    console.error("Full error:", err);
    throw err;
  }
}

app.use("/api", async (req, res, next) => {
  try {
    await ensureDb();
    next();
  } catch (err) {
    return res.status(500).json({ error: "Database unavailable. Check DB_* env vars." });
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
});

const revealLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

function createAdminSession(username) {
  return jwt.sign({ username, role: "admin" }, JWT_SECRET, { expiresIn: "8h" });
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PRODUCTION,
    maxAge: 8 * 60 * 60 * 1000
  };
}

function requireAdmin(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid session" });
  }
}

function toPublicUser(user) {
  return {
    id: user.id,
    fatherName: user.fatherName || user.name || null,
    motherName: user.motherName || null,
    code: user.code,
    gender: user.gender,
    revealType: user.revealType,
    revealed: user.revealed,
    revealedAt: user.revealedAt || null,
    createdAt: user.createdAt
  };
}

app.post("/api/auth/login", authLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const account = adminAccounts.find((item) => item.username === username);
  if (!account) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, account.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = createAdminSession(username);
  res.cookie(COOKIE_NAME, token, cookieOptions());
  return res.json({ ok: true, username });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  return res.json({ ok: true });
});

app.get("/api/auth/session", (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "No active session" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return res.json({ ok: true, username: payload.username });
  } catch (error) {
    return res.status(401).json({ error: "Invalid session" });
  }
});

app.get("/api/users", requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
    return res.json({ users: rows.map(dbRowToUser).map(toPublicUser) });
  } catch (err) {
    console.error("GET /api/users error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/users", requireAdmin, async (req, res) => {
  const { fatherName, motherName, gender, revealType } = req.body || {};
  if (!fatherName || !motherName || !gender || !revealType) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (!VALID_GENDERS.has(gender) || !VALID_REVEAL_TYPES.has(revealType)) {
    return res.status(400).json({ error: "Invalid gender or reveal type" });
  }

  try {
    const id = uuidv4();
    const code = generateRevealCode();
    await pool.query(
      `INSERT INTO users (id, father_name, mother_name, code, gender, reveal_type, revealed)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, String(fatherName).trim(), String(motherName).trim(), code, gender, revealType, false]
    );
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    return res.status(201).json({ user: toPublicUser(dbRowToUser(rows[0])) });
  } catch (err) {
    console.error("POST /api/users error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/users/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { fatherName, motherName, gender, revealType } = req.body || {};

  if (gender && !VALID_GENDERS.has(gender)) {
    return res.status(400).json({ error: "Invalid gender" });
  }
  if (revealType && !VALID_REVEAL_TYPES.has(revealType)) {
    return res.status(400).json({ error: "Invalid reveal type" });
  }

  try {
    const [existing] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const updates = [];
    const values = [];
    if (fatherName !== undefined) { updates.push("father_name = ?"); values.push(String(fatherName).trim()); }
    if (motherName !== undefined) { updates.push("mother_name = ?"); values.push(String(motherName).trim()); }
    if (gender) { updates.push("gender = ?"); values.push(gender); }
    if (revealType) { updates.push("reveal_type = ?"); values.push(revealType); }
    if (updates.length === 0) {
      return res.json({ user: toPublicUser(dbRowToUser(existing[0])) });
    }

    values.push(id);
    await pool.query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    return res.json({ user: toPublicUser(dbRowToUser(rows[0])) });
  } catch (err) {
    console.error("PUT /api/users error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/users/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/users error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/reveal/:code", revealLimiter, async (req, res) => {
  const code = String(req.params.code || "").trim().toUpperCase();
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE code = ?", [code]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Invalid reveal code" });
    }
    const user = dbRowToUser(rows[0]);
    const revealToken = jwt.sign(
      { userId: user.id, code: user.code, type: "reveal" },
      JWT_SECRET,
      { expiresIn: "10m" }
    );
    return res.json({
      revealToken,
      user: {
        id: user.id,
        fatherName: user.fatherName,
        motherName: user.motherName,
        code: user.code,
        gender: user.gender,
        revealType: user.revealType || "scratch",
        revealed: Boolean(user.revealed)
      }
    });
  } catch (err) {
    console.error("GET /api/reveal error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/reveal/consume", revealLimiter, async (req, res) => {
  const { revealToken } = req.body || {};
  if (!revealToken) {
    return res.status(400).json({ error: "Reveal token is required" });
  }

  let payload;
  try {
    payload = jwt.verify(revealToken, JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ error: "Invalid reveal token" });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ? AND code = ?", [payload.userId, payload.code]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found for token" });
    }
    const user = dbRowToUser(rows[0]);
    if (!user.revealed) {
      await pool.query("UPDATE users SET revealed = TRUE, revealed_at = NOW() WHERE id = ?", [user.id]);
    }
    return res.json({ gender: user.gender, revealed: true });
  } catch (err) {
    console.error("POST /api/reveal/consume error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use(express.static(path.join(__dirname, "..")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

if (require.main === module) {
  (async () => {
    try {
      await ensureDb();
      app.listen(PORT, () => {
        console.log(`Gender Reveal server running on http://localhost:${PORT}`);
      });
    } catch (err) {
      console.error("Failed to start server:", err.message);
      process.exit(1);
    }
  })();
}

module.exports = app;
