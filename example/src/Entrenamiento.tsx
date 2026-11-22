import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import {
  nitroPoseExercises,
  type RepData, type FormFeedback, type SessionResult, type ExercisePhase, type HoldProgress,
} from 'react-native-nitro-pose-exercises';
import { NormalCameraView } from './skia';
import { styles } from './camera-styles';
import { getFramingStatus } from './framing';
import { EXERCISE_IMAGES } from './images';
import { ui } from './ui';
import { Safe, Ilustracion, useInsets } from './Safe';
import { sonido } from './alarm';
import type { Plan } from './Pantallas';

type Fase = 'preparar' | 'posicion' | 'cuenta' | 'activo' | 'descanso' | 'final';
interface Resumen { nombre: string; reps: number; formScore: number; segundos: number; tipo: 'rep' | 'hold' }

export function Entrenamiento({ plan, motorListo, onSalir }: { plan: Plan; motorListo: boolean; onSalir: () => void }) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const ins = useInsets();
  const [camPos, setCamPos] = useState<'front' | 'back'>('front');
  const device = useCameraDevice(camPos);

  const [idx, setIdx] = useState(0);
  const [fase, setFase] = useState<Fase>('preparar');
  const [reps, setReps] = useState(0);
  const [faseRep, setFaseRep] = useState<ExercisePhase>('unknown');
  const [aviso, setAviso] = useState('');
  const [cuenta, setCuenta] = useState(3);
  const [descanso, setDescanso] = useState(0);
  const [holdMs, setHoldMs] = useState(0);
  const [encuadre, setEncuadre] = useState('');
  const [enPosicion, setEnPosicion] = useState(false);
  const [resumenes, setResumenes] = useState<Resumen[]>([]);
  const [sonidoOn, setSonidoOn] = useState(true);
  const sonidoRef = useRef(true); sonidoRef.current = sonidoOn;
  const [ultimo, setUltimo] = useState<SessionResult | null>(null);

  const paso = plan.pasos[idx]!;
  const e = paso.ejercicio;
  const hold = e.tipo === 'hold';
  const pasoRef = useRef(paso); pasoRef.current = paso;
  const idxRef = useRef(idx); idxRef.current = idx;

  useEffect(() => { if (!hasPermission) requestPermission(); }, [hasPermission, requestPermission]);

  // Callbacks del motor
  useEffect(() => {
    if (!motorListo) return;
    const n = nitroPoseExercises;
    let borrar: ReturnType<typeof setTimeout> | undefined;
    n.onRepComplete = (d: RepData) => {
      setReps(d.repNumber);
      if (sonidoRef.current) sonido(d.formScore >= 70 ? 'bien' : 'mal');
    };
    n.onPhaseChange = (p: ExercisePhase) => setFaseRep(p);
    n.onHoldProgress = (p: HoldProgress) => setHoldMs(p.elapsedMs);
    n.onFormFeedback = (f: FormFeedback) => {
      setAviso(f.message);
      if (borrar) clearTimeout(borrar);
      borrar = setTimeout(() => setAviso(''), 3000);
    };
    n.onPoseLost = () => setAviso('¡Vuelve al encuadre!');
    n.onPoseRegained = () => setAviso('');
    n.onPostureLost = () => setAviso('Vuelve a la posición');
    n.onPostureRegained = () => setAviso('');
    n.onSessionComplete = (r: SessionResult) => {
      const p = pasoRef.current;
      setUltimo(r);
      if (sonidoRef.current) sonido('fin');
      setResumenes((prev) => [...prev, {
        nombre: p.ejercicio.nombre, reps: r.totalReps, formScore: r.averageFormScore,
        segundos: Math.round(r.totalDurationMs / 1000), tipo: p.ejercicio.tipo,
      }]);
      const ultimoPaso = idxRef.current >= plan.pasos.length - 1;
      if (ultimoPaso) setFase('final');
      else if (plan.descanso > 0) { setDescanso(plan.descanso); setFase('descanso'); }
      else { setIdx((i) => i + 1); setFase('preparar'); }
    };
    return () => {
      if (borrar) clearTimeout(borrar);
      n.onRepComplete = undefined; n.onPhaseChange = undefined; n.onHoldProgress = undefined;
      n.onFormFeedback = undefined; n.onPoseLost = undefined; n.onPoseRegained = undefined;
      n.onPostureLost = undefined; n.onPostureRegained = undefined; n.onSessionComplete = undefined;
    };
  }, [motorListo, plan]);

  // Descanso: cuenta atrás
  useEffect(() => {
    if (fase !== 'descanso') return;
    if (descanso <= 0) { setIdx((i) => i + 1); setFase('preparar'); return; }
    const t = setTimeout(() => setDescanso((d) => d - 1), 1000);
    return () => clearTimeout(t);
  }, [fase, descanso]);

  // Posicionamiento
  useEffect(() => {
    if (fase !== 'posicion') return;
    const iv = setInterval(() => {
      try {
        const f = getFramingStatus(nitroPoseExercises.landmarks, e.config.cameraAngle, e.config.postureFamily);
        if (!f.ready) { setEncuadre(f.message); setEnPosicion(false); return; }
        const ok = nitroPoseExercises.isReady();
        setEncuadre(ok ? 'No te muevas' : 'Colócate en la posición del ejercicio');
        setEnPosicion(ok);
      } catch { setEnPosicion(false); }
    }, 300);
    return () => clearInterval(iv);
  }, [fase, e]);

  useEffect(() => {
    if (fase !== 'posicion' || !enPosicion) return;
    const t = setTimeout(() => {
      setCuenta(3); setFase('cuenta');
    }, 600);
    return () => clearTimeout(t);
  }, [fase, enPosicion]);

  useEffect(() => {
    if (fase !== 'cuenta') return;
    if (cuenta <= 0) { setFase('activo'); return; }
    const t = setTimeout(() => setCuenta((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [fase, cuenta]);

  const preparar = useCallback(() => {
    // Carga el ejercicio elegido en el motor y empieza a buscar la posición
    const cfg = hold ? { ...e.config, holdDurationMs: paso.segundos * 1000 } : e.config;
    nitroPoseExercises.loadExercise(cfg);
    setReps(0); setHoldMs(0); setFaseRep('unknown'); setAviso(''); setEnPosicion(false); setEncuadre('');
    setFase('posicion');
    nitroPoseExercises.startSession(hold ? 0 : paso.reps, 0);
  }, [e, hold, paso]);

  const detener = () => { try { nitroPoseExercises.stopSession(); } catch {} };
  const salir = () => { try { nitroPoseExercises.stopSession(); } catch {} onSalir(); };
  const saltarDescanso = () => setDescanso(0);

  // ── Pantallas sin cámara ──
  if (fase === 'preparar') {
    return (
      <Safe><ScrollView contentContainerStyle={[ui.fullDark, { paddingBottom: 32 }]}>
        <Text style={ui.sub}>Ejercicio {idx + 1} de {plan.pasos.length} · {plan.titulo}</Text>
        <Text style={ui.h1}>{e.nombre}</Text>
        <View style={{ marginVertical: 12 }}><Ilustracion source={EXERCISE_IMAGES[e.id]!} margen={32} radio={16} /></View>
        <Text style={ui.body}>{e.descripcion}</Text>
        <Text style={[ui.sub, { marginTop: 8 }]}>{e.camara}</Text>
        <Text style={[ui.h2, { marginTop: 12 }]}>{hold ? `Mantén ${paso.segundos} segundos` : `${paso.reps} repeticiones`}</Text>
        {!hasPermission ? (
          <TouchableOpacity style={ui.btn} onPress={requestPermission}><Text style={ui.btnTxt}>Permitir cámara</Text></TouchableOpacity>
        ) : (
          <TouchableOpacity style={[ui.btn, !motorListo && { opacity: 0.5 }]} disabled={!motorListo} onPress={preparar}>
            <Text style={ui.btnTxt}>{motorListo ? 'Estoy listo' : 'Cargando motor de poses…'}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={ui.btn2} onPress={salir}><Text style={ui.btn2Txt}>Salir</Text></TouchableOpacity>
      </ScrollView></Safe>
    );
  }

  if (fase === 'descanso') {
    const sig = plan.pasos[idx + 1]!.ejercicio;
    return (
      <Safe><ScrollView contentContainerStyle={[ui.fullDark, { paddingBottom: 32 }]}>
        <Text style={ui.h1}>Descanso</Text>
        <Text style={ui.bigNum}>{descanso}</Text>
        <Text style={ui.sub}>Siguiente:</Text>
        <Text style={ui.h2}>{sig.nombre}</Text>
        <View style={{ marginVertical: 12 }}><Ilustracion source={EXERCISE_IMAGES[sig.id]!} margen={32} radio={16} /></View>
        <TouchableOpacity style={ui.btn} onPress={saltarDescanso}><Text style={ui.btnTxt}>Saltar descanso</Text></TouchableOpacity>
        <TouchableOpacity style={ui.btn2} onPress={salir}><Text style={ui.btn2Txt}>Terminar entrenamiento</Text></TouchableOpacity>
      </ScrollView></Safe>
    );
  }

  if (fase === 'final') {
    const total = resumenes.reduce((a, r) => a + (r.tipo === 'rep' ? r.reps : 0), 0);
    return (
      <Safe><ScrollView contentContainerStyle={[ui.fullDark, { paddingBottom: 32 }]}>
        <Text style={ui.h1}>¡Entrenamiento completo! 🎉</Text>
        <Text style={ui.sub}>{plan.titulo}</Text>
        <View style={{ marginTop: 16 }}>
          {resumenes.map((r, i) => (
            <View key={i} style={[ui.card, ui.cardBody]}>
              <Text style={ui.h2}>{r.nombre}</Text>
              <Text style={ui.sub}>
                {r.tipo === 'rep' ? `${r.reps} repeticiones` : `${r.segundos} s`} · técnica {r.formScore.toFixed(0)}/100
              </Text>
            </View>
          ))}
        </View>
        <Text style={[ui.body, { marginTop: 8 }]}>Repeticiones totales: {total}</Text>
        {ultimo && ultimo.formViolations.length > 0 && (
          <Text style={[ui.sub, { marginTop: 8 }]}>
            Último ejercicio, a corregir: {[...new Set(ultimo.formViolations.map((v) => v.message))].join(' · ')}
          </Text>
        )}
        <TouchableOpacity style={ui.btn} onPress={onSalir}><Text style={ui.btnTxt}>Volver al inicio</Text></TouchableOpacity>
      </ScrollView></Safe>
    );
  }

  // ── Fases con cámara ──
  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>No se encontró ninguna cámara</Text>
        <TouchableOpacity style={styles.button} onPress={salir}><Text style={styles.buttonText}>Salir</Text></TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <NormalCameraView device={device} isActive cameraPosition={camPos} />
      <View style={styles.overlay}>
        <View style={[styles.topButtons, { top: ins.top + 12 }]}>
          <TouchableOpacity style={styles.iconButton} onPress={() => setSonidoOn((v) => !v)}>
            <Text style={{ color: '#fff', fontSize: 22 }}>{sonidoOn ? '🔔' : '🔕'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => setCamPos((p) => (p === 'front' ? 'back' : 'front'))}>
            <Text style={{ color: '#fff', fontSize: 22 }}>⟲</Text>
          </TouchableOpacity>
        </View>

        {fase === 'posicion' && (
          <View style={styles.positioningContainer}>
            <Text style={styles.positioningTitle}>{enPosicion ? 'No te muevas…' : 'Prepárate'}</Text>
            <Text style={styles.subtitleText}>{e.nombre}</Text>
            <Text style={styles.subtitleText}>{encuadre}</Text>
            <View style={[styles.readinessIndicator, enPosicion && styles.readinessIndicatorReady]} />
            <TouchableOpacity style={styles.cancelButton} onPress={() => { detener(); }}>
              <Text style={styles.stopButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}

        {fase === 'cuenta' && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>{cuenta}</Text>
            <Text style={styles.subtitleText}>¡Prepárate!</Text>
          </View>
        )}

        {fase === 'activo' && (
          <>
            <View style={styles.repContainer}>
              {hold ? (
                <>
                  <Text style={styles.repCount}>{Math.max(0, paso.segundos - Math.floor(holdMs / 1000))}</Text>
                  <Text style={styles.repLabel}>SEGUNDOS</Text>
                </>
              ) : (
                <>
                  <Text style={styles.repCount}>{reps}/{paso.reps}</Text>
                  <Text style={styles.repLabel}>REPETICIONES</Text>
                </>
              )}
            </View>
            {!hold && (
              <View style={styles.phaseContainer}>
                <View style={[styles.phaseIndicator, faseRep === 'down' ? styles.phaseDown : styles.phaseUp]} />
                <Text style={styles.phaseText}>{faseRep === 'down' ? '↓ ABAJO' : '↑ ARRIBA'}</Text>
              </View>
            )}
            {aviso !== '' && (
              <View style={styles.feedbackContainer}><Text style={styles.feedbackText}>{aviso}</Text></View>
            )}
            <TouchableOpacity style={[styles.stopButton, { bottom: ins.bottom + 40 }]} onPress={detener}>
              <Text style={styles.stopButtonText}>Terminar este ejercicio</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}
