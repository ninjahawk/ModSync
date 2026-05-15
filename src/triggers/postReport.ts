import type { TriggerContext } from '@devvit/public-api';
import { logActivity } from '../claims/activityLog.js';

type PostReportEvent = {
  subreddit?: { id?: string };
  post?: { id?: string };
  reportReasons?: string[];
};

export async function handlePostReport(event: PostReportEvent, context: TriggerContext): Promise<void> {
  const subId = event.subreddit?.id;
  const itemId = event.post?.id;
  if (!subId || !itemId) return;

  await logActivity(context.redis, subId, {
    type: 'REPORT',
    modUsername: '',
    itemId,
    action: 'post reported',
    status: null,
  });
}
