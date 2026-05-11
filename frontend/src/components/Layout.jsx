import { useState } from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar.jsx";

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="mc-shell min-h-screen">
      <button
        type="button"
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-md transition hover:bg-white/10 md:hidden"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label="Menu"
      >
        ☰
      </button>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-56 transform transition-transform md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>
      <main className="min-h-screen pt-14 md:pt-0 md:pl-56">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
