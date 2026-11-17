import type { FaceClass } from '../domain/faceClassifier.ts';

/** sRGB hex color per face class. Baked as vertex colors by the model pipeline. */
export const FACE_PALETTE: Record<FaceClass, number> = {
  courtFloor: 0xd9b47c,
  floor: 0xb9b2a6,
  stage: 0x8a5a3b,
  stands: 0x9a9da3,
  platform: 0xa7a19a,
  wallNS: 0xeee6d8,
  wallEW: 0xe2dccf,
  ceiling: 0xc9c4bb,
  roof: 0x8193a6,
};

export const PROPS_COLOR = 0x3c3f46;

/** AP devices modeled in SketchUp (black). */
export const DEVICE_COLOR = 0x1c1d20;
