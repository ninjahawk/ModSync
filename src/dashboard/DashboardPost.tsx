import { Devvit, useState, useChannel } from '@devvit/public-api';
import type { CustomPostType } from '@devvit/public-api';
import { getActiveMods } from '../claims/claimManager.js';
import { getRecentActivity } from '../claims/activityLog.js';
import { Keys } from '../redis/keys.js';
import type { ActivityEntry, ActiveMod, SyncMessage, ClaimData } from '../types.js';

function timeAgo(ts: number): string {
  const sec = Math.round((Date.now() - ts) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.round(sec / 60)}m ago`;
  return `${Math.round(sec / 3600)}h ago`;
}

function actionLabel(entry: ActivityEntry): string {
  switch (entry.type) {
    case 'CLAIM':
      return entry.status === 'investigating' ? '🔍 started investigating' : '👁️ claimed for review';
    case 'RELEASE':
      return '✓ released claim';
    case 'ACTION':
      return `⚡ ${entry.action ?? 'actioned'}`;
    case 'REPORT':
      return `🚩 ${entry.action ?? 'reported'}`;
    default:
      return entry.type;
  }
}

export const DashboardPost: CustomPostType = {
  name: 'ModSync Dashboard',
  description: 'Live mod queue coordination board',
  height: 'tall',
  render: (context) => {
    const { redis, subredditId } = context;
    if (!subredditId) {
      return (
        <vstack padding="medium" alignment="center middle">
          <text color="red">Error: subreddit context missing.</text>
        </vstack>
      );
    }

    const [activeMods, setActiveMods] = useState<ActiveMod[]>(async () =>
      getActiveMods(redis, subredditId)
    );

    const [activity, setActivity] = useState<ActivityEntry[]>(async () =>
      getRecentActivity(redis, subredditId, 20)
    );

    const [claims, setClaims] = useState<ClaimData[]>(async () => []);

    const channel = useChannel<SyncMessage>({
      name: Keys.channelName(subredditId),
      onMessage: (msg) => {
        if (msg.type === 'CLAIM') {
          setClaims((prev) => [
            ...prev.filter((c) => c.itemId !== msg.itemId),
            {
              itemId: msg.itemId,
              modId: '',
              modUsername: msg.modUsername,
              status: msg.status ?? 'claimed',
              claimedAt: msg.claimedAt ?? Date.now(),
            },
          ]);
          setActivity((prev) => [
            {
              type: 'CLAIM',
              modUsername: msg.modUsername,
              itemId: msg.itemId,
              status: msg.status,
              action: null,
              timestamp: Date.now(),
            },
            ...prev.slice(0, 19),
          ]);
        }

        if (msg.type === 'RELEASE') {
          setClaims((prev) => prev.filter((c) => c.itemId !== msg.itemId));
          setActivity((prev) => [
            { type: 'RELEASE', modUsername: msg.modUsername, itemId: msg.itemId, status: null, action: null, timestamp: Date.now() },
            ...prev.slice(0, 19),
          ]);
        }

        if (msg.type === 'ACTION') {
          setClaims((prev) => prev.filter((c) => c.itemId !== msg.itemId));
          setActivity((prev) => [
            { type: 'ACTION', modUsername: msg.modUsername, itemId: msg.itemId, action: msg.action, status: null, timestamp: Date.now() },
            ...prev.slice(0, 19),
          ]);
        }
      },
    });
    channel.subscribe();

    return (
      <vstack padding="medium" gap="small" backgroundColor="#f6f7f8">
        {/* Header */}
        <hstack alignment="middle" gap="small">
          <text size="xlarge" weight="bold" color="#ff4500">ModSync</text>
          <text size="small" color="#878a8c">Live queue coordination</text>
          <spacer grow />
          <text size="small" color="#878a8c">
            {activeMods.length} mod{activeMods.length !== 1 ? 's' : ''} active
          </text>
        </hstack>

        <hstack gap="medium" grow>
          {/* Left: Active Claims */}
          <vstack
            grow
            border="thin"
            borderColor="#edeff1"
            cornerRadius="medium"
            backgroundColor="white"
            padding="small"
            gap="small"
          >
            <text weight="bold" size="medium">
              {`Active Claims${claims.length > 0 ? ` (${claims.length})` : ''}`}
            </text>

            {claims.length === 0 ? (
              <vstack alignment="center middle" grow padding="medium">
                <text color="#878a8c" size="small">No active claims</text>
                <text color="#878a8c" size="small">Right-click any post → Claim for Review</text>
              </vstack>
            ) : (
              claims.map((c) => (
                <hstack
                  key={c.itemId}
                  gap="small"
                  alignment="middle"
                  padding="small"
                  backgroundColor={c.status === 'investigating' ? '#fff3e0' : '#e8f5e9'}
                  cornerRadius="small"
                >
                  <text>{c.status === 'investigating' ? '🔍' : '👁️'}</text>
                  <vstack gap="none">
                    <text weight="bold" size="small">{`u/${c.modUsername}`}</text>
                    <text size="small" color="#878a8c">
                      {`${c.status} · ${timeAgo(c.claimedAt)}`}
                    </text>
                  </vstack>
                </hstack>
              ))
            )}
          </vstack>

          {/* Right: Activity Feed */}
          <vstack
            grow
            border="thin"
            borderColor="#edeff1"
            cornerRadius="medium"
            backgroundColor="white"
            padding="small"
            gap="small"
          >
            <text weight="bold" size="medium">Activity Feed</text>

            {activity.length === 0 ? (
              <vstack alignment="center middle" grow padding="medium">
                <text color="#878a8c" size="small">No activity yet</text>
              </vstack>
            ) : (
              activity.slice(0, 12).map((entry, i) => (
                <hstack key={`${entry.timestamp}-${i}`} gap="small" alignment="middle">
                  <vstack gap="none" grow>
                    <hstack gap="small">
                      {entry.modUsername ? (
                        <text weight="bold" size="small">{`u/${entry.modUsername}`}</text>
                      ) : null}
                      <text size="small" color="#555">{actionLabel(entry)}</text>
                    </hstack>
                    <text size="small" color="#878a8c">{timeAgo(entry.timestamp)}</text>
                  </vstack>
                </hstack>
              ))
            )}
          </vstack>
        </hstack>

        {/* Active mods footer */}
        {activeMods.length > 0 && (
          <hstack gap="small" alignment="middle">
            <text size="small" color="#878a8c">Online:</text>
            {activeMods.slice(0, 8).map((m) => (
              <text key={m.modId} size="small" color="#0079d3">
                {`u/${m.username}`}
              </text>
            ))}
            {activeMods.length > 8 && (
              <text size="small" color="#878a8c">{`+${activeMods.length - 8} more`}</text>
            )}
          </hstack>
        )}
      </vstack>
    );
  },
};
