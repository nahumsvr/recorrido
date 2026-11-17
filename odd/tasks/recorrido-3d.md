# Feature: recorrido-3d

Objective: first-person 3D walkthrough of the UAQ Informatics auditorium with AP overlay, minimap and teleports.
Branch: `feat/phase-1-model-viewer` (one branch per phase) · Delivery: ask-on-risk · Test runner: Vitest (unit), browser pane / Playwright (e2e).

## Specs

- S1 Load `auditorio.stl` (meters, SketchUp Z-up), convert axes to three.js Y-up, align to plan coordinates "desde la esquina interior noroeste de canchas: X hacia el este, Y hacia el sur, h = altura de montaje".
- S2 Visual reading without materials: color by face orientation/height, floor distinct from walls, hemisphere + directional light, marked edges.
- S3 Walk: "WASD y mouse con pointer lock", mobile "joystick táctil y arrastre para mirar", "Altura de ojos de 1.65 m, con gravedad", "Colisión contra muros", "Poder subir gradas, escaleras y rampas".
- S4 APs AP01…AP14 from the design table (no `aps.stl`): highlight + floating label; "Al acercarme o hacer clic, un panel con su información: modelo, zona y altura"; toggle for semi-transparent coverage sphere/circle.
- S5 Minimap with position, heading and APs.
- S6 Teleports: "entrada D05, centro de canchas, gradas, escenario, gym, oficinas, cuarto de redes".
- S7 Smooth on a normal laptop and on mobile; static deliverable (Vite → `dist/`, optional single HTML).

## Tasks

| ID | Specs | Route | Status | Evidence |
|---|---|---|---|---|
| T1 Phase 1: model loads and is readable, `?debug=align` | S1, S2, S7 | inline | done | 20 unit tests green; build OK; browser: loads, no console errors, readout exact at (22.90, 12.35) and (45.50, 10.00) |
| T2 Phase 2: first-person walk + collisions | S3 | inline | done | 34 unit tests (wall, 0.30/0.50 steps, 30°/45° ramps, stairs down, hole respawn, safety floor, roof-safe teleport); browser: north wall stop Y 0.30, stage edge stop X 45.33, stands climbed by jumping to h 3.77, W held 1 s = 1.40 m |
| T3 Phase 3: APs, labels, panel, coverage | S4 | inline | done | 41 unit tests (wall mounting, selection, AP table, report AP-wall distances); browser: proximity panel at AP01 (3.7 m), click pins AP06 with warning, floor + sphere coverage clipped to building |
| T4 Phase 4: minimap + teleports | S5, S6 | inline | done | 53 unit tests incl. teleports and walking against the real GLB; browser: Stage button → (50.40, 12.00, h 1.18) on ground, minimap arrow/APs correct |
| T5 Phase 5: mobile controls + optimization + single-file build | S3, S7 | inline | done | 57 unit tests; mobile emulation: joystick 0.96 m/s at 40 px, tap pins AP12, drag rotates, jump +0.52 m; 5–9 draw calls / ~39k tris; dist 1.1 MB, dist-single 1.25 MB (418 KB gz) with 0 external requests. Real-device FPS not measured (pane caps ~30 fps) |

## Log

- L1 (2026-11-16) Original request: plan a first-person "game-like" 3D walkthrough of the auditorium from `auditorio.stl` (see plan file `~/.claude/plans/pasted-content-id-ca63-quiero-que-modular-hamming.md`). Plan approved.
- L2 STL inspection: 523,583 triangles; 95% are stage props inside STL box x 19–25.3, y 7.5–10.7, z 1.1–2.7. Building after cleanup: 26,893 triangles; props simplified 490,815 → 11,690; GLB 359 KB.
- L3 Alignment decided from wall planes: outer walls 55 × 32.6 m, 0.20 m thick. Origin = inner faces of west (x_stl −28.34) and north (y_stl 11.36) walls. Checks: inner east wall X=54.60, inner south wall Y=32.20, stands front Y=24.70 (exact), stage edge X=45.63 (plan says ~45.8, 0.17 m short). Extra 4.2 m in STL Y = annex south of the south wall (plan Y 32.4–36.6, X≈4.2–38.3, h ≤ 3.7).
- L4 Offices block found at X 42.5–50.7, Y 24.7–31.0, h 0–3.9 (contains AP14). Gym not identified as a floor slab yet.
- Open questions: stage props keep/remove; D05 and network room coordinates; stand aisles/stairs modeled?; gym floor height and access.
- L5 (phase 2) Controller = raised capsule (walls, bottom at feet + maxStep 0.35) + 5 downward probe rays (ground, step snap, slopes > 40° rejected). Real model: central aisle through the stands at X 19–23.5 opens to the south annex (likely main entrance); stand risers are 0.8 m (first) then 0.5 m, so stands are climbed by jumping (jump 3.6 m/s); stage (h 1.2) has no modeled stairs, so it is not reachable yet — teleport in phase 4. Embedded browsers deny pointer lock: drag-to-look fallback added.
- L6 (2026-11-16) User: "el escenario si tiene escaleras, continúa con lo demás". Verified: two stair runs at X 45.7–47, north (Y 1.0→3.0) and south (Y 23.5→21.5), risers 0.131 m, both walkable to h 1.18. South foot has only ~0.5 m clearance to the offices wall (Y 24.5).
- L7 (phase 3) AP wall distances in the model: AP01–05 0.40 m, AP08–11 0.20 m, AP12 0.00 m, AP13 0.19 m (oblique surface); AP06 and AP07 have no wall within 3 m, AP14 is 1.18 m away. Markers snap to the wall within 0.6 m; the other three are drawn at the table position with a warning in label and panel. Pending user confirmation of real mounting spots (test KNOWN_UNMOUNTED).
- L8 (phase 4) No gym level exists above the stage north end in the model (only the stage floor, h 1.18): "Gym" teleport lands on the stage under AP13. D05 and network room teleports are disabled until coordinates arrive. Minimap background is baked once from an orthographic top-down render (roof cut).
- L9 (phase 5) Touch controls (floating joystick left, drag look right, tap pick, jump button), HUD collapsible on narrow screens, pixel ratio ≤ 1.25 and edges off on touch. Fixed: OrbitControls constructor re-aimed the spawn camera. Single-file build verified via vite preview (file:// blocked in the embedded browser). Pending: FPS on a real laptop/phone; D05 and network room coordinates; AP06/AP07/AP14 mounting spots.
