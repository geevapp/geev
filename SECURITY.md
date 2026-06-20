# Security Policy

This document describes how to report security vulnerabilities responsibly, what is (and isn't) in scope, and the high-impact surfaces we monitor across the Geev codebase.

The Geev platform combines wallet-based authentication (Stellar SEP-10), on-chain Soroban contracts, and a Postgres-backed Next.js API. Several of these surfaces handle real value on Stellar, so security reports from the community are taken seriously and acknowledged quickly.

## Supported Versions

`main` is the actively supported development line. Security fixes ship promptly on `main` and are backported to the most recently tagged release when the report allows.

| Branch / Tag | Supported |
| --- | --- |
| `main` (latest) | ✅ |
| Latest tagged release — see [Releases](https://github.com/geevapp/geev/releases) | ✅ |
| Older tags / feature branches | ❌ |

## Reporting a Vulnerability

**Please do not file a public GitHub issue for security bugs.** Public disclosure before a fix ships puts users at risk and is contrary to this policy.

Use one of these private channels (in order of preference):

1. **GitHub Private Vulnerability Reporting** — once a maintainer enables it under *Settings → Code security → Private vulnerability reporting*, this becomes the default surface reporters use. (No public URL needed until enabled.)
2. **GitHub Security Advisories** — open a [private security advisory on `geevapp/geev`](https://github.com/geevapp/geev/security/advisories/new). Keeps the conversation between you, the maintainers, and (later) the public disclosure record.
3. **Email** — `security@geevapp.com` *(placeholder — replace once a dedicated mailbox is provisioned; do not send PII or secrets until a PGP key is published alongside this file)*.

### What to Include in the Report

A good report speeds triage. Please provide:

- **Affected components** — file paths, route handlers, or Soroban modules.
- **Reproduction steps** — minimal steps from a clean checkout (`pnpm install` is enough for the app; `cargo test` for the contracts).
- **Impact** — worst-case scenario (e.g. wallet drain, replay of an old giveaway-payout signature, SQL injection to exfiltrate `User` rows).
- **Environment** — branch / commit SHA, network (`testnet` / `public`), wallet (Freighter / Lobstr / Stellar CLI), Node / Rust version.
- **Disclosure plan** — whether you intend to publish, and your preferred timeline.

### Acknowledgement & Disclosure Timeline

| Stage | SLA |
| --- | --- |
| Initial acknowledgement | within **5 business days** |
| Triage update + impact assessment | within **10 business days** |
| Coordinated disclosure window | **90 days** from acknowledgement (negotiable for complex issues) |

Once a fix is ready, we will publish the advisory, credit the reporter (or honor a request for anonymity), and tag the patched release.

## Safe Harbor

We will not pursue legal action against researchers who:

- Make a good-faith effort to avoid privacy violations, data destruction, or service disruption.
- Only interact with accounts they own or have explicit permission to test.
- Stop testing immediately on discovering a real vulnerability and contact us.
- Refrain from publicly disclosing until the coordinated disclosure window closes (or we agree on a different date).

If you accidentally see **KYC information, seed phrases, or recovery material** in your hands during testing:

1. Stop.
2. Do **not** persist, forward, screenshot, or share it.
3. Contact us via the channels above and let us coordinate next steps.

## Bug Bounty

There is currently **no formal bug-bounty program**. High-impact reports may be rewarded on a case-by-case basis. A formal program is on the roadmap — until then, your report is itself the contribution, and we will name you in the public advisory unless you ask to remain anonymous.

## GitHub-Side Hardening

The repo also benefits from these GitHub-side controls — please verify they're enabled (Settings → Code security and analysis):

- **Private vulnerability reporting** (point 1 above)
- **Dependabot security alerts** for `package.json` / `app/package.json` / `Cargo.toml`
- **Dependabot version updates** (optional)
- **Secret scanning** with **push protection** so leaked API keys / wallet seeds fail the commit
- **Code scanning** (CodeQL) for `app/` — if enabled

If any of these are missing in the repo, please file a normal issue rather than a security advisory — they're hygiene, not vulnerabilities.

## High-Impact Surfaces

A non-exhaustive map of the surfaces we care most about. Reports touching these areas are especially welcome.

### 🔐 SEP-10 Wallet Challenge

Geometry: `app/lib/sep10.ts`, `app/lib/wallet-auth.ts`, and the routes under `app/api/auth/` (`nonce`, `challenge`, `verify`, `legacy-login`).

- The SEP-10 **server account's signing key MUST never leave the server**. Challenge responses are signed on the server; client-side signing must be done by the user's wallet, not the backend.
- **Replay protection** must read the `UsedChallenge` Prisma model (defined in `app/prisma/schema.prisma`) before accepting any `(transactionHash, publicKey)` pair. Verify the lookup is performed and that `usedChallenge.create` happens before any state change.
- **Sequence-number hygiene** — the SEP-10 server account must use a monotonically increasing sequence; the home-domain `manageData` op should consume the next valid sequence. See `app/lib/sep10.ts` for the builder.
- The Sep-10 challenge server account (`serverAccount`) must not be re-used for any other purpose (especially not as a destination of giveaway payouts).

### 🪪 JWT / NextAuth Sessions

Files: `app/lib/auth.ts`, `app/lib/auth-config.ts`, `app/lib/jwt.ts`, `app/api/auth/[...nextauth]/route.ts`, the `Account` Prisma model.

- **Never** place JWTs in URLs, persistent browser storage that survives logout, or `Referer` headers.
- The **Prisma NextAuth adapter** should be wired with a database that enforces `@@unique([provider, providerAccountId])` on `Account` (the schema declares it; do not loosen it).
- `AUTH_SECRET` / `NEXTAUTH_SECRET` must come from a secret manager in production. `.env.example` mentions these placeholders; production deployments must inject real secrets, not dev fallbacks.
- Cookie attributes: `Secure`, `HttpOnly`, `SameSite=Lax` (or `Strict` for higher-risk flows). Rotate the secret on any suspected compromise.

### ✍️ Wallet Signing

Files: `@stellar/freighter-api` usage in `app/components/wallet-login-form.tsx`, `app/lib/stellar.ts`, the entry-submit flows under `app/api/posts/[id]/entries/route.ts` and `app/api/posts/[id]/contributions/route.ts`.

- **Server never holds private keys** — this is a hard invariant. All signing happens in the user's wallet (Freighter, Lobstr, Stellar CLI).
- Every server-side `Transaction` is **built from user-supplied parameters**; validate every parameter against the canonical contract state before constructing the transaction envelope (e.g. proof image URL, entry content, recipient address).
- Reject any flow that requires the user to sign a **pre-built XDR**. The user must always see and approve the source operations in their wallet before broadcasting.
- Be alert to **transaction malleability** — even when the envelope is correct, re-check `txHash` and ledger references on read paths.

### 🗄 Database / Prisma SQL Injection

Files: `app/lib/prisma.ts`, every route under `app/api/`, the Prisma schema (`app/prisma/schema.prisma`).

- Prefer **typed Prisma client queries** over raw SQL. Where raw SQL is unavoidable, use `$queryRaw` with **`$1`/`$2` parameter placeholders** — never `$queryRawUnsafe` with string interpolation.
- Search inputs that pass into `where: { … contains: input }` are safe by default, but always **validate and constrain** user input with a Zod schema before passing to Prisma. See `app/lib/validation.ts` and `app/lib/parse-json-body.ts`.
- `LIKE` patterns must **escape `%` and `_`** from user input, otherwise `100%-match` becomes a wildcard scan (potential info-leak / DoS).
- PostgreSQL `provider` in the schema does not currently use `pg_trgm` or full-text indexing — if added later, ensure GIN/GiST indexes don't enable rogue write amplification or unconstrained growth.
- Beware **identifier-mapping attacks** on slug-based routes (see `app/lib/post-slug.ts`) — unique constraints in the schema (e.g. `User.username`, `Post.slug`) are the last line of defense; do not loosen them.

### 📦 npm / pnpm Supply Chain

Files: `package.json`, `app/package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`.

- **Always run `pnpm install --frozen-lockfile`** in CI and on production deploys — never allow `pnpm install` to silently rewrite the lockfile.
- Use **`pnpm audit`** (or `npm audit --omit=dev`) regularly; treat moderate-or-higher findings as CI failures.
- Pin transitive high-risk packages (`next-auth`, `jose`, `prisma`, `@stellar/stellar-sdk`, `soroban-sdk`) to a known-good version range via the lockfile, not just `^x.y.z`.
- Avoid **postinstall scripts** in dependencies; review any that the lockfile notes. The root `pnpm-workspace.yaml` already has an `onlyBuiltDependencies` allow-list — keep it minimal (currently `@prisma/client`, `@prisma/engines`, `esbuild`, `prisma`, `sharp`).
- Subscribe to **GitHub Dependabot security alerts** for the repo and respond within SLA to high/critical CVEs.

### ⛓ Soroban Contract Surfaces

Files: `contracts/geev-core/src/*.rs`, especially `access.rs`, `admin.rs`, `giveaway.rs`, `mutual_aid.rs`, `governance.rs`.

- **Authenticate every privileged call** — the `check_admin` helper in `access.rs` is invoked from admin-only paths. Verify it on every new admin entry-point before merging.
- **Status transitions are one-way**: a giveaway in `Completed` or `Cancelled` status **MUST NOT** become re-enterable. Audit the test snapshots under `contracts/geev-core/test_snapshots/test/` for status-flip regressions.
- **No re-entrancy** — `distribute_prize` has explicit re-entrancy guards in test snapshots; any new flow that transfers funds should follow the same pattern.
- **Donation reentrancy / over-funding** — `mutual_aid.rs` emits contributor events and tracks totals; verify the receive path is **idempotent** and refuses contributions past the goal.
- **Governance / flag auto-suspend** — the `governance.rs` flag thresholds are constants of the platform; reports on circumvention are highest priority.
- Treat any finding in **`admin.rs`** that reduces admin friction (e.g. accidental permission grant to non-admin) as **critical** — admin ops on-chain cannot be undone without upgrade.

## Out-of-Scope Reports

For clarity, the following classes of reports are generally considered *bugs*, not vulnerabilities, and don't carry the SLA above:

- **Browser autofill / autofill-style leakage** inherent to web apps — fix upstream, not in the platform.
- **Self-XSS** that requires the user to paste their own credentials into untrusted fields.
- **Rate-limit bypass** on dev-mode endpoints (`MOCK_DB=true` only).
- **Cosmetic UI bugs** without security impact — please file a normal issue.
- **Findings against forks** or third-party deployments we do not operate.

If you're unsure whether a behavior is a bug or a vulnerability, *default to reporting privately* first. Provide textual reproduction steps + source-code references; attach a packet capture only if absolutely necessary.

## When You're Not Sure

If a packet capture, KYC document, or recovery phrase appears in your hands during testing, follow the **Safe Harbor** "stop and contact us" steps above. Don't try to redact it locally; let the maintainers handle it.

Thank you for helping keep the Geev platform safe.

— Geev maintainers
