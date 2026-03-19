# Game Web

Frontend (`React + Vite`) va alohida backend (`FastAPI + PostgreSQL + Alembic`) loyihasi.

## Frontend

```powershell
npm install
npm run dev
```

Frontend `.env` uchun:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_AI_PROVIDER=gemini
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GEMINI_API_KEY=
VITE_GEMINI_MODEL=gemini-2.5-flash
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_OLLAMA_MODEL=qwen2.5:7b
```

AI Studio (`Gemini`) asosiy provider:

```env
VITE_AI_PROVIDER=gemini
VITE_GEMINI_API_KEY=...
```

Ixtiyoriy lokal AI (`Ollama`) ishlatish:

```powershell
ollama serve
ollama pull qwen2.5:7b
```

Default holatda frontend AI test generator `AI Studio / Gemini`ga ulanadi. Agar xohlasangiz `VITE_AI_PROVIDER=ollama` qilib lokal `Ollama`ga o'tishingiz mumkin.

## Backend

Backend to'liq instruktsiya: [backend/README.md](backend/README.md)

Qisqa start:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

## Firebase ulash (Google login)

1. Firebase Console -> `Project settings` -> `General` -> `Your apps` -> Web App.
2. Shu yerdagi `firebaseConfig` qiymatlarini frontend `.env` ga qo'ying (`VITE_FIREBASE_*`).
3. Firebase Console -> `Authentication` -> `Sign-in method` -> `Google` ni `Enable` qiling.
4. Firebase Console -> `Project settings` -> `Service accounts` -> `Generate new private key`.
5. JSON faylni `backend/firebase-service-account.json` sifatida saqlang.
6. `backend/.env` ichida:
   - `FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json`
   - `FIREBASE_PROJECT_ID=<your-project-id>`

## Nima qo'shildi

- Firebase Google login orqali backendga kirish
- Oddiy email/parol orqali ro'yxatdan o'tish va kirish
- JWT access/refresh token
- Role: `teacher` (default), `admin`
- Teacherga tegishli savollarni izolyatsiya qilish
- O'yin katalogini backenddan olish (`/api/v1/games`)
- O'yin savollarini backenddan olish (`/api/v1/questions?game_id=...`) va arena sahifalarda ishlatish
- Alembic migration va PostgreSQL schema
