# Changelog

## 2.0.0

### Breaking changes

- Requires Angular `^22.0.0` (peer), NGXS `^21.0.0 || ^22.0.0` and RxJS `^7.8.0`. Older Angular/NGXS versions are no longer supported; stay on 1.x for those.

### Changes

- Zoneless-safe: the plugin never relied on `zone.js` or `NgZone`; the test setup no longer loads `zone.js` either.
- `withNgxsResetPlugin()` now uses `provideEnvironmentInitializer` (replaces the deprecated `ENVIRONMENT_INITIALIZER`) and classes use `inject()`.
- Fix: `StateResetAll` works with NGXS 21+, which dispatches `InitState` before the plugin handler is created; the initial snapshot is now captured on creation.
- Tooling: `@angular/build` builders, TypeScript 6.0, ESLint flat config, `karma-coverage`.
- Public API is unchanged (`withNgxsResetPlugin`, `NgxsResetPlugin`, `StateClear`, `StateReset`, `StateResetAll`, `StateOverwrite`).
