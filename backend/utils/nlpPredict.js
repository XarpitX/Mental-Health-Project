import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ML_DIR = path.join(__dirname, "..", "ml");
const PREDICT_SCRIPT = path.join(ML_DIR, "predict.py");
const REPO_ROOT = path.join(__dirname, "..", "..");

/** Prefer project venv (same interpreter used for training) over bare `python` on PATH. */
function defaultVenvPython() {
  const win = path.join(REPO_ROOT, ".venv-ml", "Scripts", "python.exe");
  const unix = path.join(REPO_ROOT, ".venv-ml", "bin", "python3");
  const unixAlt = path.join(REPO_ROOT, ".venv-ml", "bin", "python");
  if (process.platform === "win32" && fs.existsSync(win)) return win;
  if (fs.existsSync(unix)) return unix;
  if (fs.existsSync(unixAlt)) return unixAlt;
  return null;
}

function pythonExecutable() {
  if (process.env.MOOD_NLP_PYTHON) return process.env.MOOD_NLP_PYTHON;
  const venvPy = defaultVenvPython();
  if (venvPy) return venvPy;
  return process.platform === "win32" ? "python" : "python3";
}

/**
 * Runs the scikit-learn pipeline via backend/ml/predict.py.
 * @param {string} text
 * @returns {Promise<{ ok: boolean, predicted_status?: string, confidence?: number, all_probabilities?: object, error?: string }>}
 */
export function runNlpPredict(text) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (payload) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(payload);
    };

    const bin = pythonExecutable();
    const child = spawn(bin, [PREDICT_SCRIPT], {
      cwd: ML_DIR,
      env: { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" },
      windowsHide: true,
    });

    const timer = setTimeout(() => {
      try {
        child.kill("SIGTERM");
      } catch {
        /* ignore */
      }
      finish({ ok: false, error: "timeout" });
    }, 25000);

    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr?.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", (err) => {
      finish({ ok: false, error: "spawn_failed", detail: String(err.message) });
    });
    child.on("close", (code) => {
      if (settled) return;
      if (code !== 0 && !stdout.trim()) {
        finish({
          ok: false,
          error: "python_exit",
          code,
          stderr: stderr.slice(0, 800),
        });
        return;
      }
      try {
        const data = JSON.parse(stdout.trim() || "{}");
        finish(data);
      } catch {
        finish({ ok: false, error: "bad_output", stderr: stderr.slice(0, 800) });
      }
    });

    try {
      child.stdin.write(JSON.stringify({ text }), "utf8");
      child.stdin.end();
    } catch (e) {
      finish({ ok: false, error: "stdin_failed", detail: String(e) });
    }
  });
}
