import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

export const BOAT_POSE_CONFIG: ExerciseConfig = {
  name: 'Boat Pose (Navasana)',
  type: 'hold',
  postureFamily: 'seated',
  visibilityThreshold: 0.3,
  cameraAngle: 'side',
  angles: [
    { name: 'hipFlexion', landmarkA: 11, landmarkB: 23, landmarkC: 25 },
    { name: 'kneeAngle', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
  ],
  phases: [
    { phase: 'hold', angleName: 'hipFlexion', minAngle: 60, maxAngle: 110 },
  ],
  repSequence: [],
  formRules: [
    {
      name: 'backRounding',
      message: "Alarga la columna: no redondees la espalda",
      severity: 'warning',
      angleName: 'hipFlexion',
      minAngle: 60,
      maxAngle: 110,
    },
    {
      name: 'legsDropping',
      message: "Mantén las piernas elevadas",
      severity: 'warning',
      angleName: 'kneeAngle',
      minAngle: 150,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 30000,
};
