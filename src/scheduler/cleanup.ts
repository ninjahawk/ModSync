import type { ScheduledJobEvent, TriggerContext } from '@devvit/public-api';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JobEvent = ScheduledJobEvent<Record<string, any>>;
import { getRecentActivity } from '../claims/activityLog.js';

export const dailySummaryJob = {
  name: 'dailySummary',
  onRun: async (_event: JobEvent, context: TriggerContext) => {
    const subId = context.subredditId;
    if (!subId) return;

    const enabled = await context.settings.get<boolean>('enableDailySummary');
    if (!enabled) return;

    const activity = await getRecentActivity(context.redis, subId, 50);
    if (activity.length === 0) return;

    const claims   = activity.filter((a) => a.type === 'CLAIM').length;
    const actions  = activity.filter((a) => a.type === 'ACTION').length;
    const reports  = activity.filter((a) => a.type === 'REPORT').length;
    const releases = activity.filter((a) => a.type === 'RELEASE').length;

    const modCounts: Record<string, number> = {};
    for (const entry of activity) {
      if (entry.modUsername) {
        modCounts[entry.modUsername] = (modCounts[entry.modUsername] ?? 0) + 1;
      }
    }
    const topMods = Object.entries(modCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => `u/${name}: ${count} actions`)
      .join('\n');

    const subreddit = await context.reddit.getCurrentSubreddit();
    await context.reddit.sendPrivateMessage({
      to: subreddit.name,
      subject: 'ModSync Daily Summary',
      text: [
        '**ModSync — Daily Activity Summary**',
        '',
        `Claims: ${claims} | Actions: ${actions} | Reports: ${reports} | Releases: ${releases}`,
        '',
        '**Most Active Mods (last 50 events)**',
        topMods || 'No activity recorded.',
        '',
        '_Sent by ModSync — disable in app settings._',
      ].join('\n'),
    });
  },
};
