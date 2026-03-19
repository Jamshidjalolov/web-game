import Redis from 'ioredis'
import { config } from './config.js'

export const redis = config.enableRedis ? new Redis(config.redisUrl) : null
