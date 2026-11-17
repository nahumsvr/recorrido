import { applyOverrides, sanitizeOverrides } from '../cameras/cameraOverrides.ts';
import projectOverrides from './cameraOverrides.json';
import { CAMERAS, type SecurityCamera } from './cameras.ts';

/** Cameras as the project has them: code defaults with the saved edits (`cameraOverrides.json`) applied. Cabling and the report use these. */
export const PROJECT_CAMERAS: readonly SecurityCamera[] = applyOverrides(CAMERAS, sanitizeOverrides(projectOverrides));
