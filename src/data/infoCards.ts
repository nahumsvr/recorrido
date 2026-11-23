import { AUDIO_RUNS, EON715_COVERAGE, MIXER_MODEL, SPEAKERS, bearing, coverageEars, offAxisDeg } from './audio.ts';
import {
  DEVICE_ROUTES,
  FREE_SPANS,
  IDF,
  IDF_BOARD,
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
import { AUDIO_BOARD } from './audioPower.ts';
import { ISP_DEPTH_M, ISP_DUCT, ISP_ODF, ISP_SOURCE_Y, ispDuctLengthM } from './undergroundLink.ts';
import { PROJECT_CAMERAS } from './projectCameras.ts';
import { RACK_DEVICES } from './networkRack.ts';
import { INFRASTRUCTURE, networkOf, networkRows } from './network.ts';
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
  | { readonly type: 'audio'; readonly line: 'L' | 'R' }
  | { readonly type: 'power'; readonly id: string }
  | { readonly type: 'isp'; readonly id: string }
  | { readonly type: 'netdevice'; readonly id: string }
  | { readonly type: 'camera'; readonly id: string };

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

/** Hostname, VLAN, address and ports of a device, empty when the network table does not know it. */
function networkRowsFor(id: string): [string, string][] {
  const entry = networkOf(id);
  return entry ? networkRows(entry) : [];
}

function netDeviceCard(id: string): InfoCard | null {
  const entry = INFRASTRUCTURE[id];
  const rack = RACK_DEVICES.find((d) => d.id === id);
  if (!entry) return null;
  const specs: [string, string][] = [...networkRows(entry)];
  if (rack) specs.splice(1, 0, ['Equipo', rack.model], ['Ubicación', `RACK-01, U${rack.u}${rack.units > 1 ? `–U${rack.u + rack.units - 1}` : ''}`]);
  return { kind: 'Equipo de red', title: entry.hostname, subtitle: rack ? rack.label : 'Gabinete IDF-N', specs, checks: [] };
}

function cameraCard(id: string): InfoCard | null {
  const cam = PROJECT_CAMERAS.find((c) => c.id === id);
  if (!cam) return null;
  const entry = networkOf(id);
  const specs: [string, string][] = [
    ['Modelo', cam.model],
    ['Zona', cam.zone],
    ['Posición', `X ${cam.position.x.toFixed(1)} · Y ${cam.position.y.toFixed(1)} m, h ${ceil1(cam.position.h)} m`],
    ['Lente', `${cam.lens.mm} mm`],
    ...(entry ? networkRows(entry) : []),
  ];
  return { kind: 'Cámara IP', title: cam.id, subtitle: cam.kind === 'dome' ? 'Domo 4 MP' : 'Bullet 4 MP', specs, checks: [] };
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
    ...networkRowsFor(deviceId),
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
      ...IDF.units.map((q) => [`U${q.u}`, `${q.id} · ${q.label}`] as [string, string]),
      ['Altura', `${ceil1(IDF.position.h)} m (fuera del alcance de los balones)`],
      ['Alimentación', `${IDF_BOARD.id} → EMT ½" (PWR_IDF) → UPS-IDFN, circuito dedicado de 127 V`],
      ...networkRowsFor('SW-IDFN'),
    ],
    checks: [
      check('ANSI/TIA-568.3 (fibra)', fiberM <= OM3_MAX_M ? 'pass' : 'fail', `10GBASE-SR sobre OM3 llega a ${OM3_MAX_M} m; este enlace mide ≈ ${Math.round(fiberM)} m.`),
      check('Alimentación', 'fail', 'Modelada (TA-N → IDF-N), pero aún sin cubrir: el circuito dedicado de 127 V y un UPS pequeño no están presupuestados.'),
      check('IEEE 802.3at (presupuesto PoE)', 'check', '≈ 145 W para sus 7 dispositivos (estimado): verificar contra el presupuesto PoE del switch.'),
      check('ANSI/TIA-607 (puesta a tierra)', 'check', 'Conductor de tierra desde la barra del rack, por el mismo tubo EMT que la fibra y el cobre: especificado, no modelado.'),
      LABELING,
    ],
  };
}

function ispCard(id: string, supports?: SupportIndex): InfoCard | null {
  const lengthM = ispDuctLengthM(ISP_SOURCE_Y);
  if (id === ISP_DUCT.id) {
    return {
      kind: 'Acometida subterránea',
      title: ISP_DUCT.id,
      subtitle: 'Caja blanca (edificio vecino) → cuarto de red',
      specs: [
        ['Cable', 'Fibra óptica monomodo OS2, 12 hilos, dieléctrica (sin armadura metálica)'],
        ['Ducto', `PEAD de ${ISP_DUCT.trade} (${ISP_DUCT.outerMm} mm exterior), enterrado a ${ISP_DEPTH_M.toFixed(1)} m`],
        ['Largo', `${ceil1(lengthM)} m, en línea recta bajo el pasto y el anexo`],
        ['Origen', 'Caja blanca: punto de entrega del proveedor de internet'],
        ['Destino', `${ISP_ODF.id} en el cuarto de red y luego el puerto WAN del router ER8411`],
      ],
      checks: [
        check('Fibra dieléctrica entre edificios', 'pass', 'El cable no lleva metal: no trae potenciales de tierra ni descargas de un edificio al otro.'),
        check('10GBASE-LR (OS2)', 'pass', `Llega a 10 km sobre fibra monomodo; este enlace mide ≈ ${Math.round(lengthM)} m.`),
        check('ANSI/TIA-758 (planta externa del cliente)', 'check', 'Confirmar en obra la profundidad, la cinta de advertencia sobre el ducto, los radios de curvatura y el registro del cambio de dirección.'),
        check('Entrega del proveedor', 'check', 'Confirmar con el proveedor el punto de entrega en la caja blanca, el tipo de transceptor (monomodo) y quién tiende el cable.'),
        LABELING,
      ],
    };
  }
  if (id === ISP_ODF.id) {
    return {
      kind: 'Caja de fibra (ODF)',
      title: ISP_ODF.id,
      subtitle: 'Cuarto de red, cara interior del muro sur',
      specs: [
        ['Recibe', 'La fibra OS2 del proveedor, por el hoyo PEN-10'],
        ['Salida', 'Cable de parcheo de fibra monomodo (LC) al puerto WAN del router ER8411'],
        ['Altura', `${ceil1(ISP_ODF.position.h)} m`],
      ],
      checks: [
        check('Puerto WAN del router', 'check', 'Confirmar con el proveedor y la ficha del ER8411 el tipo de puerto y el transceptor (SFP+ monomodo).'),
        LABELING,
      ],
    };
  }
  const run = PATHWAYS.find((w) => w.service === 'isp' && w.id === id);
  if (!run) return null;
  const total = supports?.get(run.id);
  const held = supportCheck(total, EMT_SPACING_M, 'rmc');
  return {
    kind: 'Subida de acometida',
    title: run.id,
    subtitle: 'Ducto enterrado → hoyo PEN-10 del cuarto de red',
    specs: [
      ['Tubo', `RMC ${run.trade} (acero rígido), pegado a la cara del muro por el lado del anexo`],
      ['Largo', `${ceil1(pathLength(run.points))} m`],
      ['Altura', hRange(run.points)],
      ...(total ? [['Abrazaderas', `${total.total} (una a ≤ 0.9 m de cada caja y cada ≤ ${EMT_SPACING_M} m)`] as [string, string]] : []),
      ['Cajas de registro', `${junctionsOf(run.id).length}`],
    ],
    checks: [
      check('Protección mecánica', 'pass', 'Sube en tubo de acero rígido dentro de la zona de 2 m, la misma regla que el audio.'),
      ...(held ? [held] : []),
      LABELING,
    ],
  };
}

function speakerCard(id: string): InfoCard | null {
  const spk = SPEAKERS.find((s) => s.id === id);
  if (!spk) return null;
  const axis = bearing(spk.position, spk.aim);
  const offAxis = coverageEars(spk.stand).map((ear) => offAxisDeg(spk, ear));
  const worstH = Math.max(...offAxis.map((o) => o.horizontal));
  const worstV = Math.max(...offAxis.map((o) => o.vertical));
  return {
    kind: 'Bocina',
    title: spk.id,
    subtitle: `Grada ${spk.stand === 'west' ? 'oeste' : 'este'}, línea ${spk.line}`,
    specs: [
      ['Modelo', `${spk.model} (amplificada, 15" de dos vías)`],
      ['Consola', `${MIXER_MODEL} (portátil)`],
      ['Señal', `XLR balanceada, línea ${spk.line}`],
      ['Red', 'Sin red: no tiene hostname, VLAN ni dirección IP (solo inventario)'],
      ['Posición', `X ${spk.position.x.toFixed(1)} · Y ${spk.position.y.toFixed(1)} m, h ${ceil1(spk.position.h)} m`],
      ['Apunta a', `X ${spk.aim.x.toFixed(1)} · Y ${spk.aim.y.toFixed(1)} m (centro de la grada): ${Math.round(Math.abs(axis.pitchDeg))}° ${axis.pitchDeg >= 0 ? 'hacia arriba' : 'hacia abajo'}, ${Math.round(Math.abs(axis.yawDeg))}° hacia el fondo de la grada`],
      ['Montaje', `En el muro lateral de la grada ${spk.stand === 'west' ? 'oeste' : 'este'}, sobre un brazo a ${Math.round(Math.abs(spk.position.x - spk.wallX) * 100)} cm del muro, a h ${ceil1(spk.position.h)} m (fuera del paso)`],
    ],
    checks: [
      check(
        'Cobertura (EON715: ±45° horizontal, ±30° vertical)',
        worstH <= EON715_COVERAGE.horizontalHalfDeg && worstV <= EON715_COVERAGE.verticalHalfDeg ? 'pass' : 'fail',
        `Extremo y centro de la grada, primera y última fila: máximo ${Math.round(worstH)}° horizontal y ${Math.round(worstV)}° vertical fuera de eje.`,
      ),
      check('Asientos junto al muro de la bocina', 'check', 'Los asientos más cercanos a la bocina, sobre el mismo muro, quedan fuera de su patrón (más de 45° fuera de eje) y se oirán más bajo; validar en sitio.'),
      check('NOM-001-SEDE (alimentación)', 'check', `Contacto protegido junto a la bocina, en su propia canalización de potencia (PWR_${spk.line}), aparte del audio. La bocina es activa: confirmar su consumo en la ficha del fabricante.`),
      check('Montaje', 'check', 'Confirmar en obra la capacidad del soporte y los anclajes contra el peso de la bocina.'),
      LABELING,
    ],
  };
}

function audioCard(line: 'L' | 'R', supports?: SupportIndex): InfoCard | null {
  const run = AUDIO_RUNS.find((r) => r.line === line);
  if (!run) return null;
  const west = line === 'L';
  const total = supports?.get(`AUDIO_${line}`);
  const held = supportCheck(total, EMT_SPACING_M, 'emt');
  const boxes = junctionsOf(`AUDIO_${line}`).length;
  return {
    kind: 'Cable de audio',
    title: `AUDIO_${line}`,
    subtitle: west ? 'Muro de oficinas, por arriba del muro trasero, muro lateral de la grada oeste' : 'Muro de oficinas, muro lateral de la grada este',
    specs: [
      ['Tipo', 'Cable de audio XLR balanceado en tubo conduit'],
      ['Tubo', 'EMT ¾" en todo el tendido (termina a 3.0 m, arriba de los 2 m de zona protegida)'],
      ['Alimenta', west ? 'SPK-W1 (grada oeste)' : 'SPK-E1 (grada este)'],
      ['Largo', `${ceil1(pathLength(run.points))} m`],
      ['Altura', hRange(run.points)],
      ...(total ? [['Abrazaderas', `${total.total} (una a ≤ 0.9 m de cada caja y cada ≤ ${EMT_SPACING_M} m)`] as [string, string]] : []),
      ['Cajas de registro', `${boxes}`],
    ],
    checks: [
      check('Proyecto: separado de la canalización de datos ≥ 0.3 m', 'pass', 'Trayectoria independiente; solo cruza en ángulo recto (curva de desvío en el tubo de datos o en este).'),
      check('Cruces en piso', 'pass', 'Nada va por el piso ni cruza la boca del pasillo central: no se pisa.'),
      check('NOM-001-SEDE (audio vs potencia)', 'check', 'La potencia va en su propia canalización: no modelado.'),
      check('Presupuesto de cable XLR', 'check', `El lote de XLR se calculó para ≈ 77 m; este tendido mide ≈ ${ceil1(pathLength(run.points))} m: verificar la cotización.`),
      ...(held ? [held] : []),
      LABELING,
    ],
  };
}

function powerCard(id: string, supports?: SupportIndex): InfoCard | null {
  if (id === AUDIO_BOARD.id) {
    return {
      kind: 'Tablero',
      title: AUDIO_BOARD.id,
      subtitle: 'Circuito de audio, muro de oficinas (lado del escenario)',
      specs: [
        ['Alimenta', 'SPK-W1 y SPK-E1 (una canalización de potencia por bocina)'],
        ['Posición', `X ${AUDIO_BOARD.position.x.toFixed(1)} · Y ${AUDIO_BOARD.position.y.toFixed(1)} m, h ${ceil1(AUDIO_BOARD.position.h)} m`],
      ],
      checks: [
        check('Origen del circuito', 'check', 'El tablero que alimenta TA-1 está fuera del modelo: confirmar en el levantamiento su ubicación, la protección y la capacidad.'),
        LABELING,
      ],
    };
  }
  if (id === IDF_BOARD.id) {
    return {
      kind: 'Tablero',
      title: IDF_BOARD.id,
      subtitle: 'Circuito dedicado del IDF-N, muro norte',
      specs: [
        ['Alimenta', 'IDF-N (UPS-IDFN, luego el switch SW-IDFN)'],
        ['Posición', `X ${IDF_BOARD.position.x.toFixed(1)} · Y ${IDF_BOARD.position.y.toFixed(1)} m, h ${ceil1(IDF_BOARD.position.h)} m`],
      ],
      checks: [
        check('Origen del circuito', 'check', 'El tablero que alimenta TA-N está fuera del modelo: confirmar en el levantamiento su ubicación, la protección y la capacidad.'),
        LABELING,
      ],
    };
  }
  const run = PATHWAYS.find((w) => w.service === 'power' && w.id === id);
  if (!run) return null;
  const total = supports?.get(run.id);
  const held = supportCheck(total, EMT_SPACING_M, 'emt');
  const boxes = junctionsOf(run.id).length;
  const low = Math.min(...run.points.map((q) => q.h));
  if (run.id === 'PWR_IDF') {
    return {
      kind: 'Alimentación de gabinete',
      title: run.id,
      subtitle: `${IDF_BOARD.id} → ${IDF.id}`,
      specs: [
        ['Tipo', '3 conductores 12 AWG (fase, neutro y tierra) en tubo EMT'],
        ['Tubo', `EMT ${run.trade}, pegado al muro con abrazaderas`],
        ['Alimenta', `${IDF.id} (UPS-IDFN, luego SW-IDFN)`],
        ['Largo', `${ceil1(pathLength(run.points))} m`],
        ['Altura', hRange(run.points)],
        ...(total ? [['Abrazaderas', `${total.total} (una a ≤ 0.9 m de cada caja y cada ≤ ${EMT_SPACING_M} m)`] as [string, string]] : []),
        ['Cajas de registro', `${boxes}`],
        ['Salida', 'Entra por el costado del gabinete; el UPS se conecta dentro'],
      ],
      checks: [
        check('NEC art. 800 (potencia y comunicaciones)', 'check', 'Va en su propio tubo metálico, aparte de los de datos y fibra: los conductores de potencia y de señal no comparten canalización. Confirmar en la NOM-001-SEDE (fuentes secundarias del NEC).'),
        check('NOM-001-SEDE art. 358.12 (EMT y daño físico)', 'pass', `Va a ${ceil1(low)} m o más, fuera del alcance de balones y personas.`),
        check('NOM-001-SEDE (circuito dedicado)', 'check', 'Confirmar con el electricista la protección y el calibre del circuito para el UPS APC BR1500RM2U y el switch.'),
        ...(held ? [held] : []),
        LABELING,
      ],
    };
  }
  const speaker = SPEAKERS.find((k) => `PWR_${k.line}` === run.id)!.id;
  return {
    kind: 'Alimentación de bocina',
    title: run.id,
    subtitle: `${AUDIO_BOARD.id} → ${speaker}`,
    specs: [
      ['Tipo', '3 conductores 12 AWG (fase, neutro y tierra) en tubo EMT'],
      ['Tubo', `EMT ${run.trade}, pegado al muro con abrazaderas`],
      ['Alimenta', speaker],
      ['Largo', `${ceil1(pathLength(run.points))} m`],
      ['Altura', hRange(run.points)],
      ...(total ? [['Abrazaderas', `${total.total} (una a ≤ 0.9 m de cada caja y cada ≤ ${EMT_SPACING_M} m)`] as [string, string]] : []),
      ['Cajas de registro', `${boxes}`],
      ['Salida', 'Caja con contacto protegido (GFCI) junto a la bocina'],
    ],
    checks: [
      check('NEC art. 800 (potencia y comunicaciones)', 'check', 'Va en su propio tubo metálico, pegado al de audio y sin tocarlo: los conductores de potencia y de señal no comparten canalización. Confirmar en la NOM-001-SEDE (fuentes secundarias del NEC).'),
      low >= 2.7
        ? check('NOM-001-SEDE art. 358.12 (EMT y daño físico)', 'pass', `Va a ${ceil1(low)} m o más, fuera del alcance de balones y personas.`)
        : check('NOM-001-SEDE art. 358.12 (EMT y daño físico)', 'check', `Baja hasta ${ceil1(low)} m: confirmar que no es daño físico severo.`),
      check('NOM-001-SEDE (contacto protegido)', 'check', 'Confirmar el tipo de protección (GFCI) y el consumo de la bocina con el electricista.'),
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
    case 'power':
      return powerCard(target.id, supports);
    case 'isp':
      return ispCard(target.id, supports);
    case 'netdevice':
      return netDeviceCard(target.id);
    case 'camera':
      return cameraCard(target.id);
  }
}
