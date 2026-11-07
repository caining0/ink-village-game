# Ink Village Implementation Plan
> Execute inline with superpowers:executing-plans.
**Goal:** Deliver playable chapter one with infinite enemy respawns.
**Architecture:** Buildless browser ES modules: combat.mjs for deterministic state, scene.js for world and actors, main.js for input/render/UI. Three.js rendering and Cannon collision based on Video2Game.
**Tech Stack:** Three.js 0.140, Cannon 0.6, native JavaScript.
**Spec:** docs/superpowers/specs/2026-11-06-ink-village-design.md
## Global Constraints
Original ink-style geometry; no claim of trained reconstruction; MIT attribution retained. Unlimited total spawns, limited simultaneous enemies for performance.
## Review Focus
Pause freezes simulation; tab switch releases keys; death allows recovery; enemies stay inside arena; chapter completion does not stop spawns.
## Tasks
- [ ] Add failing combat tests: enemy defeat only once, cap concurrent enemies, refill after defeat indefinitely, invulnerability, chapter eligibility, restart.
- [ ] Implement combat.mjs and pass node --test tests/combat.test.mjs.
- [ ] Build scene.js: layered mountain fog, bridge, village houses, pines, shrine, bell, swordsman, bandits; Cannon collision adapter and attribution.
- [ ] Build main.js and UI: input, chase AI, telegraphed attacks, hit/dodge effects, quest/dialogue/completion, audio and touch controls.
- [ ] Browser-test start, movement, combat, respawn, pause and reset; syntax-check modules; package and publish private Site.
