# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A classic Tetris implementation in vanilla JavaScript (ES6+), HTML5 Canvas, and CSS. No dependencies, no build step, no package manager — the entire game is three files.

## Running the game

There is no build/lint/test tooling. Open `index.html` directly, or serve it locally:

```bash
python3 -m http.server 8000   # or: npx serve .   /   php -S localhost:8000
```

Then visit `http://localhost:8000`. To verify changes, open the page in a browser and play — there is no automated test suite.

## Architecture

The whole game lives in three files that cooperate directly through the DOM; there are no modules, no bundler, and no framework.

- **`index.html`** — DOM structure: the main `<canvas id="board">` (300×600, i.e. `COLS × BLOCK` by `ROWS × BLOCK`), the `<canvas id="next-canvas">` preview, the score/lines/level panel, and the pause/game-over overlay.
- **`style.css`** — dark/retro arcade visual theme.
- **`game.js`** — all game logic, organized as top-level functions operating on module-level mutable state (`board`, `current`, `next`, `score`, `lines`, `level`, `paused`, `gameOver`, `dropInterval`, etc.). There are no classes and no encapsulation; functions read/write these shared variables directly.

### Core model

- **Board**: a `ROWS × COLS` matrix (`createBoard`); each cell is `0` (empty) or a piece color index `1–7`.
- **Pieces**: defined as square matrices in `PIECES`, paired with colors in `COLORS`. Rotation is done via matrix transpose+reverse in `rotateCW`, not by pre-defining rotated states.
- **Collision** (`collide`): checks board bounds and occupied cells for a shape at a given offset. Used for movement, rotation, and drop checks alike.
- **Wall kicks** (`tryRotate`): after rotating, tries offsets `[0, -1, 1, -2, 2]` columns until a non-colliding position is found, else the rotation is discarded.
- **Locking** (`lockPiece` → `merge` → `clearLines` → `spawn`): merges the current piece into the board, clears completed rows (shifting the board down and unshifting an empty row), then spawns the next piece.
- **Scoring**: `LINE_SCORES = [0, 100, 300, 500, 800]` multiplied by current `level`; hard drop adds 2 points/cell traveled, soft drop adds 1 point/row. Level increases every 10 lines; `dropInterval = max(100, 1000 - (level-1)*90)` ms.
- **Ghost piece** (`ghostY`): projects the current piece straight down to its landing row, drawn at `globalAlpha = 0.2`.

### Game loop

`init()` sets up state and kicks off `requestAnimationFrame(loop)`. `loop(ts)` accumulates elapsed time in `dropAccum`; once it exceeds `dropInterval`, the piece drops one row (or locks if it can't). Every frame calls `draw()` (grid → locked board → ghost → current piece). Input is handled by a single `keydown` listener (arrow keys, `X` to rotate, `Space` for hard drop, `P` to pause); `restartBtn` calls `init()` again.

### Tunable constants (top of `game.js`)

`COLS`, `ROWS`, `BLOCK` (cell size in px), `COLORS`, `LINE_SCORES`, initial `dropInterval`. If `COLS`/`ROWS`/`BLOCK` change, update the `<canvas id="board">` `width`/`height` in `index.html` to match (`COLS × BLOCK` by `ROWS × BLOCK`).

## GitHub Actions

Three workflows in `.github/workflows/`, all built on `anthropics/claude-code-action@v1`:

- **`claude.yml`** — responds when `@claude` is mentioned in an issue/PR comment or review.
- **`claude-code-review.yml`** — runs the `code-review` plugin automatically on every PR.
- **`claude-issue-triage.yml`** — runs on `issues: [opened, edited]` (skipped for bot senders and for issues labeled `wontfix`/`duplicate`). It syncs labels from `.github/labels.yml` (the versioned source of truth — type, `area/*`, `priority/*`, `complexity/*`, `needs-info`, `triaged`), applies the appropriate ones to the issue, and posts/updates a single "sticky" diagnosis comment marked with `<!-- claude-triage-report -->` (found via the GitHub API and PATCHed in place on re-triage, never duplicated). That comment documents the affected `game.js` functions, probable root cause, a solution approach, and acceptance criteria — read it before implementing a fix for a triaged issue, it's meant to save re-deriving that analysis.
