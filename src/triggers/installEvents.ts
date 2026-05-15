import type { TriggerContext } from '@devvit/public-api';
import { Keys } from '../redis/keys.js';

export async function handleInstall(_event: unknown, context: TriggerContext): Promise<void> {
  const subId = context.subredditId;
  if (!subId) return;

  // Enable post flair so claim indicators are visible in the feed
  try {
    const subreddit = await context.reddit.getCurrentSubreddit();
    await subreddit.updateSettings({
      postFlairs: { enabled: true, usersCanAssign: false },
    });
    console.log('[ModSync] Post flair enabled.');
  } catch (e) {
    console.error('[ModSync] Could not enable post flair (may need to do it manually in sub settings):', e);
  }

  // Schedule daily summary job (runs at 9am UTC every day)
  try {
    await context.scheduler.runJob({
      name: 'dailySummary',
      cron: '0 9 * * *',
    });
  } catch (e) {
    console.log('[ModSync] Daily summary job already scheduled or skipped:', e);
  }

  console.log(`[ModSync] Installed in subreddit ${subId} — dashboard created on first use via menu.`);
}
