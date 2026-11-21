import type { ExerciseConfig } from '../NitroPoseExercises.nitro';
export const WARRIOR_III_CONFIG: ExerciseConfig = {
  name: 'Warrior III (Virabhadrasana III)',
  type: 'hold',
  postureFamily: 'standingUpright',
  visibilityThreshold: 0.4,
  cameraAngle: 'side',
  angles: [
    { name: 'standingLeg', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
    { name: 'hipHinge', landmarkA: 11, landmarkB: 23, landmarkC: 25 },
    { name: 'raisedLeg', landmarkA: 12, landmarkB: 24, landmarkC: 28 },
    { name: 'arms', landmarkA: 11, landmarkB: 13, landmarkC: 15 },
  ],
  phases: [
    { phase: 'hold', angleName: 'hipHinge', minAngle: 70, maxAngle: 110 },
  ],
  repSequence: [],
  formRules: [
    {
      name: 'standingLegBent',
      message: "Estira la pierna de apoyo",
      severity: 'warning',
      angleName: 'standingLeg',
      minAngle: 165,
      maxAngle: 180,
    },
    {
      name: 'raisedLegLow',
      message: "Eleva la pierna de atrás paralela al suelo",
      severity: 'info',
      angleName: 'raisedLeg',
      minAngle: 155,
      maxAngle: 180,
    },
    {
      name: 'armsNotExtended',
      message: "Estira los brazos hacia delante",
      severity: 'info',
      angleName: 'arms',
      minAngle: 160,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 30000,
};
