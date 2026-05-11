import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb, newId, nowIso, updateDb } from "../storage/fileDb.js";

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isOnline: user.isOnline,
    lastActive: user.lastActive,
  };
}

export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (role != null && !["user", "admin", "consultant"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const db = await getDb();
    const normalizedEmail = email.toLowerCase();
    const existing = db.users.find((u) => u.email === normalizedEmail);
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = {
      id: newId("usr"),
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashed,
      role: role || "user",
      isOnline: true,
      lastActive: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await updateDb((draft) => {
      draft.users.push(user);
      return draft;
    });
    const token = signToken(user.id);
    res.status(201).json({
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const db = await getDb();
    const user = db.users.find((u) => u.email === email.toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    await updateDb((draft) => {
      const idx = draft.users.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        draft.users[idx].isOnline = true;
        draft.users[idx].lastActive = nowIso();
        draft.users[idx].updatedAt = nowIso();
      }
      return draft;
    });
    const token = signToken(user.id);
    res.json({
      token,
      user: publicUser({ ...user, isOnline: true, lastActive: nowIso() }),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
}

export async function me(req, res) {
  try {
    res.json({ user: publicUser(req.user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load profile" });
  }
}

export async function logout(req, res) {
  try {
    await updateDb((draft) => {
      const idx = draft.users.findIndex((u) => u.id === req.userId);
      if (idx >= 0) {
        draft.users[idx].isOnline = false;
        draft.users[idx].lastActive = nowIso();
        draft.users[idx].updatedAt = nowIso();
      }
      return draft;
    });
    res.json({ message: "Logged out" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Logout failed" });
  }
}
