import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const DEFAULT_DB = {
  users: [],
  moods: [],
  chats: [],
  assessments: [],
  consultRequests: [],
};

let mem = null;
let writing = Promise.resolve();

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readDbFromDisk() {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = raw ? JSON.parse(raw) : DEFAULT_DB;
    return { ...DEFAULT_DB, ...parsed };
  } catch (err) {
    if (err.code === "ENOENT") return { ...DEFAULT_DB };
    throw err;
  }
}

async function writeDbToDisk(nextDb) {
  await ensureDataDir();
  await fs.writeFile(DB_PATH, JSON.stringify(nextDb, null, 2), "utf8");
}

export async function getDb() {
  if (!mem) mem = await readDbFromDisk();
  return mem;
}

export async function updateDb(mutator) {
  writing = writing.then(async () => {
    const db = await getDb();
    const next = await mutator(structuredClone(db));
    mem = next || db;
    await writeDbToDisk(mem);
  });
  await writing;
  return mem;
}

export function newId(prefix = "") {
  const id = crypto.randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}

export function nowIso() {
  return new Date().toISOString();
}
