import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
});

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null;
  try {
    const data = await redis.get<T>(key);
    return data ?? null;
  } catch {
    return null;
  }
};

export const cacheSet = async <T>(
  key: string,
  value: T,
  ttlSeconds = 60
): Promise<void> => {
  if (!process.env.UPSTASH_REDIS_REST_URL) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // silent fail — fallback to no cache
  }
};

export const cacheDel = async (pattern: string): Promise<void> => {
  if (!process.env.UPSTASH_REDIS_REST_URL) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // silent fail
  }
};
