# TODO

## Goal
Clean up project duplication and make it simpler to run (dev + static hosting).

## Steps
1. Update `package.json` scripts to have a clear dev flow (next dev) and static flow (build/export + static serve without unnecessary rebuild).
2. Update `README.md` with minimal run instructions (2-3 commands only).
3. Verify `.gitignore` ignores build artifacts (`.next/`, `out/`).
4. Run commands to verify landing page works:
   - `npm run dev`
   - `npm run static:serve` (or equivalent) and open the printed localhost URL.

