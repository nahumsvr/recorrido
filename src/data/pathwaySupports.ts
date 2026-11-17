import { planStraps, planSupports, spacingFor, type Probe, type Support } from '../domain/supports.ts';
import { attachPoint, junctionsOf, pathLength, type Pathway } from './cabling.ts';

/**
 * Everything that holds a pathway to the building. EMT and RMC are held by conduit straps: one near each box and
 * termination and one every 3 m (NEC 358.30). Trays, raceways and plastic channel keep brackets and rods.
 */
export function supportsOf(w: Pathway, probe: Probe): Support[] {
  if (w.kind !== 'emt' && w.kind !== 'rmc') return planSupports(w.points, probe, spacingFor(w.kind));
  const boxes = [0, pathLength(w.points), ...junctionsOf(w.id).map((j) => attachPoint(w, j.at).along)];
  return planStraps(w.points, boxes, probe);
}
