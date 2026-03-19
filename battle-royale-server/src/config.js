import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/battle_royale_answers',
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  enableRedis: process.env.ENABLE_REDIS === 'true',
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'gpt-4o-mini',
  roundSeconds: Number(process.env.ROUND_SECONDS || 30),
  eliminationThreshold: Number(process.env.ELIMINATION_THRESHOLD || 8),
}
