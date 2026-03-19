# 1 Question - 100 Answers: Battle Royale Team Edition

`battle-royale-server/` is a standalone realtime backend for the new game.

## Folder structure

```text
battle-royale-server/
  package.json
  .env.example
  src/
    config.js
    server.js
    app.js
    redis.js
    models/
      User.js
      Team.js
      Room.js
      Question.js
      GlobalLeaderboard.js
    services/
      aiQuestionGenerator.js
      scoringEngine.js
      roomStore.js
    socket/
      registerBattleHandlers.js
```

## Features

- Socket.IO room management for 50+ players
- Auto team assignment for 2-3 teams
- Multi-answer round scoring with unique, duplicate, and clash logic
- Elimination tracking
- MongoDB persistence for users, rooms, teams, questions, and global leaderboard
- Optional Redis hook for high-throughput leaderboard caching
- Teacher/admin HTTP endpoints for question CRUD
- AI question generation endpoint with fallback question builder

## Local run

1. `cd battle-royale-server`
2. `cp .env.example .env`
3. `npm install`
4. `npm run dev`

## Deploy

### Vercel frontend + Render/Heroku/Fly backend

1. Deploy this React frontend to Vercel.
2. Deploy `battle-royale-server` to Render/Heroku/Fly as a Node service.
3. Set `CLIENT_ORIGIN` to your frontend domain.
4. Provision MongoDB Atlas and put the connection string into `MONGODB_URI`.
5. Optional: add Redis and set `ENABLE_REDIS=true` with `REDIS_URL`.

### MongoDB Atlas

1. Create a cluster.
2. Add the backend host IP or allow trusted access.
3. Create a database user.
4. Use the SRV string as `MONGODB_URI`.

## Socket events

- `join_room`
- `assign_teams`
- `start_game`
- `new_question`
- `submit_answer`
- `round_result`
- `update_team_leaderboard`
- `player_eliminated`
- `game_end`

## Notes

- AI generation uses `OPENAI_API_KEY` when available.
- Without AI credentials, the service falls back to template-based multi-answer questions.
- Redis is optional; in-memory room state remains the primary live source of truth.
