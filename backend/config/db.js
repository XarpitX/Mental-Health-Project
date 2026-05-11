export async function connectDB() {
  const provider = (process.env.DB_PROVIDER || "file").toLowerCase();
  if (provider === "file") {
    console.log("DB provider: file (backend/data/db.json)");
    return;
  }

  const { default: mongoose } = await import("mongoose");

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Set it or use DB_PROVIDER=file to store data locally in backend/data/db.json."
    );
  }

  const maxAttempts = 12;
  const delayMs = 2500;
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await mongoose.connect(uri);
      console.log("MongoDB connected");
      return;
    } catch (err) {
      lastErr = err;
      console.error(`[MongoDB] connection attempt ${attempt}/${maxAttempts} failed: ${err.message || err}`);
      if (attempt < maxAttempts) {
        console.error(`Retrying in ${delayMs / 1000}s… (is MongoDB running?)`);
        await sleep(delayMs);
      }
    }
  }
  throw lastErr;
}
