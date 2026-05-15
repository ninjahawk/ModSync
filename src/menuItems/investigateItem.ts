import type { Context } from '@devvit/public-api';
import { tryClaimItem, upgradeClaim, getClaim, touchActiveMod } from '../claims/claimManager.js';
import { logActivity } from '../claims/activityLog.js';
import { Keys } from '../redis/keys.js';
import { isPostId, setClaimFlair } from '../utils/flair.js';

type MenuItemEvent = { targetId: string };

export async function investigateItem(event: MenuItemEvent, context: Context): Promise<void> {
  const { redis, realtime, reddit, subredditId } = context;
  if (!subredditId) return;

  const currentUser = await reddit.getCurrentUser();
  if (!currentUser) { context.ui.showToast('Could not identify your account.'); return; }

  const itemId = event.targetId;
  const postId = isPostId(itemId) ? itemId : null;

  // Try upgrading an existing claim first
  const upgraded = await upgradeClaim(redis, subredditId, itemId, currentUser.id);

  if (upgraded) {
    // Update flair to investigating
    if (postId) {
      const existing = await getClaim(redis, subredditId, itemId);
      const subreddit = await reddit.getCurrentSubreddit();
      await setClaimFlair(reddit, postId, subreddit.name, 'investigating');
      // original flair already stored in claim from when it was first claimed
      void existing;
    }
  } else {
    // No existing claim — create one as investigating
    let flairInfo = { isPost: false, originalText: null as string | null, originalCssClass: null as string | null };
    if (postId) {
      const subreddit = await reddit.getCurrentSubreddit();
      const flair = await setClaimFlair(reddit, postId, subreddit.name, 'investigating');
      flairInfo = { isPost: true, originalText: flair.originalText, originalCssClass: flair.originalCssClass };
    }

    const result = await tryClaimItem(
      redis, subredditId, itemId,
      { id: currentUser.id, username: currentUser.username },
      'investigating',
      flairInfo
    );

    if (!result.success) {
      const c = result.existingClaim;
      if (c) {
        const ageSec = Math.round((Date.now() - c.claimedAt) / 1000);
        const ageStr = ageSec < 60 ? `${ageSec}s ago` : `${Math.round(ageSec / 60)}m ago`;
        context.ui.showToast({ text: `⚠️ u/${c.modUsername} is already on this (${c.status}, ${ageStr})`, appearance: 'neutral' });
      }
      return;
    }
  }

  await touchActiveMod(redis, subredditId, { id: currentUser.id, username: currentUser.username });
  await realtime.send(Keys.channelName(subredditId), { type: 'CLAIM', itemId, modUsername: currentUser.username, status: 'investigating', claimedAt: Date.now(), action: null });
  await logActivity(redis, subredditId, { type: 'CLAIM', modUsername: currentUser.username, itemId, status: 'investigating', action: null });

  context.ui.showToast({ text: `🔍 Investigating — claim held for 30 min`, appearance: 'success' });
}
