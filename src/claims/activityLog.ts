import type { RedisClient } from '@devvit/public-api';
import { Keys } from '../redis/keys.js';
import type { ActivityEntry } from '../types.js';

const MAX_ENTRIES = 50;

export async function logActivity(
  redis: RedisClient,
  subId: string,
  entry: Omit<ActivityEntry, 'timestamp'>
): Promise<void> {
  const key = Keys.activityLog(subId);
  const now = Date.now();
  const full = { ...entry, timestamp: now } as ActivityEntry;

  await redis.zAdd(key, { score: now, member: JSON.stringify(full) });
  // Prune oldest entries beyond the cap
  await redis.zRemRangeByRank(key, 0, -(MAX_ENTRIES + 1));
}

export async function getRecentActivity(
  redis: RedisClient,
  subId: string,
  limit = 20
): Promise<ActivityEntry[]> {
  const key = Keys.activityLog(subId);
  // zRange with reverse + rank gives newest first
  const results = await redis.zRange(key, '+inf', '-inf', {
    by: 'score',
    reverse: true,
    limit: { offset: 0, count: limit },
  });
  return results.map((r) => JSON.parse(r.member) as ActivityEntry);
}
