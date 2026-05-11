# MindCare

Modern multi-role mental-health support web app (React + Vite + Node/Express).

MindCare includes:
- **Multi-role auth**: `user | admin | consultant`
- **User dashboard flow**: first-time **Mental Health Assessment (10 questions)** → score → guidance
- **Consultant request system**: auto-created for **CRITICAL** assessments
- **Consultant dashboard**: requests list → accept/complete → chat with user (saved)
- **Admin dashboard**: user monitoring (online/last active) + assignment mapping
- **Mood tracker**: journal + **local NLP** (TF-IDF + logistic regression on `mental_health_dataset.csv`) — saves the model’s **7-class label** (e.g. Anxiety, Normal) and a fixed chart score; optional keyword fallback if Python/model is unavailable
- **Read Up On It**: articles (conditions + motivational reads)
- **Exercises library** + **AI chat** (rule-based chatbot with anti-repetition)

## Quick start (one command)

From the project root:

```bash
npm install
npm run dev
```

- Frontend: `http://localhost:5173` (dev may auto-pick `5174+` if busy)
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

If you previously ran the app and ports are stuck, `npm run dev` will automatically free ports `5000` and `5173–5176` before starting.

## Windows / PowerShell note

If you run commands manually in PowerShell, use `;` instead of `&&` between commands.

## Database (default: local file storage, no Docker needed)

By default the backend uses a **file-based DB** stored at:

- `backend/data/db.json`

This means **your data stays saved even if you stop/kill terminals**.

### Optional: use MongoDB instead
If you want MongoDB, set:
- `DB_PROVIDER=mongo`
- `MONGODB_URI=...`

and run MongoDB (Docker is optional; see `docker-compose.yml`).

## Environment variables

Create `backend/.env` (minimum):

```env
PORT=5000
JWT_SECRET=change_this_to_a_long_random_string
FRONTEND_ORIGIN=http://localhost:5173

# DB_PROVIDER=file   # default (stores data in backend/data/db.json)
# DB_PROVIDER=mongo  # optional
# MONGODB_URI=mongodb://127.0.0.1:27017/mindcare

# Optional — mood NLP: path to Python if the backend cannot find .venv-ml automatically
# MOOD_NLP_PYTHON=C:\path\to\medicare\.venv-ml\Scripts\python.exe
```

## Project structure

- `frontend/`: React + Vite client
- `backend/`: Express API
- `backend/data/db.json`: file database (auto-created)
- `backend/ml/`: Python mood NLP — `train.py`, `predict.py`, `text_utils.py`; trained weights `mental_health_model.pkl` (created locally, not required for first `npm run dev`)
- `mental_health_dataset.csv`: training/eval data for the mood classifier (repo root)
- `docker-compose.yml`: optional MongoDB container (only needed if you switch to `DB_PROVIDER=mongo`)

## Mood tracker NLP (optional)

Journal analysis uses a **small scikit-learn pipeline** (same idea as `mental_health_model (1).py` in the repo): preprocess text → TF-IDF → logistic regression → one of **Depression, Suicidal, Personality Disorder, Stress, Normal, Bi-Polar, Anxiety**. That string is stored as **`moodType`** for NLP entries. The numeric **score** is a fixed per-label value for charts (not derived from model confidence).

**Train the model** (from repo root; use a venv if your global `pip` is broken):

```powershell
python -m venv .venv-ml
.\.venv-ml\Scripts\python.exe -m pip install -r backend\ml\requirements.txt
.\.venv-ml\Scripts\python.exe backend\ml\train.py
```

On macOS/Linux, use `.venv-ml/bin/python3` instead of `Scripts\python.exe`.

If `backend/ml/mental_health_model.pkl` is missing, journal analysis falls back to **keyword** rules until you train.

**Python path**: the API runs `backend/ml/predict.py`. It looks for `.venv-ml` under the repo root first; override with `MOOD_NLP_PYTHON` in `backend/.env` if needed.

## Roles & routing

After login:
- `user` → `/user-dashboard`
- `admin` → `/admin-dashboard`
- `consultant` → `/consultant-dashboard`

Registration/Login UI lets you pick a role. (Role is saved on register; on login it verifies the selected role matches the account.)

## User assessment flow

User login → Assessment (10 questions, 1–5 scale) → score (10–50):
- **40–50**: GOOD
- **25–39**: MEDIUM → redirected to Exercises
- **10–24**: CRITICAL → consultant request created + redirected to Consultant Request page

Assessment attempts are **not overwritten**. Every submission is saved and shown in **Assessment history**.

## Consultant assignment rule

- **1 consultant can be assigned to only 1 user at a time** (accepted request).
- Admin + Consultant dashboards show **which consultant is assigned to which user**.

## Useful scripts

From the project root:

- `npm run dev`: run backend + frontend together
- `npm run dev:backend`: backend only
- `npm run dev:frontend`: frontend only
- `npm run db:up`: start MongoDB via Docker (optional)
- `npm run db:down`: stop MongoDB via Docker (optional)

## API endpoints (backend)

- `GET /api/health`: health check
- `POST /api/auth/register`: create account (supports `role`)
- `POST /api/auth/login`: login
- `POST /api/auth/logout`: logout (updates online status)
- `GET /api/auth/me`: current user (requires `Authorization: Bearer <token>`)

### Assessments (user)
- `GET /api/assessments/me/latest`
- `GET /api/assessments/me/history`
- `POST /api/assessments`
- `GET /api/assessments/me/request` (includes assigned consultant, if accepted)

### Consultant requests (consultant)
- `GET /api/consultant/requests`
- `PATCH /api/consultant/requests/:id/accept`
- `PATCH /api/consultant/requests/:id/complete`

### Consultant request chat (stored in file DB)
- User:
  - `GET /api/consult/user/me/messages`
  - `POST /api/consult/user/requests/:id/messages`
- Consultant:
  - `GET /api/consult/consultant/requests/:id/messages`
  - `POST /api/consult/consultant/requests/:id/messages`

### Chatbot (user)
- `GET /api/chat`: list chats
- `GET /api/chat/:id`: get chat
- `POST /api/chat`: send message (saves conversation)

### Mood tracker (user)
- `GET /api/moods`: list moods
- `POST /api/moods/analyze`: body `{ "note": "..." }` — returns NLP suggestion (label + score) without saving (requires auth)
- `POST /api/moods`: create mood entry (`date`, optional `note`; with journal text the backend infers **moodType** + **score** via NLP or keyword fallback). `moodType` may be a legacy bucket (`happy` \| `sad` \| `anxious` \| `stressed`) or a **model label** (seven classes above).
- `GET /api/moods/stats`: mood stats for dashboard

## Troubleshooting

- **Blank/empty page**: open DevTools Console. A runtime error will prevent rendering.
- **401 Authentication required**: you must login first (token stored in `localStorage` as `mindcare_token`).
- **Backend fails to start**:
  - ensure `backend/.env` exists and has `JWT_SECRET`
  - if using MongoDB: ensure MongoDB is running and `MONGODB_URI` is correct
- **CORS issues**: set `FRONTEND_ORIGIN` in `backend/.env` to match your Vite dev URL.
- **Mood “Analyze journal” fails or uses keywords only**: train the model (see **Mood tracker NLP**), confirm `backend/ml/mental_health_model.pkl` exists, and ensure Python works from the backend process (set `MOOD_NLP_PYTHON` to your venv’s `python.exe` / `python3` if needed). Check the backend terminal for Python stderr.

## Notes

- This project intentionally uses a **local/rule-based chatbot** (no external AI API calls for chat).
- Mood journal NLP is **local** (subprocess to Python); no third-party inference APIs.
- System requirements checklist (Node, optional Python/Mongo): see **`requirements.txt`** at the repo root. Python package pins for training: **`backend/ml/requirements.txt`**.
- If you don’t want to commit local user data, add `backend/data/db.json` to `.gitignore`. You may also ignore `.venv-ml/` and `backend/ml/mental_health_model.pkl` if you prefer not to commit venv or weights.

