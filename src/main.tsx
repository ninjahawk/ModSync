import { Devvit } from '@devvit/public-api';

import { getAllSettings }       from './settings.js';
import { handleModAction }      from './triggers/modAction.js';
import { handlePostReport }     from './triggers/postReport.js';
import { handleCommentReport }  from './triggers/commentReport.js';
import { handleInstall }        from './triggers/installEvents.js';
import { claimItem }            from './menuItems/claimItem.js';
import { investigateItem }      from './menuItems/investigateItem.js';
import { releaseItem }          from './menuItems/releaseItem.js';
import { openDashboard }        from './menuItems/openDashboard.js';
import { createDashboard }      from './menuItems/createDashboard.js';
import { DashboardPost }        from './dashboard/DashboardPost.js';
import { dailySummaryJob }      from './scheduler/cleanup.js';

// ─── Platform capabilities ────────────────────────────────────────────────────
Devvit.configure({ redditAPI: true, redis: true, realtime: true });

// ─── App settings ─────────────────────────────────────────────────────────────
Devvit.addSettings(getAllSettings());

// ─── Triggers ─────────────────────────────────────────────────────────────────
Devvit.addTrigger({ event: 'ModAction',     onEvent: handleModAction });
Devvit.addTrigger({ event: 'PostReport',    onEvent: handlePostReport });
Devvit.addTrigger({ event: 'CommentReport', onEvent: handleCommentReport });
Devvit.addTrigger({ events: ['AppInstall', 'AppUpgrade'], onEvent: handleInstall });

// ─── Mod-only menu items (post & comment) ─────────────────────────────────────
Devvit.addMenuItem({
  label: 'Claim for Review',
  location: ['post', 'comment'],
  forUserType: 'moderator',
  onPress: claimItem,
});

Devvit.addMenuItem({
  label: 'Mark: Investigating',
  location: ['post', 'comment'],
  forUserType: 'moderator',
  onPress: investigateItem,
});

Devvit.addMenuItem({
  label: 'Release Claim',
  location: ['post', 'comment'],
  forUserType: 'moderator',
  onPress: releaseItem,
});

// ─── Subreddit-level menu items ───────────────────────────────────────────────
Devvit.addMenuItem({
  label: 'ModSync Dashboard',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: openDashboard,
});

Devvit.addMenuItem({
  label: 'New ModSync Dashboard',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: createDashboard,
});

// ─── Dashboard custom post ───────────────────────────────────────────────────
Devvit.addCustomPostType(DashboardPost);

// ─── Scheduler ───────────────────────────────────────────────────────────────
Devvit.addSchedulerJob(dailySummaryJob);

export default Devvit;
