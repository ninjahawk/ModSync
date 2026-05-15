import type { RedditAPIClient } from '@devvit/public-api';
import type { ClaimStatus } from '../types.js';

export const CLAIM_FLAIR: Record<ClaimStatus, string> = {
  claimed:      '👁️ Under Review',
  investigating: '🔍 Investigating',
};

export function isPostId(itemId: string): boolean {
  return itemId.startsWith('t3_');
}

export async function setClaimFlair(
  reddit: RedditAPIClient,
  postId: string,
  subredditName: string,
  status: ClaimStatus
): Promise<{ originalText: string | null; originalCssClass: string | null }> {
  let originalText: string | null = null;
  let originalCssClass: string | null = null;

  try {
    const post = await reddit.getPostById(postId);
    originalText = post.flair?.text ?? null;
    originalCssClass = post.flair?.cssClass ?? null;
  } catch (e) {
    console.error('[ModSync] Failed to read existing flair:', e);
  }

  try {
    await reddit.setPostFlair({
      subredditName,
      postId,
      text: CLAIM_FLAIR[status],
    });
    console.log(`[ModSync] Set flair "${CLAIM_FLAIR[status]}" on ${postId}`);
  } catch (e) {
    console.error('[ModSync] Failed to set claim flair:', e);
  }

  return { originalText, originalCssClass };
}

export async function restoreFlair(
  reddit: RedditAPIClient,
  postId: string,
  subredditName: string,
  originalText: string | null,
  originalCssClass: string | null
): Promise<void> {
  try {
    if (!originalText && !originalCssClass) {
      await reddit.removePostFlair(subredditName, postId);
    } else {
      await reddit.setPostFlair({
        subredditName,
        postId,
        text: originalText ?? '',
        cssClass: originalCssClass ?? '',
      });
    }
    console.log(`[ModSync] Restored flair on ${postId}`);
  } catch (e) {
    console.error('[ModSync] Failed to restore flair:', e);
  }
}
