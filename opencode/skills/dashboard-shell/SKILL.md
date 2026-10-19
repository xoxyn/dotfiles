---
name: Dashboard Shell
description: Build or upgrade an interactive web app dashboard ("app shell") in the style of a authored product UI — persistent sidebar with a travelling selection pill, animated nav icons that play on row hover, collapsing icon rail, mobile drawer, top bar with derived notifications, ⌘K command palette, paper-grid tray background, and a brand-adaptable token system. Use this skill whenever the user wants a dashboard/app shell/admin sidebar built or restyled, wants "the AiKi-style dashboard", wants an existing dashboard modernized to a polished shell, or mentions sidebar navigation, travelling pill, collapsing rail, or icon animations in an app's inner pages.
---

# Dashboard Shell

## Role

Build (or upgrade) an application's inner-pages shell — sidebar, top bar, and
page frame — with authored-product polish. The structure is fixed machinery;
the palette, icons, logo, nav items, and data wiring are per-site. Two modes:
BUILD (no dashboard exists yet) and ENHANCE (one exists — upgrade in place,
preserve its data wiring and routes).

## Phase A — Detect the codebase (ENHANCE mode especially; always run)

Before asking anything, scan the repository and report what you found:

1. **Existing dashboard/shell**: look for route groups, a layout that wraps
   inner pages, nav/sidebar/topbar/header components, admin panels, or a
   `components/*/shell`-like folder. If found, ENHANCE mode is the default —
   restyle and restructure in place; preserve every data hook, route, state
   store, and click handler. Do not gut working logic.
2. **Logo/brand assets**: scan `public/`, `assets/`, `static/`, next/image
   usage, favicon, and any logo/brand components. Reuse them as-is; never
   invent a logo. Report what you found.
3. **Icons**: discover the icon system already in use (lucide, heroicons,
   custom SVG components, an icon folder). Reuse it. If none exists, add one
   source and stick to it.
4. **Theme/domain**: from README, package.json name/description, route slugs,
   and page copy, infer what the product does and who uses it. This informs
   nav naming and what deserves a notification tone.
5. **Design tokens**: existing CSS variables, Tailwind config, colors, fonts,
   radii. The shell must adopt these — a shell that fights the brand's
   existing tokens has failed the task.
6. **Framework and stack**: Next.js App Router / Pages / other; Tailwind
   presence; animation library (motion/framer-motion or none); state (hooks,
   store, context). Match it; don't introduce new dependencies when an
   equivalent exists.

## Phase B — Interview (mandatory; ask what detection couldn't answer)

1. Palette: primary accent (one family, with wash/lit/soft variants),
   ink/neutral tone, surface tone. Propose from detected tokens; confirm.
2. Accent discipline: what single role does the accent play? (e.g. "anything
   that needs the user" — counts, live states, approval buttons). It must be
   rationed, not decorative.
3. Nav structure: top-level sections, groups, order by importance.
4. Top bar contents: identity/avatar chip, live status, notifications of what
   (derived from which app state), pauses/toggles?
5. Command palette (⌘K) wanted? If yes, which commands/pages?
6. Font: keep product font (default) or detect-specific.
7. Density: comfortable (default) or compact.

## Phase C — Machinery (identical across all sites)

### The shell frame (AppShell)
- Full-height frame: `flex h-[100dvh] min-h-0 w-full overflow-hidden` with
  small outer padding (p-2 / md:p-3) so every panel floats on the surface.
- Tray background: neutral surface + subtle grid-paper texture via stacked
  1px linear-gradients sized to a CSS var (e.g. 72px), opacity ~0.1, shown in
  the margins only (all panels above it are opaque).
- Desktop: sidebar is a static column whose width is a CSS variable
  (`--sb-w`): collapsed `60px`, expanded `clamp(196px, 19vw, 252px)`;
  `transition-[width] 300ms cubic-bezier(0.22,1,0.36,1)`. The width lives on
  the flex CHILD, not the inner scroll container.
- Mobile breakpoint 767px: sidebar becomes a fixed drawer (slides from left,
  `z` above a scrim; backdrop button closes it), full width 264px, rounded,
  shadowed, always full when open (never a glyph rail on touch). While open:
  `role="dialog"`, `aria-modal`, focus first focusable, Tab focus-trap, Focus
  returns to the trigger on close. The closed side gets `inert`. Escape
  closes (shared escape-layer helper).
- Content column: TopBar (shrink-0) + `<main id="main">` filling the rest,
  both `min-w-0 min-h-0 overflow-hidden` to keep child tables/scrollers sane.

### The sidebar
- Header: logo image + wordmark; in rail mode hide the wordmark, keep the
  logo centered. A collapse toggle with a small drawn panel glyph (CSS-drawn,
  flips side when collapsed); on phone this button closes the drawer.
- Search row (rounded-[14px], subtle bg) that opens the command palette; it
  shows its shortcut hint.
- Nav groups with small headings; rows h-[42px], rounded-[13px], icon ~18px,
  truncate labels, optional count badge (accent pill) and optional tag chip.
- Active row: no background of its own — selection is ONE pill behind the
  whole list (see travelling pill). Hover row: barely-there tint.
- Rail mode: rows collapse to centered icons; count badges become a small
  dot pinned to the icon's corner; tooltips via `title`.
- Unbuilt routes/sections may exist but must respond honestly (toast or
  disabled state), never silently.

### The travelling pill (the signature)
- ONE absolutely-positioned pill behind the nav list; positioned from the
  active row's own DOM box (`offsetTop`/`offsetHeight` read from the element
  matching `[aria-current="page"]`), never from hard-coded row heights.
- Re-measure in `useLayoutEffect` keyed on current path and rail state.
- Correctness details: first placement must NOT animate (armed only after a
  `requestAnimationFrame` post-layout), so arriving on a page shows selection
  already in place; only a user-authored change animates. Moving between
  pages must read as one object travelling, not one box blinking out and
  another blinking in.

### Animated nav icons
- Icon components expose an imperative handle (start/stop animation).
- Wire HOVER on the whole row to the icon: spread `onMouseEnter/onMouseMove/
  onMouseLeave/onFocus/onBlur` handlers on the row; the icon inside holds the
  ref and plays/resets on those events. Focus must animate on keyboard focus.
- If the icon library lacks a handle (e.g. lucide, heroicons), wrap it: build
  a small `AnimatedIcon` that plays a tasteful keyframe (draw/pulse/tilt/
  wiggle — one motif per site, not per icon) and exports start/stop via ref.
  Icons inherit `currentColor`; stroke weight consistent (~2.25).

### Top bar
- Left: drawer/hamburger button (mobile only), identity/context chip (hidden
  below sm), live status.
- Right: derived notifications bell (items DERIVED from app state — approvals
  waiting, warnings, completions — ordered by cost-to-miss, newest handled
  last), unread dot logic, avatar/account. Every chip: white surface, tiny
  shadow, rounded ~15px, sits on the tray.
- All top-bar data must come from the site's real state/hooks (reuse existing
  hooks in ENHANCE mode); mock clearly-labeled placeholders otherwise.

### Command palette (⌘K)
- Context provider + open state shared with the sidebar search row; Escape
  layer closes; palette lists pages + commands; reachable by keyboard
  everywhere.

### Tokens & shapes
- One accent family exposed as CSS variables (accent, accent-lit, accent-soft,
  accent-wash) so hover states can tint toward the accent without new colors.
- Ink text ~#141414; muted ~45% alpha; tray neutral; white panels with very
  small shadows (e.g. `0 1px 2px rgb(ink / 0.06)`);
- Radii escalate with size: icons 8-13, rows/chips 13-15, drawer/panels 20.
- Buttons keep min touch target (40px+); focus-visible gets a visible ring
  in the accent.

## Phase D — Build order (verify each stage before the next)

1. Tokens + tray frame + responsive shell skeleton (drawer vs column).
2. Sidebar structure: groups, rows, rail mode, active state.
3. Travelling pill (with the no-first-anim arming).
4. Icon animation wiring (hover + focus).
5. Top bar (drawer button, identity, bell, avatar) wired to real state.
6. Command palette.
7. A11y pass: drawer focus-trap/inert/focus-return, aria-current paging,
   Escape layers, reduced-motion (transitions off), mobile touch targets.
8. Responsive pass at 375/767/1024/1440 widths; check the rail, the drawer,
   and that `main` never clips.

## Phase E — Deliverables & discipline

- Components: Frame/AppShell, Sidebar (+ NavRow, travelling pill), TopBar,
  CommandPalette, AnimatedIcon wrapper, token sheet. One tokens/design file
  holding every per-site value (palette, nav spec, top bar data sources) so
  re-theming touches only it.
- ENHANCE mode: diff-style report of what was kept vs restyled; no data
  plumbing rewritten.
- State clearly which parts are hand-tuned per site (nav spec, notification
  derivation, accent discipline) vs machinery identical across projects.
