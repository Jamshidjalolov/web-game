import http from 'node:http'
import mongoose from 'mongoose'
import { Server } from 'socket.io'
import { app } from './app.js'
import { config } from './config.js'
import { redis } from './redis.js'
import { registerBattleHandlers } from './socket/registerBattleHandlers.js'

await mongoose.connect(config.mongoUri)

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: config.clientOrigin,
    credentials: true,
  },
})

registerBattleHandlers(io)

server.listen(config.port, () => {
  console.log(`Battle Royale server listening on ${config.port}`)
})

const shutdown = async () => {
  await mongoose.disconnect()
  if (redis) {
    await redis.quit()
  }
  io.close()
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
