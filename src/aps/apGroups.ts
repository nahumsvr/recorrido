import { Group, type Camera, type Raycaster, type Vector3 } from 'three';
import type { MeshBVH } from 'three-mesh-bvh';
import type { AccessPoint, ApGroupId } from '../data/aps.ts';
import { createApLayer, type ApItem, type ApLayer, type ApLayerStyle, type Footprint } from './apLayer.ts';
import { nearestAp } from './selection.ts';

export interface ApGroupDef {
  readonly id: ApGroupId;
  readonly aps: readonly AccessPoint[];
  readonly style: ApLayerStyle;
}

/** Several AP layers (design table, SketchUp model…) handled as one for picking and highlighting. */
export interface ApGroups {
  readonly root: Group;
  readonly layers: ReadonlyMap<ApGroupId, ApLayer>;
  /** Every item of every group (visible or not). */
  readonly all: readonly ApItem[];
  get(id: string): ApItem | null;
  colorOf(group: ApGroupId): number;
  setVisible(group: ApGroupId, visible: boolean): void;
  isVisible(group: ApGroupId): boolean;
  setLabelsVisible(group: ApGroupId, visible: boolean): void;
  setCoverage(group: ApGroupId, mode: { sphere: boolean; floor: boolean }): void;
  /** Closest AP hit across visible groups. */
  pick(raycaster: Raycaster): ApItem | null;
  /** Nearest visible AP within `radius` of `eye`. */
  nearest(eye: Vector3, radius: number): ApItem | null;
  setHighlighted(id: string | null): void;
  setOccluderCeiling(h: number | null): void;
  updateOcclusion(camera: Camera): void;
  animate(time: number): void;
}

export function createApGroups(defs: readonly ApGroupDef[], bvh: MeshBVH, footprint: Footprint): ApGroups {
  const root = new Group();
  root.name = 'accessPoints';
  const layers = new Map<ApGroupId, ApLayer>();
  const colors = new Map<ApGroupId, number>();
  for (const def of defs) {
    const layer = createApLayer(def.aps, bvh, footprint, def.style);
    layers.set(def.id, layer);
    colors.set(def.id, def.style.color);
    root.add(layer.group);
  }
  const all = [...layers.values()].flatMap((l) => l.items);
  const byId = new Map(all.map((i) => [i.ap.id, i]));
  const visibleItems = () => [...layers.values()].filter((l) => l.isModelVisible()).flatMap((l) => l.items);

  return {
    root,
    layers,
    all,
    get: (id) => byId.get(id) ?? null,
    colorOf: (group) => colors.get(group) ?? 0xffffff,
    setVisible(group, visible) {
      const layer = layers.get(group);
      layer?.setModelVisible(visible);
    },
    isVisible: (group) => layers.get(group)?.isModelVisible() ?? false,
    setLabelsVisible(group, visible) {
      layers.get(group)?.setLabelsVisible(visible);
    },
    setCoverage(group, mode) {
      layers.get(group)?.setCoverage(mode);
    },
    pick(raycaster) {
      let best: { item: ApItem; distance: number } | null = null;
      for (const layer of layers.values()) {
        const hit = layer.pick(raycaster);
        if (hit && (!best || hit.distance < best.distance)) best = hit;
      }
      return best?.item ?? null;
    },
    nearest: (eye, radius) => nearestAp(visibleItems(), eye, radius),
    setHighlighted(id) {
      for (const layer of layers.values()) layer.setHighlighted(id);
    },
    setOccluderCeiling(h) {
      for (const layer of layers.values()) layer.setOccluderCeiling(h);
    },
    updateOcclusion(camera) {
      for (const layer of layers.values()) if (layer.group.visible) layer.updateOcclusion(camera);
    },
    animate(time) {
      for (const layer of layers.values()) layer.animate(time);
    },
  };
}
