# Contributing to Geev

Thanks for your interest in contributing! Geev is a `pnpm` + `turbo` monorepo that pairs a Next.js web app (`app/`) with Soroban smart contracts (`contracts/`). Issues, pull requests, and discussions are all welcome.

## 📝 Issue & PR Templates

Please use the existing templates — they help reviewers triage faster and reduce ping-pong:

- **Bug reports:** [`.github/ISSUE_TEMPLATE/bug_report.md`](.github/ISSUE_TEMPLATE/bug_report.md)
- **Feature requests / enhancements:** [`.github/ISSUE_TEMPLATE/feature_request.md`](.github/ISSUE_TEMPLATE/feature_request.md)
- **Pull request description:** [`.github/pull_request_template.md`](.github/pull_request_template.md)

## 🛠 Local Development Setup

### Prerequisites

- **Node.js** ≥ 20 (`engines.node` in [package.json](package.json))
- **pnpm** ≥ 10 (`packageManager` in [package.json](package.json))
- **PostgreSQL** running locally (see [`app/README.md`](app/README.md) for the `DATABASE_URL` shape)
- **Rust toolchain** with the `wasm32-unknown-unknown` target — install via `rustup target add wasm32-unknown-unknown`
- **`soroban-cli`**: `cargo install --locked soroban-cli`

### 1) Install dependencies (monorepo root)

```bash
pnpm install
```

This installs both workspaces — `app/` and `contracts/`.

### 2) Set up the Next.js app

```bash
cd app
cp .env.example .env             # fill in DATABASE_URL, AUTH_SECRET, NEXTAUTH_SECRET
pnpm prisma generate
pnpm prisma migrate deploy
pnpm prisma db seed              # creates default ranks/badges + 5 dummy users
```

Generate a strong `AUTH_SECRET` / `NEXTAUTH_SECRET` if you don't have one:

```bash
openssl rand -base64 32
```

> The generated Prisma client is emitted to `app/lib/generated/prisma` and is gitignored — re-run `pnpm prisma generate` any time `app/prisma/schema.prisma` changes, and never commit the generated files.

### 3) Run the dev server

```bash
# from the monorepo root — turbo runs both workspaces
pnpm dev

# or just the Next.js app
cd app && pnpm dev
```

App boots at <http://localhost:3000>. In dev mode the **Dev User Switcher** (bottom-right) lets you sign in as a seeded user.

### 4) Build, test, and deploy the Soroban contracts

```bash
cd contracts
soroban build                    # compiles the WASM artifact
cargo test                       # runs snapshot-based unit tests
cargo clippy --all-targets       # lint

# Deploy (optional)
soroban deploy --network testnet
soroban deploy --network local
```

## ✅ Tasks You'll Run Often

From the **monorepo root** (turbo fans them out across both workspaces):

| Goal | Command |
| --- | --- |
| Dev server (Next.js + app workspace) | `pnpm dev` |
| Production build | `pnpm build` |
| Run all tests | `pnpm test` |
| Lint everything | `pnpm lint` |
| Format `*.ts` / `*.tsx` / `*.md` | `pnpm format` |
| Clean workspaces | `pnpm clean` |

From **`app/`**:

| Goal | Command |
| --- | --- |
| Open Prisma Studio | `pnpm prisma studio` |
| Reset + reseed the local DB | `pnpm prisma migrate reset` |
| Run app tests in watch mode | `pnpm test:watch` |
| Coverage report | `pnpm test:coverage` |

## 📦 Changesets (Required for User-Facing PRs)

Geev uses [Changesets](https://github.com/changesets/changesets) to version packages. For any **user-facing** change, add a changeset at the repo root:

```bash
pnpm changeset
```

You'll be prompted for:

1. Which workspace is affected (`app` or `contracts`).
2. Semver bump: `patch` / `minor` / `major`.
3. A short summary that lands in the relevant `CHANGELOG.md`.

Skip the changeset for purely internal refactors, tests, or docs that don't change user-visible behavior.

## 🌿 Branch & Commit Conventions

- **Branches:** `feat/<scope>/…`, `fix/<scope>/…`, `chore/<scope>/…`, `docs/<scope>/…` — keep them short.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/):

  ```
  feat(frontend): add notification center
  fix(auth): enforce validation on SEP-10 challenge
  chore(repo): add pull request template
  docs: add contributing guide
  ```

- Keep one logical change per PR — even a single file. Squash fixups locally before pushing if it helps reviewers.

## 🔁 Pull Requests

1. Fork the repo (or create a branch directly if you have access).
2. Push to your fork / branch.
3. Open a PR against `geevapp/geev:main`. Use the PR template and reference any related issue (`Closes #NNN`).
4. CI will run `pnpm lint`, `pnpm test`, and `cargo test` automatically.
5. Address review feedback, push follow-up commits, and let reviewers re-run CI.

If you only have `pull` access on the upstream repo, GitHub will offer to open a cross-fork PR automatically once you push to your fork. The CLI equivalent (replace `OWNER` with your GitHub username on the fork):

```bash
gh pr create --repo geevapp/geev \
  --base main \
  --head OWNER:docs/add-contributing-guide \
  --title "docs: add contributing guide" \
  --body "Adds CONTRIBUTING.md linking to PR / issue templates and documenting the monorepo setup for app/ and contracts/."
```

## 🧪 Tests & Quality Gates

Before requesting review, make sure:

- [ ] `pnpm lint` is clean.
- [ ] `pnpm test` passes (Vitest in `app/`).
- [ ] `cargo test` passes (snapshot tests in `contracts/test_snapshots/`).
- [ ] New behavior has tests. If you intentionally change contract behavior, delete the affected `test_snapshots/test/*.json` files so the next `cargo test` regenerates them, and call this out in the PR description.
- [ ] No new `cargo clippy` warnings.
- [ ] Changeset added if user-facing.
- [ ] Docs / inline comments updated where the API or flow changed.

## 🐛 Reporting Bugs / Requesting Features

Use the linked issue / PR templates above. When reporting bugs, **never paste private keys, JWT secrets, signers, or seed phrases** — even in screenshots. Redact any wallet signing material before submitting.

## 💬 Community

- Telegram: <https://t.me/geevapp>
- Discord: <https://discord.gg/wQP2CkHj>

## 📜 License

Geev is MIT-licensed. See [`package.json`](package.json).
