import { execSync } from "node:child_process";

const defaultPorts = [5000, 5173, 5174, 5175, 5176];
const portsFromArgs = process.argv
  .slice(2)
  .map((x) => Number(x))
  .filter((n) => Number.isFinite(n) && n > 0);
const ports = portsFromArgs.length ? portsFromArgs : defaultPorts;

function run(cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
  } catch (e) {
    const out = (e?.stdout || "") + (e?.stderr || "");
    return out;
  }
}

function killPid(pid) {
  if (!pid) return;
  if (process.platform === "win32") {
    run(`taskkill /PID ${pid} /T /F`);
  } else {
    run(`kill -9 ${pid}`);
  }
}

function unique(list) {
  return [...new Set(list.filter(Boolean))];
}

function freePortsWindows() {
  // netstat output includes LISTENING lines like:
  // TCP    0.0.0.0:5000   0.0.0.0:0   LISTENING   12345
  const pids = [];
  for (const port of ports) {
    // Much more reliable than parsing netstat (IPv6, formatting differences, etc.)
    const out = run(
      `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"`
    );
    for (const s of out.split(/\s+/)) {
      const n = Number(s);
      if (Number.isFinite(n)) pids.push(n);
    }
  }
  for (const pid of unique(pids)) killPid(pid);
}

function freePortsUnix() {
  // mac/linux: lsof is common; fall back to fuser if available.
  const hasLsof = run("command -v lsof").trim();
  if (hasLsof) {
    const pids = [];
    for (const port of ports) {
      const out = run(`lsof -ti tcp:${port} -sTCP:LISTEN`);
      for (const s of out.split(/\s+/)) {
        const n = Number(s);
        if (Number.isFinite(n)) pids.push(n);
      }
    }
    for (const pid of unique(pids)) killPid(pid);
    return;
  }

  const hasFuser = run("command -v fuser").trim();
  if (hasFuser) {
    for (const port of ports) run(`fuser -k ${port}/tcp`);
  }
}

try {
  if (process.platform === "win32") freePortsWindows();
  else freePortsUnix();
} catch {
  // Best-effort: don't block dev startup if port freeing fails.
}

