import type { TriggerContext } from '@devvit/public-api';
import { logActivity } from '../claims/activityLog.js';

type CommentReportEvent = {
  subreddit?: { id?: string };
  comment?: { id?: string };
  reportReasons?: string[];
};

export async function handleCommentReport(event: CommentReportEvent, context: TriggerContext): Promise<void> {
  const subId = event.subreddit?.id;
  const itemId = event.comment?.id;
  if (!subId || !itemId) return;

  await logActivity(context.redis, subId, {
    type: 'REPORT',
    modUsername: '',
    itemId,
    action: 'comment reported',
    status: null,
  });
}
