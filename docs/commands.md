# Commands

## Development

| Command                 | Description                                 |
| ----------------------- | ------------------------------------------- |
| `npm start`             | Start dev server at `http://localhost:4200` |
| `npm run build`         | Build for production                        |
| `npm run serve:ssr`     | Serve SSR build locally (run `build` first) |
| `npm run serve:ssr:dev` | Build dev config + serve SSR locally        |

## Testing

| Command                        | Description                         |
| ------------------------------ | ----------------------------------- |
| `npm test`                     | Run unit tests (watch mode)         |
| `npm test -- --no-watch`       | Run unit tests once                 |
| `npm run test:coverage`        | Run unit tests with coverage report |
| `npm run e2e`                  | Run Playwright E2E tests            |
| `npm run e2e:ui`               | Run E2E tests with interactive UI   |
| `npm run e2e:update-snapshots` | Update visual regression baselines  |

## Code Quality

| Command                | Description               |
| ---------------------- | ------------------------- |
| `npm run lint`         | Run ESLint                |
| `npm run format:check` | Check Prettier formatting |
| `npm run format`       | Fix Prettier formatting   |

## CI Pipeline

These run in order during CI:

```
npm run lint
npm run format:check
npm run build
npm test
npm run e2e
```
