# ModSync — Claude Context

## What This Is
A Devvit app built for the Reddit Mod Tools & Migrated Apps Hackathon (deadline May 27, 2026). Solves mod queue collisions — 74.5% of mods experience two people actioning the same item simultaneously (CHI 2026 paper). ModSync lets mods claim queue items so teammates see who's reviewing what in real time.

**Repo:** https://github.com/ninjahawk/ModSync  
**App slug:** `modsync-queue` (display name: ModSync — "modsync" was taken at registration)  
**Devvit app directory:** https://developers.reddit.com/apps/modsync-queue  
**Hackathon:** https://mod-tools-migration.devpost.com/

## Stack
- TypeScript, Devvit (`@devvit/public-api` 0.12.23)
- Redis for claim state (SET NX for atomic acquisition, TTL for expiry)
- Devvit realtime channels for live dashboard sync
- Custom post type for the dashboard

## Project Structure
```
src/
  main.tsx                  # Entry point — configure, triggers, menu items, scheduler
  types.ts                  # Shared types (must satisfy JSONValue for useState)
  redis/keys.ts             # All Redis key names in one place
  claims/
    claimManager.ts         # tryClaimItem, releaseClaim, getClaim, getActiveMods
    activityLog.ts          # Sorted set activity log (zAdd/zRange)
  triggers/
    modAction.ts            # Auto-release on mod action + flair restore
    postReport.ts           # Log reports to activity feed
    commentReport.ts        # Log comment reports
    installEvents.ts        # AppInstall/AppUpgrade — enable flair, schedule cron
  menuItems/
    claimItem.ts            # "Claim for Review"
    investigateItem.ts      # "Mark: Investigating"
    releaseItem.ts          # "Release Claim" — restores original flair
    openDashboard.ts        # "ModSync Dashboard" — navigate to pinned post
    createDashboard.tsx     # "New ModSync Dashboard" — create + auto-pin post
  dashboard/
    DashboardPost.tsx       # Custom post — live claims, activity feed, active mods
  scheduler/
    cleanup.ts              # Daily modmail activity digest
  utils/
    flair.ts                # setClaimFlair, restoreFlair, claimFlairText, isPostId
  settings.ts               # Per-subreddit settings (TTLs, auto-release, digest)
```

## Key Behaviors
- Claims use Redis `SET NX` with TTL — atomic, first-writer-wins, self-expiring
- Flair: `[Claimed] u/ModName` / `[Investigating] u/ModName` — original flair saved in ClaimData and restored on release
- Flair restore falls back to `isPostId(itemId)` check for claims made before `isPost` field was added
- `ModAction` trigger auto-releases claims when mod actions an item (respects `enableAutoRelease` setting)
- Dashboard auto-pins to position 1 on creation
- Install trigger enables post flair in subreddit settings automatically
- Cron job registration guarded by Redis key to prevent duplicate scheduling

## Devvit Quirks Learned
- `Devvit.configure()` must include `realtime: true` or `context.realtime.send()` throws at runtime
- `useState<T>` requires T to satisfy `JSONValue` — interfaces need `[key: string]: JSONValue` index signature
- Trigger event types (e.g. `PostReport`, `AppInstall`) export as string literals from public-api, not as event data interfaces — use structural types in handlers instead
- `MenuItemRequest` is not exported from `@devvit/public-api` — use `{ targetId: string }` structural type
- `ScheduledJobEvent` requires a generic type argument
- `gap="xsmall"` is not a valid ContainerGap — use `"small"` minimum
- `setPostFlair` silently fails if you pass a `cssClass` that doesn't exist as a flair template in the sub — text-only works everywhere

## Testing
- Playtest: `devvit playtest r/PokemonOopsie` (small sub, sole mod)
- Login: `devvit login` (interactive, needs a real terminal — not the `!` prefix)
- Port 65010 conflict: `Stop-Process -Id $(netstat -ano | Select-String ":65010" | ...)` 

## Current Status (May 15, 2026)
- App submitted for review (required for custom post type apps before wide install)
- Pending approval email from Reddit before can install on large subs
- Tested and working on r/PokemonOopsie playtest
- Devpost submission copy in `DEVPOST.md`
- Demo video not yet recorded

## Rules
- No co-author attribution in commits or anywhere in the project
