import type { ExerciseConfig } from '../NitroPoseExercises.nitro';
export const GLUTE_BRIDGE_CONFIG: ExerciseConfig = {
  name: 'Glute Bridge',
  type: 'rep',
  postureFamily: 'supine',
  visibilityThreshold: 0.25,
  cameraAngle: 'side',
  angles: [
    { name: 'hipExtension', landmarkA: 11, landmarkB: 23, landmarkC: 25 },
    { name: 'kneeAngle', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
  ],
  phases: [
    { phase: 'down', angleName: 'hipExtension', minAngle: 80, maxAngle: 120 },
    { phase: 'up', angleName: 'hipExtension', minAngle: 155, maxAngle: 180 },
  ],
  repSequence: ['down', 'up', 'down'],
  formRules: [
    {
      name: 'hipsNotHigh',
      message: "Aprieta los glúteos: sube más la cadera",
      severity: 'warning',
      angleName: 'hipExtension',
      minAngle: 150,
      maxAngle: 180,
    },
    {
      name: 'kneesTooWide',
      message: "Separa las rodillas al ancho de la cadera",
      severity: 'info',
      angleName: 'kneeAngle',
      minAngle: 75,
      maxAngle: 110,
    },
  ],
  holdDurationMs: 0,
};
