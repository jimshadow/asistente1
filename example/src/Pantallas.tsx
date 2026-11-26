import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList, Image, Alert } from 'react-native';
import { EJERCICIOS, MUSCLES, CIRCUITOS, porId, type Ejercicio, type Circuito, type MuscleId } from './exercises';
import { EXERCISE_IMAGES } from './images';
import { C, ui } from './ui';
import { Ilustracion, Safe } from './Safe';
import { alarmaDisponible, obtenerAlarma, programarAlarma, cancelarAlarma, type AlarmaConfig } from './alarm';

export interface Paso { ejercicio: Ejercicio; reps: number; segundos: number }
export type Plan = { titulo: string; descanso: number; pasos: Paso[] };

export const pasoDe = (e: Ejercicio, reps?: number, segundos?: number): Paso => ({
  ejercicio: e, reps: reps ?? e.reps, segundos: segundos ?? e.segundos,
});
export const planDeCircuito = (c: Circuito): Plan => ({
  titulo: c.nombre, descanso: c.descansoSeg,
  pasos: c.items.map((i) => pasoDe(porId(i.id), i.reps, i.segundos)),
});
export const planUnico = (e: Ejercicio): Plan => ({ titulo: e.nombre, descanso: 0, pasos: [pasoDe(e)] });

const dosis = (e: Ejercicio) => (e.tipo === 'hold' ? `${e.segundos} s` : `${e.reps} repeticiones`);

function Tarjeta({ e, onPress }: { e: Ejercicio; onPress: () => void }) {
  return (
    <TouchableOpacity style={ui.card} onPress={onPress} activeOpacity={0.85}>
      <Ilustracion source={EXERCISE_IMAGES[e.id]!} margen={24} />
      <View style={ui.cardBody}>
        <Text style={ui.h2}>{e.nombre}</Text>
        <Text style={ui.sub}>{e.dificultad} · {e.tipo === 'hold' ? 'Mantener ' : ''}{dosis(e)}</Text>
        <Text style={[ui.tag, { marginTop: 4 }]}>
          {e.musculos.map((m) => MUSCLES.find((x) => x.id === m)!.nombre).join(' · ')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function Detalle({ e, onBack, onStart }: { e: Ejercicio; onBack: () => void; onStart: (p: Plan) => void }) {
  const [reps, setReps] = useState(e.reps);
  const [seg, setSeg] = useState(e.segundos);
  const hold = e.tipo === 'hold';
  return (
    <Safe><ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <TouchableOpacity onPress={onBack}><Text style={[ui.sub, { color: C.acc }]}>← Volver</Text></TouchableOpacity>
      <Text style={[ui.h1, { marginTop: 8 }]}>{e.nombre}</Text>
      <View style={{ marginVertical: 12 }}><Ilustracion source={EXERCISE_IMAGES[e.id]!} margen={32} radio={16} /></View>
      <Text style={ui.body}>{e.descripcion}</Text>
      <Text style={[ui.label, { marginTop: 14 }]}>Músculos</Text>
      <View style={ui.rowWrap}>
        {e.musculos.map((m) => (
          <View key={m} style={ui.chip}><Text style={ui.chipTxt}>{MUSCLES.find((x) => x.id === m)!.nombre}</Text></View>
        ))}
      </View>
      <Text style={ui.label}>Cámara</Text>
      <Text style={ui.body}>{e.camara}</Text>
      <Text style={ui.label}>{hold ? 'Segundos a mantener' : 'Repeticiones'}</Text>
      <View style={ui.stepper}>
        <TouchableOpacity style={ui.stepBtn} onPress={() => (hold ? setSeg(Math.max(10, seg - 5)) : setReps(Math.max(1, reps - 1)))}>
          <Text style={ui.stepBtnTxt}>−</Text>
        </TouchableOpacity>
        <Text style={ui.stepVal}>{hold ? seg : reps}</Text>
        <TouchableOpacity style={ui.stepBtn} onPress={() => (hold ? setSeg(Math.min(180, seg + 5)) : setReps(Math.min(50, reps + 1)))}>
          <Text style={ui.stepBtnTxt}>+</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={ui.btn} onPress={() => onStart({ titulo: e.nombre, descanso: 0, pasos: [pasoDe(e, reps, seg)] })}>
        <Text style={ui.btnTxt}>Empezar</Text>
      </TouchableOpacity>
    </ScrollView></Safe>
  );
}

export function PantallaEjercicios({ onOpen }: { onOpen: (e: Ejercicio) => void }) {
  return (
    <View style={ui.screen}>
      <View style={ui.header}><Text style={ui.h1}>Ejercicios</Text><Text style={ui.sub}>Elige el ejercicio que quieres hacer</Text></View>
      <FlatList data={EJERCICIOS} keyExtractor={(e) => e.id} contentContainerStyle={ui.list}
        renderItem={({ item }) => <Tarjeta e={item} onPress={() => onOpen(item)} />} />
    </View>
  );
}

export function PantallaMusculos({ onOpen }: { onOpen: (e: Ejercicio) => void }) {
  const [m, setM] = useState<MuscleId>('pecho');
  const lista = EJERCICIOS.filter((e) => e.musculos.includes(m));
  return (
    <View style={ui.screen}>
      <View style={ui.header}>
        <Text style={ui.h1}>Músculos</Text>
        <Text style={ui.sub}>Elige un músculo y mira qué ejercicios puedes hacer</Text>
      </View>
      <View style={{ height: 56 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, alignItems: 'center' }}>
          {MUSCLES.map((x) => (
            <TouchableOpacity key={x.id} style={[ui.chip, m === x.id && ui.chipOn]} onPress={() => setM(x.id)}>
              <Text style={[ui.chipTxt, m === x.id && ui.chipTxtOn]}>{x.emoji} {x.nombre}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <Text style={[ui.sub, { paddingHorizontal: 16, paddingBottom: 4 }]}>{lista.length} ejercicios para {MUSCLES.find((x) => x.id === m)!.nombre.toLowerCase()}</Text>
      <FlatList data={lista} keyExtractor={(e) => e.id} contentContainerStyle={ui.list}
        renderItem={({ item }) => <Tarjeta e={item} onPress={() => onOpen(item)} />} />
    </View>
  );
}

export function PantallaCircuitos({ onStart }: { onStart: (p: Plan) => void }) {
  const [abierto, setAbierto] = useState<string | null>(null);
  return (
    <View style={ui.screen}>
      <View style={ui.header}><Text style={ui.h1}>Circuitos</Text><Text style={ui.sub}>Rutinas recomendadas, con descanso entre ejercicios</Text></View>
      <ScrollView contentContainerStyle={ui.list}>
        {CIRCUITOS.map((c) => (
          <View key={c.id} style={ui.card}>
            <TouchableOpacity style={ui.cardBody} onPress={() => setAbierto(abierto === c.id ? null : c.id)}>
              <Text style={ui.h2}>{c.nombre}</Text>
              <Text style={ui.sub}>{c.descripcion}</Text>
              <Text style={[ui.tag, { marginTop: 4 }]}>{c.items.length} ejercicios · descanso {c.descansoSeg} s</Text>
            </TouchableOpacity>
            {abierto === c.id && (
              <View style={ui.cardBody}>
                {c.items.map((i, n) => {
                  const e = porId(i.id);
                  return (
                    <View key={n} style={[ui.row, { marginBottom: 6 }]}>
                      <Image source={EXERCISE_IMAGES[e.id]} style={{ width: 80, height: 50, borderRadius: 8, backgroundColor: '#ffffff' }} resizeMode="contain" />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={ui.body}>{n + 1}. {e.nombre}</Text>
                        <Text style={ui.sub}>{i.segundos ? `${i.segundos} s` : `${i.reps} repeticiones`}</Text>
                      </View>
                    </View>
                  );
                })}
                <TouchableOpacity style={ui.btn} onPress={() => onStart(planDeCircuito(c))}>
                  <Text style={ui.btnTxt}>Empezar circuito</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const DIAS: [string, number][] = [['L', 2], ['M', 3], ['X', 4], ['J', 5], ['V', 6], ['S', 7], ['D', 1]];
const pad = (n: number) => String(n).padStart(2, '0');

export function PantallaAlarma() {
  const [hora, setHora] = useState(18);
  const [min, setMin] = useState(0);
  const [dias, setDias] = useState<number[]>([]);
  const [rep, setRep] = useState(3);
  const [inter, setInter] = useState(5);
  const [activa, setActiva] = useState(false);
  const [proxima, setProxima] = useState<number | undefined>();

  const aplicar = (c: AlarmaConfig) => {
    setHora(c.hora); setMin(c.minuto); setDias(c.dias); setRep(c.repeticiones);
    setInter(c.intervaloMin); setActiva(c.activa); setProxima(c.proxima);
  };
  useEffect(() => { obtenerAlarma().then((c) => c && aplicar(c)).catch(() => {}); }, []);

  const toggleDia = (d: number) => setDias((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]));
  const guardar = async () => {
    try { aplicar(await programarAlarma({ hora, minuto: min, dias, repeticiones: rep, intervaloMin: inter })); }
    catch (e) { Alert.alert('No se pudo programar la alarma', String(e)); }
  };
  const apagar = async () => { await cancelarAlarma(); setActiva(false); setProxima(undefined); };

  const Stepper = ({ v, set, step, min: mn, max, fmt }: { v: number; set: (n: number) => void; step: number; min: number; max: number; fmt?: (n: number) => string }) => (
    <View style={ui.stepper}>
      <TouchableOpacity style={ui.stepBtn} onPress={() => set(v - step < mn ? max : v - step)}><Text style={ui.stepBtnTxt}>−</Text></TouchableOpacity>
      <Text style={ui.stepValSm}>{fmt ? fmt(v) : v}</Text>
      <TouchableOpacity style={ui.stepBtn} onPress={() => set(v + step > max ? mn : v + step)}><Text style={ui.stepBtnTxt}>+</Text></TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={ui.screen} contentContainerStyle={{ padding: 16, paddingBottom: 90 }}>
      <Text style={ui.h1}>Alarma de ejercicio</Text>
      <Text style={ui.sub}>Te avisa a la hora que elijas y se repite varias veces hasta que la detengas.</Text>
      {!alarmaDisponible && <Text style={[ui.body, { color: C.bad, marginTop: 8 }]}>La alarma solo funciona en Android.</Text>}

      <Text style={ui.label}>Hora</Text>
      <View style={ui.row}>
        <View style={{ flex: 1 }}><Stepper v={hora} set={setHora} step={1} min={0} max={23} fmt={pad} /></View>
        <Text style={ui.stepValSm}>:</Text>
        <View style={{ flex: 1 }}><Stepper v={min} set={setMin} step={5} min={0} max={55} fmt={pad} /></View>
      </View>

      <Text style={ui.label}>Días (si no eliges ninguno, suena todos los días)</Text>
      <View style={ui.row}>
        {DIAS.map(([l, d]) => (
          <TouchableOpacity key={d} style={[ui.chip, dias.includes(d) && ui.chipOn, { minWidth: 40, alignItems: 'center' }]} onPress={() => toggleDia(d)}>
            <Text style={[ui.chipTxt, dias.includes(d) && ui.chipTxtOn]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={ui.label}>Veces que se repite el aviso</Text>
      <Stepper v={rep} set={setRep} step={1} min={1} max={10} />
      <Text style={ui.label}>Minutos entre avisos</Text>
      <Stepper v={inter} set={setInter} step={1} min={1} max={30} />

      <TouchableOpacity style={ui.btn} onPress={guardar}><Text style={ui.btnTxt}>{activa ? 'Guardar cambios' : 'Activar alarma'}</Text></TouchableOpacity>
      {activa && (
        <>
          <Text style={[ui.body, { marginTop: 12, textAlign: 'center' }]}>
            ✅ Activa · próxima: {proxima ? new Date(proxima).toLocaleString('es') : '—'}
          </Text>
          <TouchableOpacity style={ui.btn2} onPress={apagar}><Text style={ui.btn2Txt}>Desactivar alarma</Text></TouchableOpacity>
        </>
      )}
      <Text style={[ui.sub, { marginTop: 16 }]}>
        Consejo: si tu teléfono ahorra batería de forma agresiva (Xiaomi, Huawei, Samsung…), permite que la app funcione en segundo plano y acepta el permiso de notificaciones para que la alarma suene con la app cerrada.
      </Text>
    </ScrollView>
  );
}
