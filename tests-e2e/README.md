# Resource Library — Playwright Evidence Pack

This folder contains the Playwright end-to-end tests used to produce the
"Evidence for use of a testing tool" screenshots for the Resource Library
module (WE\_238\_3.2, my contribution).

It is intentionally isolated from the React app's own unit-test setup
(`react-scripts test`) so installing Playwright here does not change
anything inside `frontend/` or `backend/`.

## Folder layout

```
tests-e2e/
├── package.json             # Playwright + TypeScript (scoped to this folder)
├── playwright.config.ts     # chromium, 1440×900, headed
├── tsconfig.json
├── specs/
│   ├── _utils.ts                      # login helpers + shared constants
│   ├── rl-auth.spec.ts                # login-failure / login-success
│   ├── rl-dashboard.spec.ts           # dashboard + top-right bell
│   ├── rl-resources.spec.ts           # resources grid + filters
│   ├── rl-notes.spec.ts               # collaborative note editor/save
│   ├── rl-requests.spec.ts            # requests list + status dropdown
│   ├── rl-comments.spec.ts            # add / edit / delete a comment
│   └── rl-notifications.spec.ts       # popup, mark-all-read, page view
└── screenshots/                       # created at runtime
```

Each spec writes `*.png` files into `screenshots/`. Those are the images
you paste into the evidence document alongside a screenshot of the
corresponding `.spec.ts` file.

## First-time setup (only once)

```bash
cd tests-e2e
npm install
npx playwright install chromium
```

This installs Playwright locally to `tests-e2e/node_modules` only. It
does not touch `frontend/node_modules` or `backend/node_modules`.

## Running the tests

Make sure both servers are up first:

```bash
# terminal 1
cd backend && npm start

# terminal 2
cd frontend && npm start
```

Then, in a third terminal:

```bash
cd tests-e2e

# all specs (recommended for evidence run)
npm test

# single spec
npm run test:auth
npm run test:dashboard
npm run test:resources
npm run test:notes
npm run test:requests
npm run test:comments
npm run test:notifications

# watch it happen in a real window
npm run test:headed
```

Screenshots appear in `tests-e2e/screenshots/` after each run. Common
files you will paste into the evidence doc:

- `rl-login-failure.png`
- `rl-login-success.png`
- `rl-dashboard.png`
- `rl-dashboard-topbar-bell.png`
- `rl-resources-list.png`
- `rl-resources-filters.png`
- `rl-notes-list.png`
- `rl-collab-note-editor.png`
- `rl-collab-note-saved.png`
- `rl-requests-list.png`
- `rl-request-status-open.png`
- `rl-comment-added.png`
- `rl-comment-edited.png`
- `rl-comment-deleted.png`
- `rl-notification-popup.png`
- `rl-mark-all-read.png`
- `rl-notifications-page.png`

## How to produce the two-figure evidence pages

For every spec file, include **two figures** (same pattern as the sample
PDF from the other team):

1. **Figure X.3.Y : `<name>.spec.ts`** — screenshot of the code inside
   VS Code, with line numbers visible and no folded blocks.
2. **Figure (X+1).3.Y : `<generated>.png`** — the PNG written by that
   test into `screenshots/`.

Where `Y` is your member number in the group and `X` is the sequential
figure number inside your section.

## Seed data expectations

The tests assume:
- The backend has the RL demo accounts seeded (they are the same ones
  shown on the Resource Library login page).
- There is at least one collaborative note for `rl-notes.spec.ts`.
- There is at least one request row for `rl-requests.spec.ts`.
- There is at least one comment by the logged-in admin for the edit /
  delete comment specs — if none exists the spec logs `test.skip` and
  simply does not produce that particular PNG. Add a comment in the UI
  first and rerun.

## Credentials

From `specs/_utils.ts`:

```ts
export const RL_ADMIN   = { email: 'resourceadmin@gmail.com', password: 'RAdmin123' };
export const RL_STUDENT = { email: 'kasun@gmail.com',         password: 'kasun123' };
```

Switch the default passed to `loginToRl(page, RL_STUDENT)` inside any
spec if you need a student-role screenshot instead.
