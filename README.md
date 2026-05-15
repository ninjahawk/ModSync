<p align="center">
  <img src="./snoo.png" alt="ModSync" width="120" />
</p>

<h1 align="center">ModSync</h1>

<p align="center">
  <strong>Real-time mod queue coordination for Reddit communities.</strong><br/>
  Stop working on the same post twice.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Devvit-ff4500?style=flat-square&logo=reddit&logoColor=white" alt="Platform" />
  <img src="https://img.shields.io/badge/version-0.0.2-blue?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/license-BSD--3--Clause-green?style=flat-square" alt="License" />
</p>

---

## The Problem

Research presented at **CHI 2026** surveyed 110 Reddit moderators across 400+ subreddits and found:

> **74.5% of moderators regularly experience collisions** — multiple mods acting on the same queue item simultaneously, wasting effort and creating conflicting decisions.

Mods work around this by refreshing the queue more often, working in reverse order, or coordinating after the fact in Discord. None of it actually solves the problem.

**ModSync does.**

---

## What It Does

ModSync adds a lightweight real-time coordination layer on top of the Reddit mod queue. When a mod claims a post or comment for review, their entire team sees it instantly — no more stepping on each other.

| | 👁️ Claim | 🔍 Investigate | ✓ Release |
|---|---|---|---|
| | Mark an item as under review. Post flair updates immediately: `[Claimed] u/ModName` | Hold a claim for 30 min while you dig into user history or consult teammates. | Drop the claim when done. Flair restores to its original state automatically. |

---

## Features

- **Atomic claim acquisition** — Redis `SET NX` ensures only one mod can claim an item at a time. No race conditions.
- **Live flair indicators** — Posts show `[Claimed] u/ModName` or `[Investigating] u/ModName` directly in the feed. Any mod scrolling the queue sees who has what at a glance.
- **Auto-release on action** — When a mod removes or approves an item, their claim releases automatically. No manual cleanup.
- **TTL-based expiry** — Claims expire after 5 minutes (configurable). Stale claims never block the queue.
- **Live dashboard** — A pinned custom post shows all active claims, recent activity, and which mods are online — updated in real time via Devvit's realtime channel API.
- **Collision warnings** — If a mod tries to claim something already taken, they see exactly who has it and how long ago they claimed it.
- **Daily digest** — Optional modmail summary of team activity sent every morning.

---

## How It Works

```
Mod A opens queue → clicks "Claim for Review"
  └─ Redis SET NX claim:subId:postId { mod, status, TTL: 5min }
  └─ Post flair → "[Claimed] u/ModA"
  └─ Realtime broadcast → all open dashboards update

Mod B opens same post → clicks "Claim for Review"
  └─ Redis SET NX returns null (already claimed)
  └─ Toast: "⚠️ u/ModA is already reviewing this (claimed 30s ago)"
  └─ Mod B moves on

Mod A removes post via normal Reddit UI
  └─ ModAction trigger fires
  └─ Claim auto-released
  └─ Post flair restored to original
  └─ Activity log updated
```

---

## Installation

Install directly from the [Reddit App Directory](https://developers.reddit.com/apps/modsync-queue).

Once installed, go to your subreddit → **⋯ menu** → **New ModSync Dashboard** to create and pin the live coordination board.

---

## Menu Items

All items are **mod-only** and appear in the `⋯` context menu on posts and comments.

| Action | Location | Description |
|---|---|---|
| **Claim for Review** | Post, Comment | Claim an item. Sets flair with your username. TTL: 5 min (configurable). |
| **Mark: Investigating** | Post, Comment | Upgrade to investigating hold. TTL: 30 min. |
| **Release Claim** | Post, Comment | Release your claim early and restore original flair. |
| **ModSync Dashboard** | Subreddit | Open the live coordination dashboard. |
| **New ModSync Dashboard** | Subreddit | Create and auto-pin a new dashboard post. |

---

## Settings

Configure per-subreddit in your app settings:

| Setting | Default | Description |
|---|---|---|
| Claim duration | 5 min | How long a "Claim for Review" holds before expiring |
| Investigating duration | 30 min | How long an "Investigating" hold lasts |
| Auto-release on action | On | Release claim automatically when mod takes action |
| Daily activity digest | Off | Send morning modmail summary to mod team |

---

## Built With

- [Devvit](https://developers.reddit.com) — Reddit's native developer platform
- Redis — Atomic claim state with TTL expiry
- Realtime channels — Live dashboard updates across all connected mods
- TypeScript

---

## Research

ModSync is directly informed by:

> *"Think about it like you're a firefighter": Understanding How Reddit Moderators Use the Modqueue*  
> CHI 2026, ACM Conference on Human Factors in Computing Systems

The paper surveyed 110 moderators across 400+ subreddits, identifying queue collisions as the most consistent and unresolved pain point in Reddit moderation workflows.

---

<p align="center">Built for the <a href="https://mod-tools-migration.devpost.com/">Reddit Mod Tools & Migrated Apps Hackathon 2026</a></p>
