# Game Web Backend

FastAPI backend with:

- Firebase Google sign-in verification
- JWT access/refresh tokens
- Role system (`teacher`, `admin`)
- Teacher-only question ownership (admin can access all)
- PostgreSQL + Alembic migrations
- Games catalog served from backend

## 1. Setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` values:

- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `FIREBASE_CREDENTIALS_PATH` (Firebase service-account JSON path)
- `FIREBASE_PROJECT_ID`
- `ADMIN_EMAILS` (comma-separated admin emails)
- `AI_HF_API_TOKEN` (HuggingFace token, ixtiyoriy lekin tavsiya qilinadi)
- `AI_HF_MODEL` (default: `google/flan-t5-large`)

## 2. Run migrations

```powershell
alembic upgrade head
```

## 3. Start API

```powershell
uvicorn app.main:app --reload --port 8000
```

Health endpoint:

- `GET http://localhost:8000/health`

## 4. Main endpoints

- `POST /api/v1/auth/firebase-login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `GET /api/v1/games`
- `GET /api/v1/games/{game_id}`
- `GET /api/v1/questions` (teacher gets only own questions)
- `POST /api/v1/questions`
- `POST /api/v1/questions/generate-ai`
- `POST /api/v1/questions/seed-demo` (demo savol yaratish)
- `PATCH /api/v1/questions/{question_id}`
- `DELETE /api/v1/questions/{question_id}`
- `GET /api/v1/users` (admin only)
- `PATCH /api/v1/users/{user_id}/role` (admin only)

## 5. Quick test flow

1. Swagger oching: `http://localhost:8000/docs`
2. `POST /api/v1/auth/register` orqali oddiy email/parol bilan user yarating.
3. Javobdan `access_token`ni oling va Swagger `Authorize`ga `Bearer <token>` ko'rinishida qo'ying.
4. `POST /api/v1/questions/seed-demo` ni chaqiring.
5. `GET /api/v1/questions?game_id=box-jang` bilan savol bazaga yozilganini tekshiring.

## AI generator input

`POST /api/v1/questions/generate-ai` body:

```json
{
  "subject": "Matematika",
  "topic": "Kasrlar",
  "count": 5,
  "game_id": "box-jang",
  "difficulty": "O'rta"
}
```
