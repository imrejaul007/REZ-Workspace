import Redis from 'ioredis';

declare global {
  // eslint-disable-next-line no-var
  var redisClient: Redis | undefined;
}

export function getGlobalRedis(): Redis | undefined {
  return global.redisClient;
}

export function setGlobalRedis(client: Redis): void {
  global.redisClient = client;
}