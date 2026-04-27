type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
};

const globalForRateLimit = globalThis as unknown as {
  northlineRateLimitStore?: Map<string, RateLimitBucket>;
};

export function checkRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): RateLimitResult {
  const now = input.now ?? Date.now();
  const store = getStore();
  const existing = store.get(input.key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + input.windowMs;
    store.set(input.key, { count: 1, resetAt });
    pruneExpiredBuckets(store, now);
    return {
      allowed: true,
      remaining: Math.max(input.limit - 1, 0),
      resetAt: new Date(resetAt),
    };
  }

  if (existing.count >= input.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(existing.resetAt),
    };
  }

  existing.count += 1;
  store.set(input.key, existing);

  return {
    allowed: true,
    remaining: Math.max(input.limit - existing.count, 0),
    resetAt: new Date(existing.resetAt),
  };
}

export function resetRateLimitStore() {
  globalForRateLimit.northlineRateLimitStore = new Map();
}

function getStore() {
  if (!globalForRateLimit.northlineRateLimitStore) {
    globalForRateLimit.northlineRateLimitStore = new Map();
  }
  return globalForRateLimit.northlineRateLimitStore;
}

function pruneExpiredBuckets(store: Map<string, RateLimitBucket>, now: number) {
  if (store.size < 1000) return;
  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}
