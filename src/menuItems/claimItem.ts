import type { Context } from '@devvit/public-api';
import { tryClaimItem, touchActiveMod } from '../claims/claimManager.js';
import { logActivity } from '../claims/activityLog.js';
import { Keys } from '../redis/keys.js';
import { isPostId, setClaimFlair } from '../utils/flair.js';

type MenuItemEvent = { targetId: string };

export async function claimItem(event: MenuItemEvent, context: Context): Promise<void> {
  const { redis, realtime, reddit, subredditId } = context;
  if (!subredditId) return;

  const currentUser = await reddit.getCurrentUser();
  if (!currentUser) { context.ui.showToast('Could not identify your account.'); return; }

  const itemId = event.targetId;
  const postId = isPostId(itemId) ? itemId : null;

  let flairInfo = { isPost: false, originalText: null as string | null, originalCssClass: null as string | null };

  if (postId) {
    const subreddit = await reddit.getCurrentSubreddit();
    const flair = await setClaimFlair(reddit, postId, subreddit.name, 'claimed');
    flairInfo = { isPost: true, originalText: flair.originalText, originalCssClass: flair.originalCssClass };
  }

  const result = await tryClaimItem(
    redis, subredditId, itemId,
    { id: currentUser.id, username: currentUser.username },
    'claimed',
    flairInfo
  );

  if (!result.success) {
    // Restore flair we just set since claim failed
    if (postId && flairInfo.isPost) {
      const subreddit = await reddit.getCurrentSubreddit();
      const { restoreFlair } = await import('../utils/flair.js');
      await restoreFlair(reddit, postId, subreddit.name, flairInfo.originalText, flairInfo.originalCssClass);
    }
    const c = result.existingClaim;
    if (c) {
      const ageSec = Math.round((Date.now() - c.claimedAt) / 1000);
      const ageStr = ageSec < 60 ? `${ageSec}s ago` : `${Math.round(ageSec / 60)}m ago`;
      context.ui.showToast({ text: `⚠️ u/${c.modUsername} is already reviewing this (${c.status}, ${ageStr})`, appearance: 'neutral' });
    }
    return;
  }

  await touchActiveMod(redis, subredditId, { id: currentUser.id, username: currentUser.username });
  await realtime.send(Keys.channelName(subredditId), { type: 'CLAIM', itemId, modUsername: currentUser.username, status: 'claimed', claimedAt: Date.now(), action: null });
  await logActivity(redis, subredditId, { type: 'CLAIM', modUsername: currentUser.username, itemId, status: 'claimed', action: null });

  context.ui.showToast({ text: `✓ Claimed${postId ? ' — flair set on post' : ' — team can see you\'re on this'}`, appearance: 'success' });
}
