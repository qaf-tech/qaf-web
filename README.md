# qaf-web

Next.js 16 + React 19 + Bun PWA shell for the QAF platform. Liquid Glass design system, WebSocket client against the hub service, offline-capable PWA, and a light/dark theme with flash prevention.

## Features

- PWA shell with a web app manifest (`public/manifest.json`) and a service worker (`public/sw.js`) for installability and offline caching
- Liquid Glass design language via CSS custom properties in `src/styles/tokens.css` and a reusable glass surface module in `src/styles/glass.module.css`
- Light-mode-first theme with `prefers-color-scheme` auto-detect, manual override via `localStorage`, and an inline pre-hydration script to prevent theme flash
- Typed WebSocket client with heartbeat, exponential reconnect backoff, and subscription management (`src/lib/ws/client.ts`) plus a `useWebSocket` React hook
- Next.js App Router with route groups for onboarding (`(auth)`) and the authenticated wallet surface (`(wallet)`), a shared `AppShell`, `Navbar`, and `BottomNav`
- CSS Modules only (no third-party CSS framework), linted and formatted with Biome, tested with the built-in `bun test` runner

## Prerequisites

- Bun 1.3+ (used as both package manager and test runner)
- Docker (optional, for the container build)

## Project layout

```text
src/
├── app/
│   ├── (auth)/             # Onboarding route group (layout + onboarding pages)
│   ├── (wallet)/           # Authenticated wallet route group (asset, cards, chat, privacy, settings, use, verify)
│   ├── globals.css         # Global resets and token imports
│   └── layout.tsx          # Root layout: PWA meta tags, manifest link, theme bootstrap, service worker registration
├── components/
│   └── layout/             # AppShell, Navbar, BottomNav (Liquid Glass surfaces)
├── hooks/
│   ├── useTheme.ts         # Theme resolver with system preference + localStorage override
│   └── useWebSocket.ts     # React binding around the WS client
├── lib/
│   ├── config.ts           # Single source of truth for NEXT_PUBLIC_* env vars
│   └── ws/                 # WebSocket client, message types
├── styles/
│   ├── tokens.css          # Design tokens (colors, spacing, radii, glass, typography, z-index)
│   ├── glass.module.css    # Reusable Liquid Glass surface
│   └── reset.css           # Baseline reset (62.5% root font size so 1rem = 10px)
└── test/
    └── setup.ts            # bun:test preload (happy-dom + CSS module stub + cleanup)
public/
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
└── icons/                  # 192x192 and 512x512 maskable icons
```

## Configuration

All configuration is exposed through `src/lib/config.ts`; no component or hook reads `process.env` directly. These variables are `NEXT_PUBLIC_*`, which means they are baked into the client bundle at `next build` time and must be provided as build arguments (or in `.env.local` for local `next dev`).

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_WS_URL` | yes | `ws://localhost:8080/ws` | WebSocket endpoint exposed by the hub service |
| `NEXT_PUBLIC_API_URL` | yes | `http://localhost:8080/api` | HTTP base URL for the hub service |
| `NEXT_PUBLIC_APP_NAME` | yes | `QAF Wallet` | Application name surfaced in the UI and manifest |
| `NEXT_PUBLIC_APP_VERSION` | yes | `0.1.0` | Application version surfaced in the UI |

Copy `.env.example` to `.env.local` and adjust as needed:

```bash
cp .env.example .env.local
```

## Commands

| Command | Purpose |
|---------|---------|
| `bun install` | Install dependencies from `bun.lock` |
| `bun dev` | Start the Next.js dev server on `http://localhost:3000` |
| `bun run build` | Produce a production build with `output: "standalone"` |
| `bun start` | Serve the production build |
| `bun test` | Run the full `bun:test` suite (unit tests colocated under `src/`) |
| `bun test --watch` | Re-run tests on file change (TDD loop) |
| `bun run lint` | Run Biome lint + formatter check |
| `bun run format` | Apply Biome formatting in place |

Typical first-run:

```bash
bun install
cp .env.example .env.local
bun dev
```

## Testing

Tests use the built-in `bun test` runner (no Jest, no Vitest). The `[test].preload = ["./src/test/setup.ts"]` entry in `bunfig.toml` wires up the harness before any test file loads:

- `@happy-dom/global-registrator` installs a DOM on the global scope so React Testing Library can render components
- A Bun plugin stubs `*.module.css` imports (returning an identity `Proxy` so class names resolve to their own key) and plain `*.css` imports (returning `{}`), which keeps components under test decoupled from CSS module compilation
- An `afterEach` hook clears `document.body` between tests so renders do not leak across cases

Test files live next to the source they cover (`useTheme.test.ts` alongside `useTheme.ts`, `client.test.ts` alongside `client.ts`, etc.).

## PWA

- `public/manifest.json` declares `name`, `short_name`, `start_url`, `display: "standalone"`, `theme_color`, `background_color`, and maskable 192x192 / 512x512 icons in `public/icons/`
- `public/sw.js` is the service worker; it is registered client-side from `src/app/layout.tsx` when `navigator.serviceWorker` is available
- The root layout emits the required meta tags: `viewport` with `viewport-fit=cover`, `theme-color`, `<link rel="manifest">`, and Apple web-app capability tags
- `beforeinstallprompt` is retained so the app can surface an install prompt when the browser offers one

## Design tokens and CSS

- Root font size is set to `62.5%` so `1rem = 10px`; all spacing, font sizes, and component dimensions throughout the app are expressed in `rem`
- All design tokens (colors, spacing scale, border radii, typography scale, transitions, z-index scale, and Liquid Glass variables) live in `src/styles/tokens.css` as CSS custom properties; components reference them via `var(--token-name)` and never inline raw values
- The Liquid Glass surface is centralised in `src/styles/glass.module.css` (background, `backdrop-filter` with saturation, border, shadow, radius); cards, navbars, and bottom navigation compose it
- Component styles use CSS Modules (`*.module.css`) so class names are scoped per component; no Tailwind, no Bootstrap, no third-party CSS framework is used
- Dark mode is opt-in via `[data-theme="dark"]` on `<html>`; `prefers-color-scheme` is honoured as the initial value, and a user override is persisted to `localStorage` and applied by an inline bootstrap script to avoid a flash of the wrong theme

## Notes

- `next.config.ts` enables `output: "standalone"` (self-contained production bundle for Docker) and `reactCompiler: true` (React 19 automatic memoisation via `babel-plugin-react-compiler`)
- TypeScript is in strict mode with the `@/*` path alias mapped to `./src/*`
- Biome is configured with CSS Modules parsing enabled and the Next.js and React lint domains turned on; run `bun run lint` before committing
