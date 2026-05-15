# Devpost Submission — ModSync

---

## Tagline
Real-time mod queue coordination that eliminates duplicate work across mod teams.

---

## Inspiration

A peer-reviewed paper published at the **2026 ACM CHI Conference on Human Factors in Computing Systems** surveyed 110 Reddit moderators across 400+ subreddits on how they use the modqueue. The headline finding:

> **74.5% of moderators regularly experience collisions** — multiple mods simultaneously acting on the same queue item, creating wasted effort and conflicting decisions.

Mods described working around this by refreshing more often, starting from the middle of the queue, or coordinating after the fact over Discord. Reddit's built-in activity indicators exist but were described as *"so subtle and unreliable that mods ignore them."*

No existing Devvit app addressed this. ModSync was built specifically to solve it.

---

## What It Does

ModSync adds a real-time coordination layer on top of the Reddit mod queue. Any mod on a team can **claim** a post or comment they're reviewing — their teammates instantly see who has it, preventing duplicate work before it happens.

**Claim for Review** — A mod right-clicks any post or comment and claims it. The post's flair immediately updates to `[Claimed] u/ModName` so every other mod scrolling the queue sees it's taken at a glance. The claim is held for 5 minutes (configurable) and auto-expires so nothing gets stuck.

**Mark: Investigating** — When a mod needs to leave the queue to dig into a user's history or check external sources, they upgrade their claim to "Investigating." This holds for 30 minutes and updates the flair to `[Investigating] u/ModName`.

**Release Claim** — When done, the mod releases the claim. The original flair is restored exactly as it was — including any user-set flair — and the slot opens up for the team.

**Auto-Release on Action** — When a mod removes or approves an item through the normal Reddit UI, the ModAction trigger fires and releases their claim automatically. Zero extra steps.

**Collision Warnings** — If a mod tries to claim something already taken, they get an immediate toast: *"⚠️ u/ModName is already reviewing this (claimed 2m ago)"* — they know exactly who has it and how long, so they can decide whether to wait or move on.

**Live Dashboard** — A pinned custom post at the top of the subreddit shows all active claims, recent mod activity, and which mods are currently online — updated in real time via Devvit's realtime channel API. Every mod who opens the sub sees the coordination board before anything else.

**Daily Digest** — Optional daily modmail summary of team activity sent each morning.

---

## How We Built It

**Claim atomicity** — Claims use Redis `SET NX` (set-if-not-exists) with a TTL. This is atomic: only one mod can acquire a claim, and it self-destructs after the configured timeout. No cleanup jobs needed, no stuck claims.

**Real-time sync** — Every claim, release, and action broadcasts a message on a per-subreddit Devvit realtime channel. The dashboard's `useChannel` hook receives these and updates the UI instantly for all connected mods.

**Flair as a passive indicator** — Rather than requiring mods to open a separate tool, the claim status is embedded directly into the post card via flair. Any mod scrolling the queue sees `[Claimed] u/ModName` without clicking anything. The original flair is stored in Redis alongside the claim and fully restored on release.

**ModAction trigger** — When a mod takes action (remove, approve, ban) through Reddit's native UI, Devvit fires a `ModAction` event. ModSync intercepts this to auto-release any active claim on that item, keeping the system self-consistent without requiring mods to manually release after actioning.

**Tech stack:** TypeScript, Devvit (`@devvit/public-api`), Redis (sorted sets, hashes, string keys with TTL), Devvit realtime channels, Devvit custom post type (dashboard), Devvit scheduler (daily digest).

---

## Challenges

**JSONValue constraint** — Devvit's `useState` hook requires all state to satisfy the `JSONValue` type. Custom interfaces needed index signatures (`[key: string]: JSONValue`) to work with the type system, which required careful structuring of shared types.

**Trigger event types** — Devvit exports trigger names (e.g. `PostReport`) as string literal types, not as the event data interfaces. Trigger handlers had to use structural typing rather than imported event types.

**Flair atomicity** — Post flair needed to be saved before being overwritten and restored on release, including for claims that were made before the flair fields were added to the schema. A fallback to the item ID prefix (`t3_`) handles backward compatibility.

---

## Accomplishments

- First Devvit app to solve the mod queue collision problem that 74.5% of moderators experience
- Full real-time sync across all connected mods with zero polling
- Zero extra steps for mods who just action items normally — auto-release handles cleanup
- Configurable per-subreddit with sensible defaults that work out of the box

---

## What We Learned

The modqueue is not a one-size-fits-all tool. Mods have wildly different workflows — some treat it as a checklist, others as a pattern-recognition system. ModSync had to work across all of those without forcing any particular style. The solution: stay out of the way until coordination is actually needed, then surface information passively (via flair) so mods who don't need the full dashboard still benefit.

---

## What's Next

- **Cross-sub coordination** — For mods who run multiple communities, a unified view of claims across all their subs
- **Queue assignment** — Let lead mods assign specific items to specific team members
- **Shift scheduling** — Mods mark themselves on/off duty so the team knows real-time coverage
- **Escalation flags** — Tag items that need a second opinion before actioning

---

## Community Impact

ModSync was tested on active subreddits with a combined readership in the millions. The target audience is any subreddit with a mod team larger than one person — which covers the vast majority of large communities on Reddit.

The collision problem is worst on large subreddits with multiple active mods. ModSync provides the most value exactly where it's needed most: high-volume communities where queue throughput and consistency matter.

Mods install it once, it runs in the background, and the only time they notice it is when it saves them from duplicating someone else's work.

---

## Built With

`devvit` `typescript` `redis` `realtime-channels` `reddit-api`

---

## Try It

**App Directory:** [developers.reddit.com/apps/modsync-queue](https://developers.reddit.com/apps/modsync-queue)
**GitHub:** [github.com/ninjahawk/ModSync](https://github.com/ninjahawk/ModSync)
