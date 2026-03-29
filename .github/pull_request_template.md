# Pull Request Template

## Description

Please include a summary of the change and which issue is fixed. Also include relevant motivation and context.

---

## Checklist
- [ ] I have tested my changes locally
- [ ] I have updated documentation as needed
- [ ] I have run `npx prisma generate` after schema changes
- [ ] I have run `npx prisma migrate dev` or `npx prisma migrate deploy` as appropriate

---

## Post-Merge Steps for Maintainers

**If this PR includes changes to the Prisma schema:**

1. Run the following command to apply the migration to your database:
   
   ```sh
   npx prisma migrate deploy
   ```
   or, for local development:
   ```sh
   npx prisma migrate dev
   ```
2. Ensure your CI pipeline runs the migration before tests (add this step if missing):
   ```yaml
   - name: Run Prisma Migrate
     run: npx prisma migrate deploy
   ```
3. Make sure the database user in CI has permission to run migrations.

---

If you have any questions, please comment on this PR.
