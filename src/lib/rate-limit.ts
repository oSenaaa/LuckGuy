import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting apoiado no Upstash Redis (integração do Vercel Marketplace:
 * `vercel integration add upstash/upstash-kv`, depois `vercel env pull`).
 *
 * Se `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` não estiverem
 * presentes (ex. desenvolvimento local), o helper vira no-op e apenas registra
 * um aviso em produção — nunca quebra o fluxo.
 */
export type RateRule = { limit: number; windowSeconds: number };

let redisClient: Redis | null = null;
let redisResolved = false;

function getRedis(): Redis | null {
  if (redisResolved) return redisClient;
  redisResolved = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) redisClient = new Redis({ url, token });
  return redisClient;
}

const limiters = new Map<string, Ratelimit>();

function getLimiter(name: string, rule: RateRule): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  const key = `${name}:${rule.limit}:${rule.windowSeconds}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        rule.limit,
        `${rule.windowSeconds} s` as `${number} s`,
      ),
      prefix: `rl:${name}`,
      analytics: false,
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

let warned = false;

export async function rateLimit(
  name: string,
  identifier: string,
  rule: RateRule,
): Promise<{ success: boolean; retryAfter: number }> {
  const limiter = getLimiter(name, rule);
  if (!limiter) {
    if (process.env.NODE_ENV === "production" && !warned) {
      warned = true;
      console.warn("[rate-limit] Upstash não configurado — limites desativados.");
    }
    return { success: true, retryAfter: 0 };
  }

  const res = await limiter.limit(identifier);
  const retryAfter = res.success
    ? 0
    : Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
  return { success: res.success, retryAfter };
}

export function clientIp(headers: { get(name: string): string | null }): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
