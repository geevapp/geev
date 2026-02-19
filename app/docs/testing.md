# Testing Guidelines

## Running Tests

- Run all tests: `npm test` or `npm run test`
- Run tests with UI: `npm run test:ui`
- Run tests with coverage: `npm run test:coverage`
- Run tests in CI mode: `npm run test:ci`

## Test Structure

- All tests are in the `tests/` directory.
- Unit tests: `tests/lib/`
- Integration/API tests: `tests/api/`
- Helpers: `tests/helpers/`
- Mocks: `tests/mocks/`

## Database

- Tests use a separate test database defined in `.env.test`.
- Never run tests against production or development databases.
- The test database is reset before each test.

## Utilities

- Use helpers in `tests/helpers/` for creating test data and API mocks.
- Use `tests/mocks/` for mocking modules (e.g., authentication).

## Coverage

- Coverage reports are generated in the `coverage/` directory.
- Uploads to Codecov in CI.

## CI

- Tests run automatically on push/PR to `main` and `develop` branches via GitHub Actions.

## Adding Tests

- Place new unit tests in `tests/lib/`.
- Place new API/integration tests in `tests/api/`.
- Use provided helpers for consistent test data.

## Example Commands

```
npm test
npm run test:coverage
npm run test:ui
```

## Notes

- Ensure your test database is running and accessible.
- Use environment variables from `.env.test` for test runs.
