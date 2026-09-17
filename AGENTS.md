<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# FoundingVFX project notes

- Pages must only read content through `getRepository()` (`lib/data`). Never import `lib/data/sample/*` from UI code.
- Storage records (`types/storage.ts`, `lib/data/storage.ts`) are server-only; never pass them to client components or API responses.
- Style with CSS modules using the tokens in `app/globals.css`; don't hard-code theme colors.
- Don't show metrics or features that aren't backed by real systems — gate them behind `config/features.ts`.
- Admin pages/actions must call `requireAdmin(permission)` / `authorize(permission)`; never trust the UI.
- After any admin write, call `contentChanged()` so the public site picks it up.
- Run `npm run check` before finishing.
