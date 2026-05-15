import type { Context } from '@devvit/public-api';
type MenuItemEvent = { targetId: string };
import { getClaim, releaseClaim, touchActiveMod } from '../claims/claimManager.js';
import { logActivity } from '../claims/activityLog.js';
import { Keys } from '../redis/keys.js';

export async function releaseItem(event: MenuItemEvent, context: Context): Promise<void> {
  const { redis, realtime, reddit, subredditId } = context;
  if (!subredditId) return;

  const currentUser = await reddit.getCurrentUser();
  if (!currentUser) {
    context.ui.showToast('Could not identify your account.');
    return;
  }

  const itemId = event.targetId;
  const existing = await getClaim(redis, subredditId, itemId);

  if (!existing) {
    context.ui.showToast({ text: 'No active claim on this item.', appearance: 'neutral' });
    return;
  }

  if (existing.modId !== currentUser.id) {
    context.ui.showToast({
      text: `This item is claimed by u/${existing.modUsername} — only they can release it.`,
      appearance: 'neutral',
    });
    return;
  }

  await releaseClaim(redis, subredditId, itemId, currentUser.id);
  await touchActiveMod(redis, subredditId, { id: currentUser.id, username: currentUser.username });

  await realtime.send(Keys.channelName(subredditId), {
    type: 'RELEASE',
    itemId,
    modUsername: currentUser.username,
    status: null,
    claimedAt: null,
    action: null,
  });

  await logActivity(redis, subredditId, {
    type: 'RELEASE',
    modUsername: currentUser.username,
    itemId,
    action: null,
    status: null,
  });

  context.ui.showToast({ text: '✓ Claim released', appearance: 'success' });
}
