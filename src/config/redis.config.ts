export const redisConfig = {
  redisHost: process.env.REDIS_HOST || "redis",
  redisPort: Number(process.env.REDIS_PORT) || 6379,
  redisPassword: process.env.REDIS_PASSWORD || "",
};

export default redisConfig;
