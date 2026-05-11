import { motion } from "framer-motion";
import { useEffect, useState } from "react";

function CountUpNumber({ value }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const durationMs = 650;
    const start = performance.now();
    const from = 0;
    const to = value;
    let raf = 0;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setShown(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span>{shown}</span>;
}

export default function StatCard({ title, value, subtitle, icon }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mc-gradient-border rounded-2xl"
    >
      <div className="mc-glass rounded-2xl p-5 transition duration-300 ease-out hover:shadow-[0_22px_60px_rgba(0,0,0,0.55)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-mc-muted/90">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {typeof value === "number" ? <CountUpNumber value={value} /> : <span>{value}</span>}
          </p>
          {subtitle && <p className="mt-1 text-xs text-mc-muted/80">{subtitle}</p>}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mc-accent/15 text-mc-accent shadow-[0_0_0_1px_rgba(252,163,17,0.15)]">
            {icon}
          </div>
        )}
      </div>
      </div>
    </motion.div>
  );
}
