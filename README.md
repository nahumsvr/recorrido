# Auditorium walkthrough

First-person 3D walkthrough of the Facultad de Informática (UAQ) auditorium, built from a SketchUp STL export, with the 14 Wi-Fi access points, a minimap and teleports. Static site: no server code.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install pinned dependencies |
| `npm run prepare-model` | `auditorio.stl` → `src/assets/auditorio.glb` + `model-report.json` (run after changing the STL or `src/config/alignment.ts`) |
| `npm run dev` | Dev server on http://localhost:5173 |
| `npm test` | Unit tests (includes checks against the real prepared model) |
| `npm run build` | Static site in `dist/` (HTML + JS + GLB) |
| `npm run build:single` | One self-contained `dist-single/index.html` (model inlined, ~1.3 MB) |

Useful URL options: `?debug=align` (plan grid on start), `?touch=1` (force touch controls).

## Controls

| Desktop | Phone / tablet |
|---|---|
| Click to start, mouse to look (drag to look where pointer lock is blocked, e.g. inside an iframe) | Left thumb: floating joystick (push fully to run) |
| WASD / arrows move, Shift run, Space jump | Right thumb: drag to look |
| E: info of the AP under the crosshair or the nearest one | Tap an AP for its info |
| M: toggle minimap · Esc: release the mouse | Jump button |

The AP panel also opens on its own within 4 m of an AP. The HUD has the inspection (orbit) view, roof cut, edges, the "Go to" teleports and the AP group with its show / coverage (spheres, floor) toggles. The design-table APs (AP01–AP14) are no longer drawn; their data stays in `src/data/aps.ts` for the model build script and the `?debug=align` overlay.

- **Model APs** (violet, M01–M19): the black AP devices placed in the SketchUp model, detected automatically by `npm run prepare-model` (body 0.20 × 0.16 × 0.03 m). Numbering walks the building: north wall, west wall, stands, annex, offices, stage.

## Security camera monitor

The network room desk has a monitor. Walk up to it and press **E** (or tap it) for a full-screen view of the security cameras: ◀ ▶ buttons, the numbered chips, or ← → / A D to switch, **Esc** or **E** to leave. Each view is rendered from the camera's lens position with the **datasheet horizontal FOV** of its lens (VIGI C240I: 2.8 / 4 mm; C340I: 2.8 / 4 / 6 mm; source: TP-Link/Omada spec pages, checked 2026-11-16) in a 16:9 stream, with an on-screen display: camera name, live date and time, REC, model, lens, resolution, codec, fps, IR range and protection rating. The vertical angle is derived from the 16:9 image (datasheet vertical angles include lens distortion that a rectilinear render cannot reproduce). The "View cones" toggle draws the same FOV as a pyramid.

### Editing camera positions

HUD → Cameras → **Edit cameras** opens a panel. Click a camera (or pick it in the list), then click a wall to move it there, or type X / Y / H; change pan, tilt, lens and type (dome / bullet). Edits are saved in this browser (`localStorage`) and survive reloads. **Save to project** (only with `npm run dev`) writes them to `src/data/cameraOverrides.json`, which is committed and is the permanent source; **Export JSON** copies the same data. **Reset camera / Reset all** go back to the last saved project values. Order of precedence: code defaults (`src/data/cameras.ts`) < project file < this browser's edits. A live preview of what the selected camera sees (datasheet FOV, 16:9) sits next to the panel and updates as you edit. Cameras mount on walls only (no ceiling mount yet).

## Audio

Four JBL EON715 on the front face of the stands (first riser, Y 24.7), two per stand (west X 4.5 / 13.0 on line L, east X 30.0 / 38.5 on line R), facing the seated audience and tilted 42° up. Each XLR line (R red, L blue) lies in its own steel conduit: EMT ¾" above 2 m and rigid conduit (RMC) ¾" below it and along the foot of the stands, 2.5 cm off the wall and held by straps. Both leave the panel along the offices wall at h 3.0 m to the east stand corner. R (east stand) comes down and follows the foot of that stand; L (west stand) climbs to h 6.6 m, crosses over the back wall and the aisle gap, and comes down at the west end to the foot of the west stand, so nothing crosses the aisle mouth on the floor (`src/data/audio.ts`, `src/world/audio.ts`). The operator table on the stage (floor h 1.18, centered at X 47.6, Y 24.2, against the offices wall) has a fixed wall panel (2 XLR + outlet); the Yamaha MG12XU is portable and plugs into it with two patch cables. HUD → Audio: "Speakers and cables" and "Mixer on the table" (untick it to see the panel with the mixer stored away).

## Structured cabling

HUD → Cabling draws the data pathways of the plan: EMT conduit lying on the walls (2–3 cm off the face) everywhere the public or the balls can reach — back wall, risers, west and north walls, stage side, the M17 / M18 branches along the top of their walls — wire-basket tray only in the annex, plastic raceway in dry interiors, 2"/4" rigid sleeves through the walls (4 wall holes in orange: the rack room, the offices, and the two exterior cameras CAM17 and CAM18), the north IDF cabinet (top at 5.6 m, under the north conduit) and thin drops to each AP and camera. "Supports" shows what holds each run: conduit straps (one within 0.9 m of every box and one every 3 m at most, NEC 358.30 / 344.30), brackets and rods for tray and plastic. Click a pathway, drop, sleeve, the cabinet or an audio run for its card (size, fill, supports, standards). The rooms under the stands are restrooms and locker rooms, so no route goes through them: cables reach the courts through the aisle opening, up its piers and along the back wall (`src/data/cabling.ts`, `src/data/pathwaySupports.ts`, `src/domain/supports.ts`, `src/world/cabling.ts`, `src/world/supports.ts`, `src/domain/dropRouting.ts`). Unit tests ray-cast every pathway against the real model: the only solids a data pathway crosses are the declared penetrations, audio crosses none, permanent links stay ≤ 90 m, conduit / tray fill stays within TIA-569 limits, every conduit run keeps ≤ 360° of bends between boxes and every strap finds a wall. The full chapter (penetration list, per-device runs, compliance matrix, budget) is in `docs/memoria-tecnica-adaptada.md`.

## Where the data lives

- `src/config/alignment.ts`: STL → plan alignment (origin = inner north-west corner of the courts) and reference dimensions.
- `src/data/aps.ts`: AP table (plan X east, Y south, mounting height h, zone).
- `src/assets/model-aps.json`: generated list of model APs (position, wall or ceiling mount, zone). Do not edit by hand; move the devices in SketchUp, re-export and run `npm run prepare-model`.
- `src/data/cameras.ts` / `src/data/cameraOverrides.json`: camera defaults and the saved edits; `src/data/projectCameras.ts` applies the saved edits for cabling and the report (11 cameras: CAM15 watches the audio mixer, CAM16 the network room, CAM17 and CAM18 are exterior, at the west corners).
- `src/data/cabling.ts`: pathways (EMT, RMC, tray, plastic, sleeves), penetrations, junction boxes and the route of every AP / camera; `src/data/pathwaySupports.ts` and `src/domain/supports.ts`: straps and brackets; `src/data/infoCards.ts`: the click cards.
- `src/data/audio.ts`: speakers, operator table, wall panel and audio cable runs.
- `src/data/teleports.ts`: teleport destinations; `position: null` shows the button disabled.

Coordinates everywhere are plan meters: a plan point (X, Y, h) is `new Vector3(X, h, Y)` in three.js.

## Known gaps (2026-11-16)

- The gym level is not modeled; the "Gym" teleport lands on the stage under AP13.
- Coverage spheres are a fixed 15 m radius drawing, not an RF simulation.
