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
| T3 Phase 3: APs, labels, panel, coverage | S4 | inline | pending | |
| T4 Phase 4: minimap + teleports | S5, S6 | inline | pending | |
| T5 Phase 5: mobile controls + optimization + single-file build | S3, S7 | inline | pending | |

## Log

- L1 (2026-11-16) Original request: plan a first-person "game-like" 3D walkthrough of the auditorium from `auditorio.stl` (see plan file `~/.claude/plans/pasted-content-id-ca63-quiero-que-modular-hamming.md`). Plan approved.
- L2 STL inspection: 523,583 triangles; 95% are stage props inside STL box x 19–25.3, y 7.5–10.7, z 1.1–2.7. Building after cleanup: 26,893 triangles; props simplified 490,815 → 11,690; GLB 359 KB.
- L3 Alignment decided from wall planes: outer walls 55 × 32.6 m, 0.20 m thick. Origin = inner faces of west (x_stl −28.34) and north (y_stl 11.36) walls. Checks: inner east wall X=54.60, inner south wall Y=32.20, stands front Y=24.70 (exact), stage edge X=45.63 (plan says ~45.8, 0.17 m short). Extra 4.2 m in STL Y = annex south of the south wall (plan Y 32.4–36.6, X≈4.2–38.3, h ≤ 3.7).
- L4 Offices block found at X 42.5–50.7, Y 24.7–31.0, h 0–3.9 (contains AP14). Gym not identified as a floor slab yet.
- Open questions: stage props keep/remove; D05 and network room coordinates; stand aisles/stairs modeled?; gym floor height and access.
- L5 (phase 2) Controller = raised capsule (walls, bottom at feet + maxStep 0.35) + 5 downward probe rays (ground, step snap, slopes > 40° rejected). Real model: central aisle through the stands at X 19–23.5 opens to the south annex (likely main entrance); stand risers are 0.8 m (first) then 0.5 m, so stands are climbed by jumping (jump 3.6 m/s); stage (h 1.2) has no modeled stairs, so it is not reachable yet — teleport in phase 4. Embedded browsers deny pointer lock: drag-to-look fallback added.
