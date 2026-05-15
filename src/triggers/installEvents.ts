import type { TriggerContext } from '@devvit/public-api';
import { Keys } from '../redis/keys.js';

export async function handleInstall(_event: unknown, context: TriggerContext): Promise<void> {
  const subId = context.subredditId;
  if (!subId) return;

  const existing = await context.redis.get(Keys.dashboardId(subId));
  if (existing) return;

  console.log(`[ModSync] Installed in subreddit ${subId} — dashboard will be created on first use.`);
}
