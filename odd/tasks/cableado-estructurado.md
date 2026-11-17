# Feature: cableado-estructurado

Objective: structured cabling plan (pathways, penetrations, device runs, compliance) for 15 APs, 7 cameras and the audio system, drawn in the 3D model.
Branch: `feat/model-aps` · Delivery: ask-on-risk · Test runner: Vitest (unit, includes ray checks against the real GLB).

## Specs

- S1 "quiero que hagas todo lo del cableado estructural, para las cámaras, aps, y el audio, que cumpla las rejas [reglas]" — plan covers the 15 model APs, the 7 cameras and the audio; it must follow the applicable standards (TIA-568.2 90 m permanent link, TIA-569 pathways, TIA-607 bonding, NOM-001-SEDE power separation).
- S2 "dime si necesitas hacer hoyos en la pared, o vas a usar tubos o bandejas, etc" — list every wall / slab penetration (position, size, firestop) and which pathway type serves each area (tray, conduit, raceway).
- S3 From earlier turns (still valid): the model is the source of truth; audio L must not cross the aisle mouth on the floor ("para que no lo puedan pisar"); audio cable passes the offices wall at h 3.0 m (raised from 2.7 m after the model showed a post up to h 2.9 m).
- S4 (assumption) "reglas" means the standards/regulations, not "rejas" (grilles).

## Tasks

| ID | Specs | Route | Status | Evidence |
|---|---|---|---|---|
| T1 Model probe: walls, doors, voids along the routes | S1, S2 | inline | done | ray scans: doors in south wall at X 7.0-8.0, 14.4-15.4, 27.1-28.1, 34.5-35.4 (lintel 2.3); aisle opening X 16.6-25.8 clear to h 2.8; walls 0.2 m thick |
| T2 Pathway + penetration data, device routes | S1, S2 | inline | done | `src/data/cabling.ts`: 19 pathways, 7 penetrations (13 sleeves), 22 device routes; max link 89.6 m (M04) |
| T3 Compliance and crossing tests | S1 | inline | done | `tests/unit/cabling.test.ts`: crossings only at declared penetrations, audio crosses none, drops clear, links ≤ 90 m, fill ≤ 50% / 40%; 145 tests green |
| T4 3D trays/conduits + HUD | S2 | inline | done | browser: north-wall tray with drops to M03/M04, annex tray with drop to M13; HUD toggles Cabling |
| T5 Chapter, penetration list, budget; commit | S1, S2 | inline | done | memoria §5 rewritten; total $1,272,879.81 (79.55%) |

## Log

- L1 (2026-11-17) Original request: "ahora quiero que hagas todo lo del cableado estructural, para las cámaras, aps, y el audio, que cumpla las rejas, y dime si necesitas hacer hoyos en la pared, o vas a usar tubos o bandejas, etc"
- L2 (2026-11-17) Model probe: south wall has doors at X 7.0-8.0, 14.4-15.4, 27.1-28.1, 34.5-35.4 (lintel 2.3) and the aisle opening X 16.6-25.8 (clear to h 2.8, wall above); room west wall at X 12.19-12.39; void back corridor open for Y >= 31 (partitions end before); offices west wall X 42.48-42.68; offices north wall Y 24.5-24.7; a post at X 46.4-46.7 on the stage edge reaches h 2.9 (audio run raised to h 3.0).
- L3 Design: route is a single star from the rack; north-wall APs M03/M04 are the limit (M04 89.6 m). Penetrations: PEN-1 room west wall, PEN-2 slab core, PEN-3 room south wall, PEN-4 south wall, PEN-5/PEN-7 offices west wall, PEN-6 offices north wall.
