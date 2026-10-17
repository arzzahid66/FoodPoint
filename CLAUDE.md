# CLAUDE.md

@AGENTS.md

## Claude-specific notes
- Environment is **Windows**. Bash tool runs Git Bash; prefer forward slashes and POSIX syntax there. Users run commands in PowerShell.
- Stay inside the **current phase** (see AGENTS.md §10). If a request belongs to a later phase, say so and confirm before building it.
- Before saying a task is done, run `npm run lint` and `npm run typecheck` (and `npm run test` if logic changed). Report failures honestly.
- **Ask before** destructive or schema-breaking Prisma migrations (dropping/renaming columns, `migrate reset`) because the Neon DB may hold real data.
- Never read, print or commit real values from `.env`.
- For UI changes, verify the flow in a real browser (Playwright MCP) at mobile width (~375 px) and desktop.
- Use shadcn/ui components before writing custom UI primitives. Match existing patterns in `src/components`.
- Keep Server Actions thin; put logic in `src/server/services` so it can be unit-tested.
