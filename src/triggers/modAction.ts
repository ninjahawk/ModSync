import type { TriggerContext } from '@devvit/public-api';
import { getClaim, releaseClaim } from '../claims/claimManager.js';
import { logActivity } from '../claims/activityLog.js';
import { Keys } from '../redis/keys.js';
import { restoreFlair } from '../utils/flair.js';

// Structural type matching what Devvit provides for ModAction events
type ModActionEvent = {
  subreddit?: { id?: string };
  targetPost?: { id?: string };
  targetComment?: { id?: string };
  moderator?: { id?: string; name?: string };
  action?: string;
};

export async function handleModAction(event: ModActionEvent, context: TriggerContext): Promise<void> {
  const subId = event.subreddit?.id;
  const targetId = event.targetPost?.id ?? event.targetComment?.id;
  const modId = event.moderator?.id;
  const modUsername = event.moderator?.name ?? 'unknown';
  const action = event.action ?? 'actioned';

  if (!subId || !targetId || !modId) return;

  const autoRelease = await context.settings.get<boolean>('enableAutoRelease');
  if (autoRelease === false) return;

  const claim = await getClaim(context.redis, subId, targetId);
  const released = await releaseClaim(context.redis, subId, targetId, modId);

  if (released) {
    // Restore original flair if this was a post
    if (claim?.isPost) {
      try {
        const subreddit = await context.reddit.getSubredditById(subId);
        if (subreddit) {
          await restoreFlair(context.reddit, targetId, subreddit.name, claim.originalFlairText, claim.originalFlairCssClass);
        }
      } catch (e) {
        console.error('[ModSync] Failed to restore flair on auto-release:', e);
      }
    }
    await context.realtime.send(Keys.channelName(subId), {
      type: 'ACTION',
      itemId: targetId,
      modUsername,
      status: null,
      claimedAt: null,
      action,
    });
    await logActivity(context.redis, subId, {
      type: 'ACTION',
      modUsername,
      itemId: targetId,
      action,
      status: null,
    });
  }
}
