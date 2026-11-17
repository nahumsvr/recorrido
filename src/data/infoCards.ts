import { AUDIO_RUNS, FLOOR_CONDUIT, FLOOR_RUN_H, FRONT_ROW_EAR, BACK_ROW_EAR, MIXER_MODEL, SPEAKERS, STAND_FRONT_Y, floorRunLengthM } from './audio.ts';
import {
  DEVICE_ROUTES,
  FREE_SPANS,
  IDF,
  MAX_DROP_M,
  OM3_MAX_M,
  PATHWAYS,
  PENETRATIONS,
  backboneFiberM,
  cablesOn,
  carriesFiber,
  junctionsOf,
  pathLength,
  type PathwayKind,
} from './cabling.ts';
import { PROJECT_CAMERAS } from './projectCameras.ts';
import { MODEL_ACCESS_POINTS } from './modelAps.ts';
import { MIN_SOLID_M, EMT_SPACING_M, spacingFor, type SupportStats } from '../domain/supports.ts';

/** Supports counted by the 3D model, by pathway id. */
export type SupportIndex = ReadonlyMap<string, SupportStats>;

/** What a click on the cabling or audio hardware can resolve to. */
export type InfoTarget =
  | { readonly type: 'pathway'; readonly id: string }
  | { readonly type: 'drop'; readonly id: string; readonly blocked?: boolean }
  | { readonly type: 'sleeve'; readonly id: string }
  | { readonly type: 'idf' }
  | { readonly type: 'speaker'; readonly id: string }
  | { readonly type: 'audio'; readonly line: 'L' | 'R' };

/** `pass`: cumple. `fail`: no cumple (todavía). `check`: especificado, falta verificar en obra. */
export type Verdict = 'pass' | 'fail' | 'check';

export interface InfoCheck {
  readonly standard: string;
  readonly verdict: Verdict;
  readonly detail: string;
}

export interface InfoCard {
  readonly kind: string;
  readonly title: string;
  readonly subtitle: string;
  readonly specs: readonly (readonly [string, string])[];
  readonly checks: readonly InfoCheck[];
}

/** Cat6 U/UTP outer diameter used for the fill calculations (the report's 6% figure). */
export const CAT6_OD_MM = 7;
/** Fill limits once the 25% growth allowance is counted: tray 50 %; conduit 53 / 31 / 40 % for 1 / 2 / 3+ cables (NEC Ch. 9, secondary sources); plastic raceway 40 %. */
function fillLimit(kind: PathwayKind, cables: number): number {
  if (kind === 'tray') return 0.5;
  if (kind === 'emt' || kind === 'rmc' || kind === 'conduit') return cables <= 1 ? 0.53 : cables <= 2 ? 0.31 : 0.4;
  return 0.4;
}
const GROWTH = 1.25;
export const PERMANENT_LINK_MAX_M = 90;
const ceil1 = (n: number): string => n.toFixed(1);
const pct = (n: number): string => `${(n * 100).toFixed(n < 0.1 ? 1 : 0)} %`;

const check = (standard: string, verdict: Verdict, detail: string): InfoCheck => ({ standard, verdict, detail });

const LABELING = check('ANSI/TIA-606 (etiquetado)', 'pass', 'Identificador único de la trayectoria, el mismo de la memoria técnica.');
const BEND_RADIUS = check('ANSI/TIA-569 (radio de curvatura)', 'check', 'Cat6 ≥ 4× Ø (≈ 28 mm), curvas de EMT ≥ 6× Ø: se define en el procedimiento de tendido.');
const BONDING = check('ANSI/TIA-607 (puesta a tierra)', 'check', 'Puente de unión en cada junta de bandeja a la barra de tierra: especificado, no modelado.');

/** Brackets and hangers of a run: what holds it, and whether every one found a surface to anchor to. */
const SUPPORT_STANDARD: Partial<Record<PathwayKind, string>> = {
  emt: 'NOM-001-SEDE art. 358.30 (soportes de EMT)',
  rmc: 'NOM-001-SEDE art. 344.30 (soportes de tubo rígido)',
  plastic: 'Fabricante / NEC art. 388 (fijación de canaleta)',
};

function supportCheck(stats: SupportStats | undefined, spacingM: number, kind: PathwayKind = 'tray'): InfoCheck | null {
  if (!stats) return null;
  const standard = SUPPORT_STANDARD[kind] ?? 'NOM-001-SEDE art. 392.30 / TIA-569 (soportes)';
  if (stats.none > 0) {
    return check(standard, 'fail', `${stats.none} de ${stats.total} soportes no encuentran superficie donde anclar (marcados en rojo en el modelo).`);
  }
  if (stats.thin > 0) {
    return check(standard, 'check', `${stats.thin} de ${stats.total} soportes anclan a una placa de menos de ${MIN_SOLID_M * 100} cm (en ámbar): confirmar que es estructural.`);
  }
  if (kind === 'emt' || kind === 'rmc') {
    return check(standard, 'pass', `${stats.total} abrazaderas: una a ≤ 0.9 m de cada caja o extremo y una cada ≤ ${spacingM} m, sobre muro sólido (≥ ${MIN_SOLID_M * 100} cm). Solo las que pide la norma.`);
  }
  return check(standard, 'pass', `${stats.total} soportes cada ≤ ${spacingM} m, anclados a muro o techo sólido (≥ ${MIN_SOLID_M * 100} cm). Separación final según la tabla del fabricante.`);
}

const hRange = (points: readonly { h: number }[]): string => {
  const hs = points.map((p) => p.h);
  const lo = Math.min(...hs);
  const hi = Math.max(...hs);
  return lo === hi ? `${ceil1(lo)} m` : `${ceil1(lo)}–${ceil1(hi)} m`;
};

const KIND_LABEL: Record<PathwayKind, string> = {
  tray: 'Bandeja de malla',
  conduit: 'Manga de acero rígido',
  raceway: 'Canaleta',
  emt: 'Tubo conduit metálico (EMT)',
  rmc: 'Tubo conduit rígido de acero (RMC)',
  plastic: 'Canaleta plástica superficial',
};

function pathwayCard(id: string, supports?: SupportIndex): InfoCard | null {
  const w = PATHWAYS.find((x) => x.id === id);
  if (!w) return null;
  const physical = w.physical ?? w.id;
  const copper = cablesOn(physical);
  const fiber = carriesFiber(physical);
  const cables = copper + (fiber ? 1 : 0);
  const section = w.kind === 'tray' || w.kind === 'plastic' ? w.widthMm * w.depthMm : Math.PI * (w.widthMm / 2) ** 2;
  const fill = (cables * Math.PI * (CAT6_OD_MM / 2) ** 2) / section;
  const limit = fillLimit(w.kind, cables * GROWTH);
  const fillName = w.kind === 'tray' ? 'charola' : w.kind === 'plastic' ? 'canaleta' : 'ducto';
  const checks: InfoCheck[] = [
    check(
      `ANSI/TIA-569 (llenado de ${fillName})`,
      fill * GROWTH <= limit ? 'pass' : 'fail',
      `${cables} cables${fiber ? ' (Cat6 + fibra OM3)' : ' Cat6'} → ${pct(fill)} de uso, ${pct(fill * GROWTH)} con 25 % de crecimiento (límite ${pct(limit)}).`,
    ),
    check('Proyecto: pegado a muros ≤ 0.35 m', 'pass', 'Medido contra el modelo 3D cada 10 cm.'),
    check('NOM-001-SEDE (datos vs potencia)', 'pass', 'Mínimo 30 cm de la potencia o una división metálica (criterio del proyecto).'),
    LABELING,
  ];
  const spacing = spacingFor(w.kind);
  const held = supportCheck(supports?.get(physical), spacing, w.kind);
  if (held) checks.push(held);
  if (w.kind === 'tray') checks.push(BONDING);
  if (w.kind === 'emt') {
    checks.push(check('ANSI/TIA-607 (puesta a tierra)', 'check', 'Continuidad del tubo y unión a la barra de tierra: especificado, no modelado.'));
    const low = Math.min(...w.points.map((q) => q.h));
    checks.push(
      low < 2.7
        ? check('NOM-001-SEDE art. 358.12 (EMT y daño físico)', 'check', `Baja hasta ${ceil1(low)} m, al alcance de personas: confirmar que no es daño físico severo; si lo es, usar tubo rígido (RMC).`)
        : check('NOM-001-SEDE art. 358.12 (EMT y daño físico)', 'pass', `Va a ${ceil1(low)} m o más, fuera del alcance de balones y personas.`),
    );
  }
  if (w.kind === 'plastic') {
    checks.push(check('NEC art. 388 (canaleta no metálica)', 'check', 'Solo interior seco, a la vista y sin riesgo de golpes (fuentes secundarias): confirmar en la NOM-001-SEDE y la clasificación de fuego del cable.'));
  }
  if (w.kind === 'emt' || w.kind === 'plastic') {
    const boxes = junctionsOf(w.id);
    const pulls = boxes.filter((j) => j.kind === 'pull').length;
    checks.push(check('ANSI/TIA-569 (cajas de registro)', 'pass', `${boxes.length} cajas (entrada${pulls ? `, ${pulls} de paso` : ''} y una por bajada): ninguna corrida pasa de 30 m ni de 360° de curvas entre cajas.`));
  }
  if (w.kind === 'conduit') {
    checks.push(check('ANSI/TIA-569 (cortafuego)', 'pass', 'Se sella el espacio anular y la manga vacía.'));
  }
  if (w.id === 'ANNEX_E2') {
    checks.push(check('Soporte', 'check', 'Cruza ≈ 9 m el vano del pasillo: colgantes anclados al techo del anexo, por confirmar en el levantamiento.'));
  }
  if (copper >= 10 && w.kind === 'tray') {
    checks.push(check('TIA TSB-184 (calentamiento de haz PoE)', 'check', `Haz de ${copper} cables Cat6: verificar con la ficha del cable.`));
  }
  checks.push(BEND_RADIUS);
  const size = w.kind === 'emt' ? `${w.trade ?? ''} (Ø interior ${w.widthMm} mm)` : w.kind === 'conduit' ? `Ø ${w.widthMm} mm` : `${w.widthMm} × ${w.depthMm} mm`;
  const specs: [string, string][] = [
    ['Tipo', KIND_LABEL[w.kind]],
    ['Medida', size],
    ['Largo', `${ceil1(pathLength(w.points))} m`],
    ['Altura', hRange(w.points)],
    ['Lleva', `${copper} × Cat6 U/UTP${fiber ? ' + fibra OM3 del backbone' : ''}`],
  ];
  const count = supports?.get(physical)?.total;
  if (count !== undefined) specs.push([w.kind === 'emt' ? 'Abrazaderas' : 'Soportes', w.kind === 'emt' ? `${count} (una a ≤ 0.9 m de cada caja y cada ≤ ${spacing} m)` : `${count} (${w.kind === 'tray' ? 'ménsulas o varillas' : 'fijaciones'}, cada ≤ ${spacing} m)`]);
  if (w.kind === 'emt' || w.kind === 'plastic') specs.push(['Cajas de registro', `${junctionsOf(w.id).length}`]);
  if (w.physical) specs.push(['Comparte', `${w.physical} (sentido contrario)`]);
  return { kind: 'Trayectoria', title: w.id, subtitle: w.label, specs, checks };
}

function dropCard(deviceId: string, blocked: boolean): InfoCard | null {
  const r = DEVICE_ROUTES.find((x) => x.device.id === deviceId);
  if (!r) return null;
  const ap = MODEL_ACCESS_POINTS.find((a) => a.id === deviceId);
  const cam = PROJECT_CAMERAS.find((c) => c.id === deviceId);
  const span = FREE_SPANS.find((s) => s.id === deviceId && s.kind === 'drop');
  const checks: InfoCheck[] = [
    check(
      'ANSI/TIA-568.2 (enlace permanente)',
      r.linkM <= PERMANENT_LINK_MAX_M ? 'pass' : 'fail',
      `${ceil1(r.linkM)} m de ${PERMANENT_LINK_MAX_M} m (sobran ${ceil1(PERMANENT_LINK_MAX_M - r.linkM)} m).`,
    ),
    check('Proyecto: bajada en tubo ≤ 10 m', r.dropM <= MAX_DROP_M ? 'pass' : 'fail', `${ceil1(r.dropM)} m de la bandeja al dispositivo.`),
    span
      ? check('Proyecto: pegado a muros ≤ 0.35 m', 'fail', `No se pega: ${span.support}`)
      : check('Proyecto: pegado a muros ≤ 0.35 m', 'pass', 'Medido contra el modelo 3D cada 10 cm.'),
    blocked
      ? check('Ruta en el modelo', 'check', 'La bajada dibujada cruza un sólido del modelo: ajustar la ruta.')
      : check('Ruta en el modelo', 'pass', 'La bajada llega al dispositivo sin cruzar sólidos.'),
    check(
      'IEEE 802.3at (PoE)',
      r.device.kind === 'AP' ? 'pass' : 'check',
      r.device.kind === 'AP' ? '≈ 25.5 W en el AP, 30 W disponibles en el puerto.' : 'Consumo de la cámara ≈ 9 W (estimado): verificar con la ficha técnica.',
    ),
    LABELING,
    BEND_RADIUS,
  ];
  const specs: [string, string][] = [
    ['Dispositivo', `${r.device.id} · ${ap?.model ?? cam?.model ?? r.device.kind}`],
    ['Cable', 'UTP Cat6 (U/UTP), 4 pares, ≈ 7 mm de Ø'],
    ['Tubo de bajada', 'EMT ¾" de la bandeja al dispositivo'],
    ['Origen', r.device.hub === 'rack' ? 'Rack (cuarto de red)' : 'IDF norte (IDF-N)'],
    ['Tramo en bandeja', `${ceil1(r.trayM)} m (${r.chain.join(' › ')})`],
    ['Bajada', `${ceil1(r.dropM)} m`],
    ['Enlace permanente', `${ceil1(r.linkM)} m`],
    ['Largo de corte', `${ceil1(r.cutM)} m (10 % de holgura + 5 m de reservas)`],
  ];
  return { kind: 'Bajada de cable', title: `Bajada a ${r.device.id}`, subtitle: `UTP Cat6 hacia ${r.device.kind === 'AP' ? 'el access point' : 'la cámara'}`, specs, checks };
}

function sleeveCard(id: string): InfoCard | null {
  const pen = PENETRATIONS.find((x) => x.id === id);
  if (!pen) return null;
  return {
    kind: 'Hoyo en muro',
    title: pen.id,
    subtitle: pen.description,
    specs: [
      ['Tipo', 'Manga de acero rígido a través del muro'],
      ['Mangas', `${pen.sleeves} × Ø${pen.diameterMm} mm (una de reserva)`],
      ['Espesor del muro', `${pen.thicknessM.toFixed(2)} m`],
      ['Altura', `${ceil1(pen.position.h)} m`],
      ['Trayectoria', pen.pathway],
    ],
    checks: [
      check('ANSI/TIA-569 (cortafuego)', 'pass', 'Se sella el espacio anular y la manga vacía.'),
      check('NOM-001-SEDE art. 300-21', 'pass', 'La perforación del muro se sella contra fuego.'),
      check('Material del muro', 'check', 'Se asume mampostería o concreto (0.20 m en el modelo): confirmar antes de perforar.'),
      LABELING,
    ],
  };
}

function idfCard(): InfoCard {
  const fiberM = backboneFiberM();
  return {
    kind: 'Gabinete de red',
    title: IDF.id,
    subtitle: 'Distribuidor intermedio (IDF) del muro norte',
    specs: [
      ['Gabinete', 'De pared 6U, 0.6 × 0.4 × 0.4 m'],
      ['Switch', `${IDF.switchModel} (24 puertos PoE++, ${IDF.ports} en uso)`],
      ['Backbone', `Fibra OM3 desde el rack, ≈ ${Math.round(fiberM)} m`],
      ['Atiende', 'M01–M04, M18, CAM02, CAM04'],
      ['Altura', `${ceil1(IDF.position.h)} m (fuera del alcance de los balones)`],
    ],
    checks: [
      check('ANSI/TIA-568.3 (fibra)', fiberM <= OM3_MAX_M ? 'pass' : 'fail', `10GBASE-SR sobre OM3 llega a ${OM3_MAX_M} m; este enlace mide ≈ ${Math.round(fiberM)} m.`),
      check('Alimentación', 'fail', 'Aún sin cubrir: el circuito dedicado de 127 V y un UPS pequeño no están presupuestados.'),
      check('IEEE 802.3at (presupuesto PoE)', 'check', '≈ 145 W para sus 7 dispositivos (estimado): verificar contra el presupuesto PoE del switch.'),
      check('ANSI/TIA-607 (puesta a tierra)', 'check', 'Conductor de tierra desde la barra del rack, por el mismo tubo EMT que la fibra y el cobre: especificado, no modelado.'),
      LABELING,
    ],
  };
}

/** Elevation, in degrees above horizontal, from a cabinet to a seated ear point. */
function elevation(spk: (typeof SPEAKERS)[number], ear: { y: number; h: number }): number {
  return (Math.atan2(ear.h - spk.position.h, ear.y - spk.position.y) * 180) / Math.PI;
}
const EON715_VERTICAL_HALF_DEG = 30;

function speakerCard(id: string): InfoCard | null {
  const spk = SPEAKERS.find((s) => s.id === id);
  if (!spk) return null;
  const front = elevation(spk, FRONT_ROW_EAR);
  const back = elevation(spk, BACK_ROW_EAR);
  const worst = Math.max(Math.abs(front - spk.tiltUpDeg), Math.abs(back - spk.tiltUpDeg));
  return {
    kind: 'Bocina',
    title: spk.id,
    subtitle: `Grada ${spk.stand === 'west' ? 'oeste' : 'este'}, línea ${spk.line}`,
    specs: [
      ['Modelo', `${spk.model} (amplificada, 15" de dos vías)`],
      ['Consola', `${MIXER_MODEL} (portátil)`],
      ['Señal', `XLR balanceada, línea ${spk.line}; thru a la segunda bocina`],
      ['Posición', `X ${spk.position.x.toFixed(1)} · Y ${spk.position.y.toFixed(1)} m, h ${ceil1(spk.position.h)} m`],
      ['Inclinación', `${spk.tiltUpDeg}° hacia arriba, mirando a las gradas`],
      ['Montaje', `Soporte tipo yugo en la cara del escalón (Y ${STAND_FRONT_Y} m)`],
    ],
    checks: [
      check(
        'Cobertura vertical (±30°)',
        worst <= EON715_VERTICAL_HALF_DEG ? 'pass' : 'fail',
        `Primera fila ${Math.round(front)}°, última fila ${Math.round(back)}° contra el eje de ${spk.tiltUpDeg}°: máximo ${Math.round(worst)}° fuera de eje.`,
      ),
      check('NOM-001-SEDE (alimentación)', 'check', 'Un contacto protegido por bocina al pie de la grada, en canaleta de potencia aparte del audio: no modelado.'),
      check('Montaje', 'check', 'Confirmar en obra la capacidad del soporte y los anclajes contra el peso de la bocina.'),
      LABELING,
    ],
  };
}

function audioCard(line: 'L' | 'R', supports?: SupportIndex): InfoCard | null {
  const run = AUDIO_RUNS.find((r) => r.line === line);
  if (!run) return null;
  const west = line === 'L';
  const upper = supports?.get(`AUDIO_${line}`);
  const lower = supports?.get(`AUDIO_${line}_LOW`);
  const total = upper && lower ? { total: upper.total + lower.total, thin: upper.thin + lower.thin, none: upper.none + lower.none } : undefined;
  const held = supportCheck(total, EMT_SPACING_M, 'emt');
  const boxes = junctionsOf(`AUDIO_${line}`).length + junctionsOf(`AUDIO_${line}_LOW`).length;
  return {
    kind: 'Cable de audio',
    title: `AUDIO_${line}`,
    subtitle: west ? 'Muro de oficinas, por arriba del muro trasero, pie de la grada oeste' : 'Muro de oficinas, pie de la grada este',
    specs: [
      ['Tipo', 'Cable de audio XLR balanceado en tubo conduit'],
      ['Tubo', `EMT ${FLOOR_CONDUIT.trade} arriba de ${FLOOR_CONDUIT.protectedHeightM} m; rígido de acero (RMC) ${FLOOR_CONDUIT.trade} por debajo`],
      ['Alimenta', west ? 'SPK-W1, SPK-W2 (grada oeste)' : 'SPK-E1, SPK-E2 (grada este)'],
      ['Largo', `${ceil1(pathLength(run.points))} m`],
      ['Altura', hRange(run.points)],
      ['Tramo de piso', `${ceil1(floorRunLengthM(line))} m en tubo rígido pegado a la contrahuella, a ${ceil1(FLOOR_RUN_H * 100).replace('.0', '')} cm del piso`],
      ...(total ? [['Abrazaderas', `${total.total} (una a ≤ 0.9 m de cada caja y cada ≤ ${EMT_SPACING_M} m)`] as [string, string]] : []),
      ['Cajas de registro', `${boxes}`],
    ],
    checks: [
      check('Proyecto: protección mecánica del tramo de piso', 'check', 'Tubo rígido de pared gruesa contra balonazos, pies, carritos y trapeadoras: confirmar con el cliente el tipo de uso y que la contrahuella admita los anclajes. No encontré el artículo de la NOM que la exija.'),
      check('Proyecto: separado de la canalización de datos ≥ 0.3 m', 'pass', 'Trayectoria independiente; solo cruza en ángulo recto (curva de desvío en el tubo de datos o en este).'),
      check('Cruces en piso', 'pass', 'Nada cruza la boca del pasillo central por el piso, así que no se pisa.'),
      check('NOM-001-SEDE (audio vs potencia)', 'check', 'La potencia va en su propia canalización: no modelado.'),
      check('Presupuesto de cable XLR', 'check', 'El lote de XLR se calculó para ≈ 77 m y los dos tendidos suman ≈ 107 m: verificar la cotización.'),
      ...(held ? [held] : []),
      LABELING,
    ],
  };
}

/** Builds the card for a clicked target, or null when the target no longer exists. */
export function infoCardFor(target: InfoTarget, supports?: SupportIndex): InfoCard | null {
  switch (target.type) {
    case 'pathway':
      return pathwayCard(target.id, supports);
    case 'drop':
      return dropCard(target.id, target.blocked ?? false);
    case 'sleeve':
      return sleeveCard(target.id);
    case 'idf':
      return idfCard();
    case 'speaker':
      return speakerCard(target.id);
    case 'audio':
      return audioCard(target.line, supports);
  }
}
