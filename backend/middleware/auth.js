import jwt from "jsonwebtoken";
import { getDb, updateDb, nowIso } from "../storage/fileDb.js";

export async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = await getDb();
    const user = db.users.find((u) => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User account not found" });
    }
    await updateDb((draft) => {
      const idx = draft.users.findIndex((u) => u.id === decoded.userId);
      if (idx >= 0) draft.users[idx].lastActive = nowIso();
      return draft;
    });
    req.userId = user.id;
    const { password, ...publicUser } = user;
    req.user = publicUser;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function roleMiddleware(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have access to this resource" });
    }
    next();
  };
}
