import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

const linksByRole = {
  user: [
    { to: "/user-dashboard", label: "Dashboard", icon: "dashboard" },
    { to: "/chat", label: "AI Chat", icon: "chat" },
    { to: "/mood", label: "Mood Tracker", icon: "mood" },
    { to: "/exercise", label: "Exercises", icon: "spark" },
    { to: "/read-up-on-it", label: "Read Up On It", icon: "book" },
    { to: "/counsellor-request", label: "Counsellor Request", icon: "request" },
    { to: "/profile", label: "Profile", icon: "user" },
  ],
  admin: [
    { to: "/admin-dashboard", label: "Admin Dashboard", icon: "dashboard" },
    { to: "/profile", label: "Profile", icon: "user" },
  ],
  consultant: [
    { to: "/counsellor-dashboard", label: "Counsellor Panel", icon: "request" },
    { to: "/profile", label: "Profile", icon: "user" },
  ],
};

function Icon({ name }) {
  const common = "h-4 w-4";
  switch (name) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 13h7V4H4v9ZM13 20h7v-7h-7v7ZM13 11h7V4h-7v7ZM4 20h7v-5H4v5Z" />
        </svg>
      );
    case "chat":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
          <path d="M7 9h10M7 13h7" />
        </svg>
      );
    case "mood":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10Z" />
        </svg>
      );
    case "spark":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l1.5 6L20 10l-6.5 2L12 18l-1.5-6L4 10l6.5-2L12 2Z" />
          <path d="M19 13l.8 3L23 17l-3.2 1-.8 3-.8-3L15 17l3.2-1 .8-3Z" />
        </svg>
      );
    case "request":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 3h12a2 2 0 0 1 2 2v14l-4-3H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
          <path d="M8 8h8M8 12h5" />
        </svg>
      );
    case "book":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19a2 2 0 0 0 2 2h14" />
          <path d="M6 2h14v19H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
          <path d="M8 6h8M8 10h8M8 14h6" />
        </svg>
      );
    case "user":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21a8 8 0 0 0-16 0" />
          <path d="M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
        </svg>
      );
    default:
      return <span className="inline-block h-4 w-4" />;
  }
}

export default function Sidebar({ onNavigate }) {
  const { user } = useAuth();
  const links = linksByRole[user?.role] || linksByRole.user;

  return (
    <aside className="flex h-full w-56 flex-col border-r border-white/5 bg-[#14213D] shadow-xl md:shadow-none">
      <div className="border-b border-white/10 px-5 py-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl text-mc-accent">●</span>
          <span className="text-lg font-semibold tracking-tight text-white">MindCare</span>
        </div>
        <p className="mt-1 text-xs text-mc-muted/90">Mental health support</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to.includes("dashboard")}
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              [
                "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-out",
                isActive
                  ? "bg-mc-accent/15 text-mc-accent shadow-[0_0_0_1px_rgba(252,163,17,0.18),0_10px_30px_rgba(252,163,17,0.08)]"
                  : "text-mc-muted/90 hover:translate-x-1 hover:bg-white/5 hover:text-white hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
              ].join(" ")
            }
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-black/20 text-white/90 transition duration-300 group-hover:border-white/20 group-hover:bg-black/30 group-hover:text-white">
              <Icon name={icon} />
            </span>
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
