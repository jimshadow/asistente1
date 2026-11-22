import { useEffect, useState, type ReactNode } from 'react';
import { View, Image, NativeModules, StatusBar, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { C } from './ui';

let cache = { top: StatusBar.currentHeight ?? 28, bottom: 24 };

/** Márgenes del sistema (barra de estado y de navegación) en dp. */
export function useInsets() {
  const [ins, setIns] = useState(cache);
  useEffect(() => {
    let vivo = true;
    const leer = () => {
      try {
        NativeModules.AlarmaEjercicio?.insets?.().then((r: { top: number; bottom: number }) => {
          if (!vivo || !r) return;
          const n = { top: Math.max(r.top, StatusBar.currentHeight ?? 0), bottom: Math.max(r.bottom, 16) };
          cache = n; setIns(n);
        }).catch(() => {});
      } catch {}
    };
    leer();
    const t1 = setTimeout(leer, 400), t2 = setTimeout(leer, 1500);
    return () => { vivo = false; clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return ins;
}

/** Contenedor que deja espacio arriba y abajo para las barras del sistema. */
export function Safe({ children }: { children: ReactNode }) {
  const i = useInsets();
  return <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: i.top + 4, paddingBottom: i.bottom }}>{children}</View>;
}

/** Ilustración con tamaño explícito (relación 1.6:1) para que no se recorte. */
export function Ilustracion({ source, margen = 32, radio = 0 }: { source: ImageSourcePropType; margen?: number; radio?: number }) {
  const { width } = useWindowDimensions();
  const w = Math.floor(width - margen);
  return (
    <Image source={source} resizeMode="contain"
      style={{ width: w, height: Math.round(w / 1.6), backgroundColor: '#eef6f7', borderRadius: radio }} />
  );
}
