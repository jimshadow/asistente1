import { NativeModules, Platform } from 'react-native';

export interface AlarmaConfig {
  activa: boolean;
  hora: number;
  minuto: number;
  dias: number[]; // 1=domingo ... 7=sábado; vacío = todos
  repeticiones: number;
  intervaloMin: number;
  proxima?: number;
}

const nativo = NativeModules.AlarmaEjercicio as
  | {
      obtener(): Promise<AlarmaConfig>;
      programar(h: number, m: number, dias: number[], rep: number, intervalo: number): Promise<AlarmaConfig>;
      cancelar(): Promise<void>;
      pedirPermisoNotificaciones(): Promise<boolean>;
      sonido(tipo: 'bien' | 'mal' | 'fin'): void;
    }
  | undefined;

export const alarmaDisponible = Platform.OS === 'android' && !!nativo;

export const obtenerAlarma = async (): Promise<AlarmaConfig | null> =>
  nativo ? nativo.obtener() : null;
export const programarAlarma = async (c: Omit<AlarmaConfig, 'activa' | 'proxima'>) => {
  if (!nativo) throw new Error('Alarma no disponible en este dispositivo');
  await nativo.pedirPermisoNotificaciones();
  return nativo.programar(c.hora, c.minuto, c.dias, c.repeticiones, c.intervaloMin);
};
export const cancelarAlarma = async () => nativo?.cancelar();

export const sonido = (tipo: 'bien' | 'mal' | 'fin') => { try { nativo?.sonido(tipo); } catch {} };
