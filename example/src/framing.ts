import type { Landmark } from 'react-native-nitro-pose-exercises';

export type FramingIssue =
  | 'noPerson'
  | 'headClipped'
  | 'feetClipped'
  | 'tooFar'
  | 'offCenter'
  | 'wrongAngle'
  | 'standing'
  | null;

export interface FramingStatus {
  ready: boolean;
  issue: FramingIssue;
  message: string;
}

export function getFramingStatus(
  landmarks: Landmark[] | null | undefined,
  requiredView: 'side' | 'front',
  postureFamily: string = 'none'
): FramingStatus {
  if (!landmarks || landmarks.length < 33) {
    return { ready: false, issue: 'noPerson', message: 'Entra en el encuadre' };
  }

  const ls = landmarks[11];
  const rs = landmarks[12];
  const lw = landmarks[15];
  const rw = landmarks[16];

  if (!ls || !rs || ls.visibility < 0.2 || rs.visibility < 0.2) {
    return { ready: false, issue: 'noPerson', message: 'Entra en el encuadre' };
  }

  const shoulderDx = Math.abs(ls.x - rs.x);
  const midX = (ls.x + rs.x) / 2;

  // Off-center
  if (Math.abs(midX - 0.5) > 0.4) {
    return {
      ready: false,
      issue: 'offCenter',
      message: midX < 0.5 ? 'Muévete a la derecha' : 'Muévete a la izquierda',
    };
  }

  // Camera angle
  if (requiredView === 'side' && shoulderDx > 0.25) {
    return { ready: false, issue: 'wrongAngle', message: 'Colócate de lado respecto a la cámara' };
  }
  if (requiredView === 'front' && shoulderDx < 0.05) {
    return { ready: false, issue: 'wrongAngle', message: 'Colócate de frente a la cámara' };
  }

  // Distance: shoulders must span at least 12% of frame for front-facing
  if (requiredView === 'front' && shoulderDx < 0.12) {
    return {
      ready: false,
      issue: 'tooFar',
      message: 'Acércate un poco a la cámara',
    };
  }

  // Plank-vs-standing: wrists should be below shoulders for floor exercises
  if (requiredView === 'front' && postureFamily === 'horizontalProne' && lw && rw) {
    const wristsVisible = lw.visibility > 0.2 && rw.visibility > 0.2;
    if (wristsVisible) {
      const wristY = (lw.y + rw.y) / 2;
      const shoulderY = (ls.y + rs.y) / 2;
      if (wristY < shoulderY) {
        return {
          ready: false,
          issue: 'standing',
          message: 'Colócate en posición en el suelo',
        };
      }
    }
  }

  return { ready: true, issue: null, message: 'Listo' };
}
