import { Redis } from 'ioredis';
import { env } from './env.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('error', (error: Error) => {
  if (env.NODE_ENV !== 'test') {
    console.error('Redis connection error:', error.message);
  }
});

export const connectRedis = async () => {
  if (redis.status === 'wait' || redis.status === 'end') {
    await redis.connect();
  }
};

export const disconnectRedis = async () => {
  if (redis.status !== 'end') {
    await redis.quit();
  }
};
