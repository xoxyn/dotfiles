---
name: Three Scroll World
description: Build a scroll-driven interactive 3D landing experience where the page scroll moves a cinematic camera through a persistent 3D world behind the DOM content. Use this skill whenever the user wants a "3D world you scroll into" — a city/village/planet/terrain scene that stays fixed while scrolling, scroll-linked camera moves through 3D space, or an interactive landing page using three.js, React Three Fiber, or drei. Also use for adapting an existing scroll-3D experience to a new theme, palette, or asset kit.
---

# Three Scroll World

## Role

Build a landing experience where a persistent 3D scene sits BEHIND the scrolling
DOM and scrolling moves a cinematic camera through the world. The world never
scrolls — only the camera travels. Learning rule: the pipeline is fixed
machinery; only the design tokens below change per site.

## Step 1 — Interview (mandatory before coding)

Collect these tokens from the user. Ask only for what is missing; propose
sensible defaults for the rest and get confirmation:

1. Theme/mood — e.g. cozy paper town, neon night city, pastel valley.
2. Art style + asset source — must be CC0 or properly licensed
   (e.g. KayKit City Builder Bits, Quaternius kits, Kenney). Prefer 5–10 base
   shapes reused everywhere over many unique models.
3. Palette (5–8 hex) — ink, paper/background, 1–2 rations-restricted accents,
   ground/street tones. Which elements get the accent color?
4. Lighting mood — bright warm sun + soft shadows / cool moonlight / sunset rim.
5. Chapters — list/number of DOM sections; one authored camera shot per chapter.
6. Explore mode wanted? (free orbit + clickable elements after scroll ends.)
7. Framework — Next.js or other (React: use React Three Fiber; non-React:
   vanilla three + a scroll-animation library, same architecture).

## Step 2 — Core architecture (NEVER vary this across sites)

1. Two layers:
   - A `<Canvas>` in a container with `position: fixed; inset: 0; z-index: 0`
     behind the page; `pointer-events: none` while scrolling. DOM content
     scrolls over it at a higher z-index.
2. Scroll → progress:
   - `useScroll({ target: storyContainer, offset: ['start start', 'end end'] })`.
   - Smooth: `useSpring(scrollYProgress, { stiffness: 88, damping: 28,
     restDelta: 0.0005 })`.
3. Pass the smoothed MotionValue as a prop INTO scene components. Inside
   `useFrame`, read `progress.get()`. NEVER put scroll progress into React
   state — the frame loop samples it; React must not re-render per scroll.
4. Authored camera keyframes. N poses (one per chapter):
   `{ target: [x,y,z], distance, elevation (deg), yaw (deg), fov, fogNear,
   fogFar, fogColor }`.
   - Per frame: `p = clamp(progress, 0, 1)`; `segment = p * (N - 1)`; lerp the
     bracketing poses with smoothstep blending.
   - Pose position computed spherically around target:
     `position = target + (sin(yaw)*cos(el), sin(el), cos(yaw)*cos(el)) * distance`.
   - Lerp fov, fog near/far, fog color, AND light intensities per chapter
     (one array-per-light interpolation helper).
5. Background hex, canvas clear color, fog color, and ground plane color must be
   the SAME value — the world then has no visible edge.

## Step 3 — The world (adaptable per theme)

1. Procedural layout from a SEEDED RNG (mulberry32-style), so the layout is
   deterministic across reloads and SSR/client hydration.
2. Use `<instancedMesh>`, one draw call per distinct asset shared across every
   placement; bake world transforms into cloned geometry, then normalize each
   model: centered, grounded at y=0, scaled to a target footprint.
3. Life through motion, not detail:
   - Moving agents (vehicles/creatures/particles) on simple loops — implement
     by updating instance matrices per frame, including heading from the loop
     direction and a perpendicular lane offset.
   - Slow drifting elements (clouds etc.) whose main job is a soft moving
     shadow over the scene.
4. Interpolated light rig: one key directional light (2048 shadow map, tight
   ortho frustum, tuned bias), hemisphere light, 1–2 colored fill/rim lights.
   Intensities follow the chapter interpolation from Step 2.4.

## Step 4 — Explore mode (if requested)

1. Trigger: button/hold interaction or the final chapter CTA.
2. Phase machine: `narrative → entering → explore → exiting`.
3. Enter: lock page scroll (`overflow: hidden`), spring the camera to the orbit
   pose (spring position, target, and fov independently), then enable drei
   `<OrbitControls>` (damping, min/max distance, min/max polar angle, pan
   disabled). Interactive elements are clickable ONLY in explore mode.
4. Exit: spring back to the narrative pose at the current scroll pose, restore
   scroll position, re-enable scrolling.

## Step 5 — Engine & rendering config

- three + @react-three/fiber + @react-three/drei; motion (or framer-motion) for
  the scroll plumbing. Canvas: antialias, `alpha:false`,
  `powerPreference: 'high-performance'`, sRGB output, ACESFilmic tone mapping
  (exposure ≈ 1.1), PCF shadows, `dpr` clamped to `[1, 2]`.
- Adaptive quality: rolling-average frame time with two windows (fast ~60
  frames, slow ~180); sustained >20ms → drop one dpr tier from `[1, 1.5, 2]`;
  sustained <14ms → step up; 5s cooldown between changes. Never rebuild the
  scene for a quality change — only pixel density changes.
- Preload all glTF assets with `useGLTF.preload` at module scope.

## Step 6 — Loading polish

1. Show a light DOM placeholder in the page palette (never a spinner) over the
   scene immediately.
2. Suspense around the world; report ready after the FIRST RENDERED frame of the
   loaded world, then fade the placeholder out (~200ms) revealing that exact
   frame — no swap pop.
3. Error boundary + static 2D fallback representation if WebGL fails.

## Step 7 — Accessibility & responsiveness

1. Respect `prefers-reduced-motion`: snap to discrete pose keyframes, disable
   ambient motion, skip spring smoothing, reduce dpr ceiling.
2. Scale camera distance by viewport width (e.g. ×1.16 under 720px, ×1.08
   under 1180px) instead of moving poses.
3. Canvas is decorative (`aria-hidden`) in scroll mode; keyboard-accessible
   explore entry; Escape exits explore mode; chapter indicator driven by the
   same scroll progress.

## Build order (verify each stage renders before the next)

1. Tokens file (palette, poses, light presets, asset list) — see Step 1 answers.
2. Fixed canvas + DOM chapters + camera rig driven by scroll.
3. World generation + instancing.
4. Ambient motion (loops, drifting shade).
5. Explore mode (if wanted).
6. Loading polish, adaptive quality, a11y, mobile checks.

## Deliverables

- Self-contained components: page/story, canvas wrapper, world, camera
  director, quality/loading utilities.
- ONE tokens/design file at the top holding every per-site value, clearly
  separated from the machinery files, so a future re-theme touches only it.
- Tell the user which values are hand-tuned per site (the camera poses table is
  the hard part — always iterate on it in the browser) vs machinery that stays
  identical across projects.
