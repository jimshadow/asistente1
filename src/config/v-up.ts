import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

export const V_UP_CONFIG: ExerciseConfig = {
  name: 'V-Up',
  type: 'rep',
  postureFamily: 'supine',
  visibilityThreshold: 0.25,
  cameraAngle: 'side',
  angles: [
    { name: 'hipFold', landmarkA: 15, landmarkB: 23, landmarkC: 27 },
    { name: 'leftKnee', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
  ],
  phases: [
    { phase: 'down', angleName: 'hipFold', minAngle: 150, maxAngle: 180 },
    { phase: 'up', angleName: 'hipFold', minAngle: 30, maxAngle: 80 },
  ],
  repSequence: ['down', 'up', 'down'],
  formRules: [
    {
      name: 'kneesBending',
      message: "Mantén las piernas rectas: alcanza las puntas de los pies",
      severity: 'warning',
      angleName: 'leftKnee',
      minAngle: 155,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 0,
};
