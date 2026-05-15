import { Devvit } from '@devvit/public-api';
import type { Context } from '@devvit/public-api';
import { Keys } from '../redis/keys.js';

export async function createDashboard(_event: unknown, context: Context): Promise<void> {
  const { redis, reddit, ui } = context;
  const subredditId = context.subredditId;
  if (!subredditId) return;

  const existing = await redis.get(Keys.dashboardId(subredditId));
  if (existing) {
    ui.showToast({ text: 'Dashboard already exists — use "ModSync Dashboard" to open it.', appearance: 'neutral' });
    return;
  }

  try {
    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({
      subredditName: subreddit.name,
      title: 'ModSync Dashboard — Live Mod Queue Coordination',
      preview: (
        <vstack padding="medium" gap="small" alignment="center middle">
          <text size="xlarge" weight="bold" color="#ff4500">ModSync</text>
          <text>Loading dashboard...</text>
        </vstack>
      ),
    });
    await redis.set(Keys.dashboardId(subredditId), post.id);
    await post.sticky(1);
    ui.showToast({ text: '✓ Dashboard created and pinned to top of sub.', appearance: 'success' });
  } catch (e) {
    console.error('[ModSync] Failed to create dashboard post:', e);
    ui.showToast({ text: 'Failed to create dashboard. Check app permissions.', appearance: 'neutral' });
  }
}
