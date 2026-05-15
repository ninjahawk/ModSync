import type { TriggerContext } from '@devvit/public-api';
import { Keys } from '../redis/keys.js';

export async function handleInstall(_event: unknown, context: TriggerContext): Promise<void> {
  const subId = context.subredditId;
  if (!subId) return;

  // Schedule daily summary job (runs at 9am UTC every day)
  try {
    await context.scheduler.runJob({
      name: 'dailySummary',
      cron: '0 9 * * *',
    });
  } catch (e) {
    // Job may already be scheduled on upgrade — not an error
    console.log('[ModSync] Daily summary job already scheduled or skipped:', e);
  }

  console.log(`[ModSync] Installed in subreddit ${subId} — dashboard created on first use via menu.`);
}
