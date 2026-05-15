import type { Context } from '@devvit/public-api';
import { Keys } from '../redis/keys.js';

export async function openDashboard(_event: unknown, context: Context): Promise<void> {
  const { redis, ui } = context;
  const subredditId = context.subredditId;
  if (!subredditId) return;

  const postId = await redis.get(Keys.dashboardId(subredditId));

  if (!postId) {
    ui.showToast({
      text: 'No dashboard found. Use "New ModSync Dashboard" to create one.',
      appearance: 'neutral',
    });
    return;
  }

  ui.navigateTo(`https://www.reddit.com/${postId}`);
}
