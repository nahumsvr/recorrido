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

The AP panel also opens on its own within 4 m of an AP. The HUD has the inspection (orbit) view, roof cut, edges, the "Go to" teleports and two independent AP groups, each with its own show / coverage (spheres, floor) toggles:

- **Table APs** (cyan, AP01–AP14): coordinates from the design table.
- **Model APs** (violet, M01–M19): the black AP devices placed in the SketchUp model, detected automatically by `npm run prepare-model` (body 0.20 × 0.16 × 0.03 m). Numbering walks the building: north wall, west wall, stands, annex, offices, stage.

## Where the data lives

- `src/config/alignment.ts`: STL → plan alignment (origin = inner north-west corner of the courts) and reference dimensions.
- `src/data/aps.ts`: AP table (plan X east, Y south, mounting height h, zone).
- `src/assets/model-aps.json`: generated list of model APs (position, wall or ceiling mount, zone). Do not edit by hand; move the devices in SketchUp, re-export and run `npm run prepare-model`.
- `src/data/teleports.ts`: teleport destinations; `position: null` shows the button disabled.

Coordinates everywhere are plan meters: a plan point (X, Y, h) is `new Vector3(X, h, Y)` in three.js.

## Known gaps (2026-11-16)

- AP06, AP07 and AP14 are not next to a wall in the model; they are drawn at their table position with a ⚠ warning.
- The gym level is not modeled; the "Gym" teleport lands on the stage under AP13.
- Coverage spheres are a fixed 15 m radius drawing, not an RF simulation.
