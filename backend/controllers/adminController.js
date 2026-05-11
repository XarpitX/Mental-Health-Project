import { getDb } from "../storage/fileDb.js";

export async function adminOverview(_req, res) {
  try {
    const db = await getDb();
    const users = [...db.users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.isOnline).length;
    const criticalUserIds = new Set(db.assessments.filter((a) => a.status === "critical").map((a) => a.userId));

    const consultantsById = new Map(
      db.users
        .filter((u) => u.role === "consultant")
        .map((u) => {
          const { password, ...rest } = u;
          return [u.id, rest];
        })
    );
    const requestByUserId = new Map(
      db.consultRequests
        .filter((r) => r.status === "pending" || r.status === "accepted")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((r) => [r.userId, r])
    );

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        criticalUsers: criticalUserIds.size,
      },
      users: users.map((user) => {
        const { password, ...rest } = user;
        const req = requestByUserId.get(user.id) || null;
        const consultant = req?.consultantId ? consultantsById.get(req.consultantId) || null : null;
        return {
          ...rest,
          consultAssignment: req
            ? {
                requestId: req.id,
                requestStatus: req.status,
                createdAt: req.createdAt,
                consultant,
              }
            : null,
        };
      }),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load admin dashboard" });
  }
}
