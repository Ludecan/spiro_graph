---
name: code-conventions
description: Spiro Graph coding rules that add to or override write-good-code and html-conventions. Use whenever you write, fix, refactor or review code in this repo.
---

# Spiro Graph code conventions

- Keep the banner-comment sections of the `<script>` in `index.html`, in this order: `state`, `canvas setup`, `stroke drawing`, `auto-morph`, `main loop`, `UI`, `resize`, `boot`. Put new code in the section that owns it.
- All state lives in `S`. UI ids are short (`R r d wob ...`): use the same short style for a new control.
- Every control has a `title` tooltip that says what it does. Lock buttons override the tooltip with their own.
- Every control is lockable: add a `.lock[data-lock]` button, and make `isLocked()` gate it in Random and in Auto-morph drift. Locks stop only the machine. The user can always change a locked control by hand.
- The URL hash is the full shareable state. A new setting gets a hash key in `pushHash` and `loadHash`. Never rename or remove a key: old links must still load. Convert a legacy key in `loadHash`, as `fd=` is converted to `trailDur`.
- When you add a control, add its ids to the stub list in `scripts/smoke.js`, and add a test of its behavior there.
- Commit messages: a short imperative subject, then bullets that explain the change.
