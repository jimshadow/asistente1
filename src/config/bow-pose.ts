import type { ExerciseConfig } from '../NitroPoseExercises.nitro';
export const BOW_POSE_CONFIG: ExerciseConfig = {
  name: 'Bow Pose (Dhanurasana)',
  type: 'hold',
  postureFamily: 'horizontalProne',
  visibilityThreshold: 0.25,
  cameraAngle: 'side',
  angles: [
    { name: 'kneeAngle', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
    { name: 'shoulderExtension', landmarkA: 23, landmarkB: 11, landmarkC: 15 },
  ],
  phases: [
    { phase: 'hold', angleName: 'kneeAngle', minAngle: 50, maxAngle: 100 },
  ],
  repSequence: [],
  formRules: [
    {
      name: 'kneesTooWide',
      message: "Separa las rodillas al ancho de la cadera",
      severity: 'warning',
      angleName: 'kneeAngle',
      minAngle: 50,
      maxAngle: 100,
    },
  ],
  holdDurationMs: 30000,
};
