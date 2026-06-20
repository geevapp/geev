---
name: Bug Report
about: Report a defect in the app, API, or smart contracts
title: '[BUG] '
labels: bug
assignees: ''
---

## Summary

<!--
One sentence: what broke and where.
Example: "Submitting an entry on a reputation-gated giveaway returns 500 with PostgreSQL error 'invalid input syntax for type uuid'."
-->

## Steps to Reproduce

1. ...
2. ...
3. ...

## Expected Behavior

<!--
What you expected to happen.
-->

## Actual Behavior

<!--
What actually happened — include exact error messages, screenshots, or links.
For on-chain bugs include the Soroban transaction hash and ledger sequence.
-->

## Environment

<!--
Delete rows that don't apply.

- **Surface**: [web app / mobile-web / API / Soroban contract / indexer / cron]
- **Wallet**: [Freighter v… / Lobstr / Stellar CLI / none]
- **Network**: [testnet / public]
- **Branch / commit SHA**: ...
- **Browser**: [Chrome 124 / Safari 17 / Firefox …]
- **OS**: [macOS 14 / Ubuntu 22.04 / iOS 17]
- **Auth method**: [Freighter / legacy email / dev mock user]
- **Wallet address** (if safe to share): G…
-->

## Logs / Artifacts

<!--
Paste console logs, server logs, Prisma query outputs, Soroban event payloads,
or screenshots / screen recordings. Use fenced code blocks.
REMOVE / REDACT: wallet private keys, JWT secrets, signers, seed phrases.
-->

## Related Issues / PRs

<!--
- Closes #
- Related to #
- E.g. reproducing on PR #XYZ
-->

## Severity

<!--
🟢 Low      — cosmetic, edge case, workaround exists
🟡 Medium   — broken feature with workaround
🟠 High     — broken feature, no workaround
🔴 Critical — loss of funds, security exposure, data loss, or app outage
-->

## Possible Cause (optional)

<!--
If you have a hunch (e.g. "race condition in select-winners"), share your reasoning —
no fix is required in the bug report itself.
-->

## Reproduction Checklist

- [ ] I searched existing issues and confirmed this is not a duplicate
- [ ] I can reproduce this bug at will
- [ ] I have redacted all secrets / private keys from logs before submitting
