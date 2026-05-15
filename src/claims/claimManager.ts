import type { RedisClient } from '@devvit/public-api';
import { Keys, TTL } from '../redis/keys.js';
import type { ClaimData, ClaimStatus, ActiveMod } from '../types.js';

export async function tryClaimItem(
  redis: RedisClient,
  subId: string,
  itemId: string,
  mod: { id: string; username: string },
  status: ClaimStatus = 'claimed',
  flairInfo: { isPost: boolean; originalText: string | null; originalCssClass: string | null } = { isPost: false, originalText: null, originalCssClass: null }
): Promise<{ success: boolean; existingClaim?: ClaimData }> {
  const key = Keys.claim(subId, itemId);
  const ttlSeconds = status === 'claimed' ? TTL.claimed : TTL.investigating;
  const value = JSON.stringify({
    modId: mod.id,
    modUsername: mod.username,
    status,
    claimedAt: Date.now(),
    itemId,
    isPost: flairInfo.isPost,
    originalFlairText: flairInfo.originalText,
    originalFlairCssClass: flairInfo.originalCssClass,
  } satisfies ClaimData);

  // SET NX — atomic, returns 'OK' on success or null if key already exists
  const result = await redis.set(key, value, {
    nx: true,
    expiration: new Date(Date.now() + ttlSeconds * 1000),
  });

  if (result === null || result === undefined) {
    const existing = await redis.get(key);
    return {
      success: false,
      existingClaim: existing ? (JSON.parse(existing) as ClaimData) : undefined,
    };
  }
  return { success: true };
}

export async function upgradeClaim(
  redis: RedisClient,
  subId: string,
  itemId: string,
  modId: string
): Promise<boolean> {
  const key = Keys.claim(subId, itemId);
  const raw = await redis.get(key);
  if (!raw) return false;

  const claim = JSON.parse(raw) as ClaimData;
  if (claim.modId !== modId) return false;

  claim.status = 'investigating';
  await redis.set(key, JSON.stringify(claim), {
    expiration: new Date(Date.now() + TTL.investigating * 1000),
  });
  return true;
}

export async function getClaim(
  redis: RedisClient,
  subId: string,
  itemId: string
): Promise<ClaimData | null> {
  const raw = await redis.get(Keys.claim(subId, itemId));
  return raw ? (JSON.parse(raw) as ClaimData) : null;
}

export async function releaseClaim(
  redis: RedisClient,
  subId: string,
  itemId: string,
  modId: string
): Promise<boolean> {
  const claim = await getClaim(redis, subId, itemId);
  if (!claim || claim.modId !== modId) return false;
  await redis.del(Keys.claim(subId, itemId));
  return true;
}

export async function forceReleaseClaim(
  redis: RedisClient,
  subId: string,
  itemId: string
): Promise<ClaimData | null> {
  const claim = await getClaim(redis, subId, itemId);
  if (!claim) return null;
  await redis.del(Keys.claim(subId, itemId));
  return claim;
}

export async function touchActiveMod(
  redis: RedisClient,
  subId: string,
  mod: { id: string; username: string }
): Promise<void> {
  const key = Keys.activeMods(subId);
  await redis.hSet(key, {
    [mod.id]: JSON.stringify({ modId: mod.id, username: mod.username, lastSeen: Date.now() } satisfies ActiveMod),
  });
  await redis.expire(key, TTL.activeMod);
}

export async function getActiveMods(
  redis: RedisClient,
  subId: string
): Promise<ActiveMod[]> {
  const key = Keys.activeMods(subId);
  const raw = await redis.hGetAll(key);
  const cutoff = Date.now() - TTL.activeMod * 1000;
  return Object.values(raw)
    .map((v) => JSON.parse(v) as ActiveMod)
    .filter((m) => m.lastSeen > cutoff)
    .sort((a, b) => b.lastSeen - a.lastSeen);
}
