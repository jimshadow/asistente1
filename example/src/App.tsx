import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, BackHandler } from 'react-native';
import { nitroPoseExercises } from 'react-native-nitro-pose-exercises';
import { type Ejercicio } from './exercises';
import {
  Detalle, PantallaEjercicios, PantallaMusculos, PantallaCircuitos, PantallaAlarma, type Plan,
} from './Pantallas';
import { Entrenamiento } from './Entrenamiento';
import { C, ui } from './ui';
import { Safe } from './Safe';

type Tab = 'ejercicios' | 'musculos' | 'circuitos' | 'alarma';
const TABS: { id: Tab; icono: string; nombre: string }[] = [
  { id: 'ejercicios', icono: '🏋️', nombre: 'Ejercicios' },
  { id: 'musculos', icono: '💪', nombre: 'Músculos' },
  { id: 'circuitos', icono: '🔁', nombre: 'Circuitos' },
  { id: 'alarma', icono: '⏰', nombre: 'Alarma' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('ejercicios');
  const [detalle, setDetalle] = useState<Ejercicio | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [motorListo, setMotorListo] = useState(false);
  const [errorMotor, setErrorMotor] = useState('');

  // El motor de poses se inicializa una sola vez
  useEffect(() => {
    nitroPoseExercises.initialize('')
      .then(() => setMotorListo(true))
      .catch((e) => setErrorMotor(String(e)));
    return () => { try { nitroPoseExercises.release(); } catch {} };
  }, []);

  // Botón "atrás" de Android
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (plan) { setPlan(null); return true; }
      if (detalle) { setDetalle(null); return true; }
      return false;
    });
    return () => sub.remove();
  }, [plan, detalle]);

  if (plan) return <Entrenamiento plan={plan} motorListo={motorListo} onSalir={() => setPlan(null)} />;
  if (detalle) {
    return <Detalle e={detalle} onBack={() => setDetalle(null)} onStart={(p) => setPlan(p)} />;
  }

  return (
    <Safe>
      <StatusBar barStyle="light-content" />
      {errorMotor !== '' && (
        <Text style={{ color: C.bad, padding: 8 }}>No se pudo iniciar el motor de poses: {errorMotor}</Text>
      )}
      <View style={{ flex: 1 }}>
        {tab === 'ejercicios' && <PantallaEjercicios onOpen={setDetalle} />}
        {tab === 'musculos' && <PantallaMusculos onOpen={setDetalle} />}
        {tab === 'circuitos' && <PantallaCircuitos onStart={setPlan} />}
        {tab === 'alarma' && <PantallaAlarma />}
      </View>
      <View style={ui.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.id} style={ui.tab} onPress={() => setTab(t.id)}>
            <Text style={{ fontSize: 22 }}>{t.icono}</Text>
            <Text style={[ui.tabTxt, tab === t.id && ui.tabTxtOn]}>{t.nombre}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Safe>
  );
}
