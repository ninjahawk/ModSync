import type { Context } from '@devvit/public-api';
type MenuItemEvent = { targetId: string };
import { tryClaimItem, upgradeClaim, touchActiveMod } from '../claims/claimManager.js';
import { logActivity } from '../claims/activityLog.js';
import { Keys } from '../redis/keys.js';

export async function investigateItem(event: MenuItemEvent, context: Context): Promise<void> {
  const { redis, realtime, reddit, subredditId } = context;
  if (!subredditId) return;

  const currentUser = await reddit.getCurrentUser();
  if (!currentUser) {
    context.ui.showToast('Could not identify your account.');
    return;
  }

  const itemId = event.targetId;
  const upgraded = await upgradeClaim(redis, subredditId, itemId, currentUser.id);

  if (!upgraded) {
    const result = await tryClaimItem(
      redis,
      subredditId,
      itemId,
      { id: currentUser.id, username: currentUser.username },
      'investigating'
    );

    if (!result.success) {
      const c = result.existingClaim;
      if (c) {
        const ageSec = Math.round((Date.now() - c.claimedAt) / 1000);
        const ageStr = ageSec < 60 ? `${ageSec}s ago` : `${Math.round(ageSec / 60)}m ago`;
        context.ui.showToast({
          text: `⚠️ u/${c.modUsername} is already on this (${c.status}, ${ageStr})`,
          appearance: 'neutral',
        });
      }
      return;
    }
  }

  await touchActiveMod(redis, subredditId, { id: currentUser.id, username: currentUser.username });

  await realtime.send(Keys.channelName(subredditId), {
    type: 'CLAIM',
    itemId,
    modUsername: currentUser.username,
    status: 'investigating',
    claimedAt: Date.now(),
    action: null,
  });

  await logActivity(redis, subredditId, {
    type: 'CLAIM',
    modUsername: currentUser.username,
    itemId,
    status: 'investigating',
    action: null,
  });

  context.ui.showToast({ text: `🔍 Investigating — claim held for 30 min`, appearance: 'success' });
}
