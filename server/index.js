const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";
const JWT_SECRET = process.env.JWT_SECRET || "change-this-in-production";
const COOKIE_NAME = "gr_admin_session";
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "users.json");
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const DEMO_USER = process.env.DEMO_USER || "demo";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "demo123";
const VALID_GENDERS = new Set(["boy", "girl"]);
const VALID_REVEAL_TYPES = new Set(["scratch", "balloon", "gift", "tap"]);

if (IS_PRODUCTION && JWT_SECRET === "change-this-in-production") {
  throw new Error("JWT_SECRET must be set in production.");
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function generateRevealCode() {
  return crypto.randomBytes(4).toString("base64url").toUpperCase();
}

function readUsers() {
  if (!fs.existsSync(DATA_FILE)) {
    return seedUsers();
  }

  try {
    const data = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to parse users file, reseeding:", error);
    return seedUsers();
  }
}

function writeUsers(users) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), "utf8");
}

function seedUsers() {
  const users = [
    {
      id: uuidv4(),
      fatherName: "John Doe",
      motherName: "Jane Smith",
      code: generateRevealCode(),
      gender: "boy",
      revealType: "scratch",
      revealed: false,
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      fatherName: "Michael Brown",
      motherName: "Sarah Brown",
      code: generateRevealCode(),
      gender: "girl",
      revealType: "balloon",
      revealed: true,
      revealedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
  ];
  writeUsers(users);
  return users;
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

app.get("/api/users", requireAdmin, (req, res) => {
  const users = readUsers();
  return res.json({ users: users.map(toPublicUser) });
});

app.post("/api/users", requireAdmin, (req, res) => {
  const { fatherName, motherName, gender, revealType } = req.body || {};
  console.log("POST /api/users body:", req.body);
  if (!fatherName || !motherName || !gender || !revealType) {
    return res.status(400).json({ error: `Missing required fields. Received: fatherName=${fatherName}, motherName=${motherName}, gender=${gender}, revealType=${revealType}` });
  }
  if (!VALID_GENDERS.has(gender) || !VALID_REVEAL_TYPES.has(revealType)) {
    return res.status(400).json({ error: "Invalid gender or reveal type" });
  }

  const users = readUsers();
  const nextUser = {
    id: uuidv4(),
    fatherName: String(fatherName).trim(),
    motherName: String(motherName).trim(),
    code: generateRevealCode(),
    gender,
    revealType,
    revealed: false,
    createdAt: new Date().toISOString()
  };
  users.push(nextUser);
  writeUsers(users);
  return res.status(201).json({ user: toPublicUser(nextUser) });
});

app.put("/api/users/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { fatherName, motherName, gender, revealType } = req.body || {};
  const users = readUsers();
  const index = users.findIndex((item) => item.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "User not found" });
  }
  if (gender && !VALID_GENDERS.has(gender)) {
    return res.status(400).json({ error: "Invalid gender" });
  }
  if (revealType && !VALID_REVEAL_TYPES.has(revealType)) {
    return res.status(400).json({ error: "Invalid reveal type" });
  }

  users[index] = {
    ...users[index],
    fatherName: String(fatherName || users[index].fatherName || users[index].name || "").trim(),
    motherName: String(motherName || users[index].motherName || "").trim(),
    gender: gender || users[index].gender,
    revealType: revealType || users[index].revealType
  };
  writeUsers(users);
  return res.json({ user: toPublicUser(users[index]) });
});

app.delete("/api/users/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const users = readUsers();
  const index = users.findIndex((item) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  users.splice(index, 1);
  writeUsers(users);
  return res.json({ ok: true });
});

app.get("/api/reveal/:code", revealLimiter, (req, res) => {
  const code = String(req.params.code || "").trim().toUpperCase();
  const users = readUsers();
  const user = users.find((item) => item.code === code);
  if (!user) {
    return res.status(404).json({ error: "Invalid reveal code" });
  }

  const revealToken = jwt.sign(
    { userId: user.id, code: user.code, type: "reveal" },
    JWT_SECRET,
    { expiresIn: "10m" }
  );

  return res.json({
    revealToken,
    user: {
      id: user.id,
      fatherName: user.fatherName || user.name || null,
      motherName: user.motherName || null,
      code: user.code,
      gender: user.gender,
      revealType: user.revealType || "scratch",
      revealed: Boolean(user.revealed)
    }
  });
});

app.post("/api/reveal/consume", revealLimiter, (req, res) => {
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

  const users = readUsers();
  const index = users.findIndex((item) => item.id === payload.userId);
  if (index === -1 || users[index].code !== payload.code) {
    return res.status(404).json({ error: "User not found for token" });
  }

  if (!users[index].revealed) {
    users[index].revealed = true;
    users[index].revealedAt = new Date().toISOString();
    writeUsers(users);
  }

  return res.json({
    gender: users[index].gender,
    revealed: true
  });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use(express.static(path.join(__dirname, "..")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Gender Reveal server running on http://localhost:${PORT}`);
});
