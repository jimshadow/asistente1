import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

// MediaPipe Pose Landmark indices
// 11 = left shoulder, 13 = left elbow, 15 = left wrist
// 23 = left hip, 25 = left knee, 27 = left ankle
// 12 = right shoulder, 24 = right hip

export const CHAIR_POSE_CONFIG: ExerciseConfig = {
  name: 'Chair Pose (Utkatasana)',
  type: 'hold',
  postureFamily: 'standingUpright',
  visibilityThreshold: 0.4,
  cameraAngle: 'side',
  angles: [
    {
      name: 'leftKnee',
      landmarkA: 23, // left hip
      landmarkB: 25, // left knee (vertex)
      landmarkC: 27, // left ankle
    },
    {
      name: 'leftHip',
      landmarkA: 11, // left shoulder
      landmarkB: 23, // left hip (vertex)
      landmarkC: 25, // left knee
    },
    {
      name: 'leftArm',
      landmarkA: 11, // left shoulder
      landmarkB: 13, // left elbow (vertex)
      landmarkC: 15, // left wrist
    },
  ],
  phases: [
    {
      phase: 'hold',
      angleName: 'leftKnee',
      minAngle: 90,
      maxAngle: 130,
    },
  ],
  repSequence: [],
  formRules: [
    {
      name: 'kneesTooStraight',
      message: "Baja más: flexiona más las rodillas",
      severity: 'warning',
      angleName: 'leftKnee',
      minAngle: 90,
      maxAngle: 130,
    },
    {
      name: 'leaningForward',
      message: "Mantén el pecho alto: no te inclines tanto hacia delante",
      severity: 'warning',
      angleName: 'leftHip',
      minAngle: 70,
      maxAngle: 130,
    },
    {
      name: 'armsNotUp',
      message: "Estira los brazos hacia arriba",
      severity: 'info',
      angleName: 'leftArm',
      minAngle: 160,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 30000, // 30 seconds
};
