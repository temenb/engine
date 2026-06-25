import Redis from "ioredis";
import redisConfig from "../config/redis.config";

let redis: Redis | null = null;

export async function initRedis(
  host: string = redisConfig.redisHost,
  port: number = redisConfig.redisPort,
  password: string = redisConfig.redisPassword
): Promise<void> {
  if (redis) return;

  redis = new Redis({host, port, password});

  return new Promise<void>((resolve, reject) => {
    redis!.on("connect", () => {
      console.log("🟢 Redis connected");
      resolve();
    });

    redis!.on("error", (err) => {
      console.error("❌ Redis error", err);
      reject(err);
    });
  });
}

export function getRedis(): Redis {
  if (!redis) {
    throw new Error("Redis not initialized. Call initRedis() first.");
  }
  return redis;
}

export async function shutdownRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log("🛑 Redis connection closed");
  }
}
