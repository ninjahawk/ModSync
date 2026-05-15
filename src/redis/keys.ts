export const Keys = {
  claim:       (subId: string, itemId: string) => `claim:${subId}:${itemId}`,
  activeMods:  (subId: string)                 => `activemods:${subId}`,
  activityLog: (subId: string)                 => `activitylog:${subId}`,
  dashboardId: (subId: string)                 => `dashboard:${subId}:postId`,
  channelName: (subId: string)                 => `modsync:${subId}`,
};

export const TTL = {
  claimed:      300,    // 5 minutes
  investigating: 1800,  // 30 minutes
  activeMod:    1800,   // 30 minutes
};
