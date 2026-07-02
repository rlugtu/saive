# Saive — Design Doc

> Bookmarks organized into shareable lists, with tags, filtering, and collaboration.
> Retro 8-bit aesthetic. This document is the single source of truth for the design;
> update it whenever a decision changes.

**Status:** ✅ All 8 steps complete. MVP feature-complete.
**Last updated:** 2026-07-02

---

## 1. Stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS with a custom 8-bit token set |
| Animation | Framer Motion (drag-reorder, page/pill transitions) |
| Auth | better-auth — Google OAuth **and** email/password |
| Database | Supabase (Postgres) |
| ORM | Prisma |

**Aesthetic:** retro 8-bit — pixel font (e.g. "Press Start 2P"), chunky borders, hard
drop shadows, limited palette. Two palette variants (`LIGHT` / `DARK`) live *within* the
8-bit theme and are stored per-user.

---

## 2. Decisions log

Resolved during planning (most-recent context in parentheses):

- **Tags** are **user-scoped** (shared across all of a user's lists) and filter with **OR**
  matching (a bookmark matches if it has *any* selected tag).
- **Auth**: Google OAuth **+** email/password. Passwords hashed by better-auth (never store
  raw). `birthday` is optional, collected at onboarding.
- **Comments** attach to **both lists and bookmarks** (`Comment` has nullable `listId` and
  `bookmarkId`; exactly one is set).
- **Icons**: emoji picker for lists and bookmarks.
- **Search result → list click**: navigates to that List page. Tags become filter pills.
- **List ordering**: **per-user** (stored on the membership), each member arranges their own
  home page independently.
- **Sharing admin**: **owner-only** — only the owner invites, changes roles, removes members,
  and deletes the list. Collaborators have full bookmark/list-metadata edit + comment. Viewers
  view + comment only.
- **Bookmark URLs**: **multiple** (`urls: string[]`); the first is the primary "open" target.

### Defaults (low-stakes; change freely)
- **Rating**: 0–5 stars (pixel-art stars).
- **Search bar**: one unified control on the home page handles both list-name and tag search
  (no separate list-name filter box).
- **`location`**: freeform text (e.g. "Tokyo, Japan"); no map/geocoding in v1.
- **Realtime**: out of scope for v1 — comments/edits refresh on action. Supabase realtime can
  come later.

---

## 3. Data model (Prisma)

better-auth manages its own `user` / `session` / `account` / `verification` tables. Our app
fields extend the user record; app entities below.

```
User            id, email, firstName, lastName, displayName,
                birthday?, icon (emoji), theme (LIGHT|DARK), createdAt

List            id, name, description, icon, ownerId, createdAt

ListMembership  id, listId, userId, role (OWNER|COLLABORATOR|VIEWER),
                position (int — per-user ordering), createdAt

ListInvite      id, listId, email, role, token, status (PENDING|ACCEPTED),
                invitedById, createdAt
                — auto-links to a user when that email signs up

Bookmark        id, listId, name, description, urls (string[]),
                images (string[]), notes, location, rating (0–5),
                visited (bool), createdAt, updatedAt
                -- no icon (removed); urls[0] = original source link;
                -- images = extracted photo URLs (2026-07-02)

Tag             id, name, userId          — unique per (userId, name)
BookmarkTag     bookmarkId, tagId         — join table

Comment         id, authorId, value, createdAt,
                bookmarkId?, listId?      — exactly one of the two set
```

**Relationships & rules**
- A user sees a list on their home page if they own it **or** have a `ListMembership`.
- Tags are user-scoped and shared across all of a user's lists (OR-matching in filters).
- Deleting a list cascades its bookmarks, comments, memberships, invites.
- Deleting a bookmark cascades its `BookmarkTag` links and comments.

---

## 4. Permissions

| Action | Owner | Collaborator | Viewer |
|---|:---:|:---:|:---:|
| View list & bookmarks | ✓ | ✓ | ✓ |
| Comment (list & bookmark) | ✓ | ✓ | ✓ |
| Create/edit/delete bookmarks | ✓ | ✓ | — |
| Edit list metadata (name/icon/desc) | ✓ | ✓ | — |
| Invite / change roles / remove members | ✓ | — | — |
| Delete list | ✓ | — | — |
| Delete a comment | own + any on their list | own only | own only |
| Reorder lists on **own** home page | ✓ | ✓ | ✓ |

Enforced **server-side on every mutation** via a shared `assertRole(listId, userId, minRole)`
helper — never rely on UI gating alone.

**Convention:** every participant — including the owner — has a `ListMembership` row
(the owner's has role `OWNER`). This makes access checks and per-user ordering uniform;
`List.ownerId` remains the canonical owner pointer.

---

## 5. Pages / routes

| Route | Purpose |
|---|---|
| `/login` | Google + email/password (better-auth) |
| `/onboarding` | First login only: displayName, birthday (optional), icon, theme |
| `/` | **Home**: all lists you own or belong to; reorderable (Framer Motion drag) + unified search bar |
| `/lists/[id]` | Bookmarks in a list; filter/search within; list-level comments; invite UI (owner) |
| `/lists/[id]/bookmarks/[bid]` | Bookmark detail: 8-bit layout, tag pills, comments newest-first |
| `/settings` | Edit profile/theme/icon; manage/leave shared lists; pending invites |
| `/invite/[token]` | Accept an invite |

**Home search bar behavior** (unified control):
- Typing shows two sections — **Lists** (by name) then **Matched tags**.
- Clicking a **list** navigates to it; clicking a **tag** adds a pill below the bar.
- Selected tags render as pills with an ✕ to remove; a **Clear all** button empties the input
  and deselects every tag.
- Multiple tags = OR filter across all of the user's bookmarks.

---

## 6. Build plan

Pause for review after **each** step.

- [x] **1. Scaffold** — Next.js 16 + Tailwind v4 + Prisma 7 (pg driver adapter) + full domain
      schema; 8-bit design tokens + base components (PixelButton/Card/Input/Badge, ThemeToggle).
      DB/OAuth secrets pending in `.env`; better-auth tables + wiring deferred to Step 2.
- [x] **2. Auth** — better-auth wired (email/password verified end-to-end; Google wired,
      needs a real browser sign-in to confirm). Migrations applied to Supabase (init +
      comment check constraint). Route guards, onboarding, and settings live. Theme applied
      from `user.theme` in the root layout.
- [x] **3. Lists** — CRUD + home page + per-user drag-reorder (Framer Motion `Reorder`,
      debounced persistence) + client-side name filter. Owner-also-a-member convention;
      role-gated edit (COLLABORATOR+) / delete (OWNER) via `assertRole`. Render paths verified
      against Supabase; write actions covered by tsc/build.
- [x] **4. Bookmarks** — CRUD + user-scoped tags (pill `TagInput` with suggestions,
      upsert+prune sync scoped to the acting user) + interactive rating picker + visited
      toggle. List page lists bookmark cards; detail page is the "sleek 8-bit" view (hero,
      tag pills, URLs, notes). Render paths verified against Supabase.
- [x] **5. Search** — unified home `SearchBar` combobox (Lists section navigates, Matched
      tags section adds pills). Selected tags live in the URL (`?tags=`), server-rendered OR
      filter across all the user's lists. Tag pills with × + Clear all. Removed the step-3
      in-grid list filter per §4. Cross-list OR filtering verified against Supabase.
- [x] **6. Sharing** — invite by email (owner-only); existing users added instantly, unknown
      emails become pending invites that auto-link on signup (better-auth `databaseHooks`).
      `/invite/[token]` accept flow (with `?next=` login round-trip). Owner `MembersPanel`:
      invite form, role change, remove member, revoke invite; non-owners get Leave list.
      Auto-link + role + owner-only gating verified live against Supabase.
- [x] **7. Comments** — on lists and bookmarks, newest-first. Any member (viewer+) can post;
      author or list owner can delete (DB check constraint enforces exactly one target).
      React 19 auto-resets the post box. Rendering, ordering, and delete gating verified live.
- [x] **8. Polish** — page-transition `template.tsx` (with `MotionConfig reducedMotion="user"`),
      animated tag pills (AnimatePresence) in search + tag input, loading skeletons
      (home/list/bookmark), 8-bit `not-found.tsx`, responsive header pass.

---

## 7. Open questions / future

- Realtime collaboration (Supabase realtime) — deferred past v1.
- Pagination for lists with many bookmarks — add when needed.
- Map/geocoding for `location` — deferred.
