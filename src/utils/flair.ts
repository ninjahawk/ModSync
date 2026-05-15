import type { RedditAPIClient } from '@devvit/public-api';
import type { ClaimStatus } from '../types.js';

const FLAIR_TEXT: Record<ClaimStatus, string> = {
  claimed:      '👁️ Under Review',
  investigating: '🔍 Investigating',
};

// t3_ prefix = post, t1_ = comment
export function isPostId(itemId: string): boolean {
  return itemId.startsWith('t3_');
}

export async function setClaimFlair(
  reddit: RedditAPIClient,
  postId: string,
  subredditName: string,
  status: ClaimStatus
): Promise<{ originalText: string | null; originalCssClass: string | null }> {
  try {
    const post = await reddit.getPostById(postId);
    const originalText = post.flair?.text ?? null;
    const originalCssClass = post.flair?.cssClass ?? null;

    await reddit.setPostFlair({
      subredditName,
      postId,
      text: FLAIR_TEXT[status],
      cssClass: 'modsync',
    });

    return { originalText, originalCssClass };
  } catch (e) {
    console.error('[ModSync] Failed to set flair:', e);
    return { originalText: null, originalCssClass: null };
  }
}

export async function restoreFlair(
  reddit: RedditAPIClient,
  postId: string,
  subredditName: string,
  originalText: string | null,
  originalCssClass: string | null
): Promise<void> {
  try {
    await reddit.setPostFlair({
      subredditName,
      postId,
      text: originalText ?? '',
      cssClass: originalCssClass ?? '',
    });
  } catch (e) {
    console.error('[ModSync] Failed to restore flair:', e);
  }
}
