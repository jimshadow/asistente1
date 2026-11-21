import {
  PUSHUP_CONFIG, PULL_UP_CONFIG, SQUAT_CONFIG, SUMO_SQUAT_CONFIG,
  BICEP_CURL_CONFIG, SHOULDER_PRESS_CONFIG, LUNGE_CONFIG, SIDE_LUNGE_CONFIG,
  SITUP_CONFIG, TRICEP_DIP_CONFIG, DEADLIFT_CONFIG, LATERAL_RAISE_CONFIG,
  FRONT_RAISE_CONFIG, CALF_RAISE_CONFIG, OVERARM_REACH_CONFIG, LEG_RAISE_CONFIG,
  V_UP_CONFIG, GLUTE_BRIDGE_CONFIG, COBRA_WINGS_CONFIG, KNEE_RAISE_CONFIG,
  HIP_ABDUCTION_CONFIG, PLANK_CONFIG, SIDE_PLANK_CONFIG, WALL_SIT_CONFIG,
  TREE_POSE_CONFIG, WARRIOR_I_CONFIG, WARRIOR_II_CONFIG, WARRIOR_III_CONFIG,
  REVERSE_WARRIOR_CONFIG, DOWNWARD_DOG_CONFIG, CHAIR_POSE_CONFIG,
  COBRA_POSE_CONFIG, BRIDGE_POSE_CONFIG, BOAT_POSE_CONFIG,
  EXTENDED_SIDE_ANGLE_CONFIG, CAMEL_POSE_CONFIG, CHILDS_POSE_CONFIG,
  BOW_POSE_CONFIG, FISH_POSE_CONFIG, MOUNTAIN_POSE_CONFIG, TRIANGLE_POSE_CONFIG,
  type ExerciseConfig,
} from 'react-native-nitro-pose-exercises';

export type MuscleId =
  | 'pecho' | 'espalda' | 'hombros' | 'biceps' | 'triceps' | 'abdomen'
  | 'gluteos' | 'cuadriceps' | 'isquios' | 'pantorrillas' | 'flexibilidad';

export const MUSCLES: { id: MuscleId; nombre: string; emoji: string }[] = [
  { id: 'pecho', nombre: 'Pecho', emoji: '🫁' },
  { id: 'espalda', nombre: 'Espalda', emoji: '🔙' },
  { id: 'hombros', nombre: 'Hombros', emoji: '🤷' },
  { id: 'biceps', nombre: 'Bíceps', emoji: '💪' },
  { id: 'triceps', nombre: 'Tríceps', emoji: '🦾' },
  { id: 'abdomen', nombre: 'Abdomen / Core', emoji: '🎯' },
  { id: 'gluteos', nombre: 'Glúteos', emoji: '🍑' },
  { id: 'cuadriceps', nombre: 'Cuádriceps', emoji: '🦵' },
  { id: 'isquios', nombre: 'Isquiotibiales', emoji: '🏃' },
  { id: 'pantorrillas', nombre: 'Pantorrillas', emoji: '🦶' },
  { id: 'flexibilidad', nombre: 'Flexibilidad / Yoga', emoji: '🧘' },
];

export type Dificultad = 'Fácil' | 'Media' | 'Difícil';

export interface Ejercicio {
  id: string; // = nombre del archivo de imagen
  nombre: string;
  config: ExerciseConfig;
  musculos: MuscleId[];
  tipo: 'rep' | 'hold';
  reps: number; // repeticiones por defecto (rep)
  segundos: number; // segundos por defecto (hold)
  dificultad: Dificultad;
  descripcion: string;
  camara: string;
}

const lado = 'Pon el celular de lado, a 2 metros, de modo que se vea tu cuerpo completo.';
const frente = 'Pon el celular de frente, a 2 metros, de modo que se vea tu cuerpo completo.';

function E(
  id: string, nombre: string, config: ExerciseConfig, musculos: MuscleId[],
  dificultad: Dificultad, descripcion: string, reps = 10
): Ejercicio {
  return {
    id, nombre, config, musculos, dificultad, descripcion,
    tipo: config.type === 'hold' ? 'hold' : 'rep',
    reps,
    segundos: Math.round((config.holdDurationMs || 30000) / 1000),
    camara: config.cameraAngle === 'front' ? frente : lado,
  };
}

export const EJERCICIOS: Ejercicio[] = [
  E('pushup', 'Flexiones de pecho', PUSHUP_CONFIG, ['pecho', 'triceps', 'hombros', 'abdomen'], 'Media', 'Cuerpo recto como una tabla. Baja el pecho hasta casi tocar el suelo y empuja hacia arriba.'),
  E('pull-up', 'Dominadas', PULL_UP_CONFIG, ['espalda', 'biceps'], 'Difícil', 'Cuélgate de una barra y sube hasta pasar la barbilla. Baja con control.', 6),
  E('squat', 'Sentadillas', SQUAT_CONFIG, ['cuadriceps', 'gluteos', 'isquios'], 'Fácil', 'Pies al ancho de hombros. Baja la cadera como si te sentaras, con la espalda recta.', 12),
  E('sumo-squat', 'Sentadilla sumo', SUMO_SQUAT_CONFIG, ['gluteos', 'cuadriceps'], 'Fácil', 'Piernas bien abiertas y puntas hacia afuera. Baja manteniendo el torso erguido.', 12),
  E('bicep-curl', 'Curl de bíceps', BICEP_CURL_CONFIG, ['biceps'], 'Fácil', 'Codos pegados al cuerpo. Sube el peso doblando el codo y baja despacio.', 12),
  E('shoulder-press', 'Press de hombros', SHOULDER_PRESS_CONFIG, ['hombros', 'triceps'], 'Media', 'Empuja las manos desde la altura de los hombros hasta estirar los brazos arriba.'),
  E('lunge', 'Zancadas', LUNGE_CONFIG, ['cuadriceps', 'gluteos'], 'Media', 'Da un paso largo al frente y baja la rodilla de atrás hacia el suelo. Alterna piernas.'),
  E('side-lung', 'Zancada lateral', SIDE_LUNGE_CONFIG, ['cuadriceps', 'gluteos', 'isquios'], 'Media', 'Da un paso largo hacia un lado, flexiona esa rodilla y mantén la otra pierna estirada.'),
  E('situp', 'Abdominales', SITUP_CONFIG, ['abdomen'], 'Fácil', 'Acostado con rodillas dobladas. Sube el torso hacia las rodillas sin tirar del cuello.', 15),
  E('tricep-dip', 'Fondos de tríceps', TRICEP_DIP_CONFIG, ['triceps', 'hombros'], 'Media', 'Apoya las manos en una silla firme. Baja doblando los codos hasta 90° y sube.'),
  E('dead-lift', 'Peso muerto', DEADLIFT_CONFIG, ['isquios', 'gluteos', 'espalda'], 'Media', 'Inclina el torso con la espalda recta y rodillas ligeramente dobladas, luego sube empujando la cadera.'),
  E('lateral-raise', 'Elevaciones laterales', LATERAL_RAISE_CONFIG, ['hombros'], 'Fácil', 'Sube los brazos estirados hacia los lados hasta la altura de los hombros.', 12),
  E('front-raise', 'Elevaciones frontales', FRONT_RAISE_CONFIG, ['hombros'], 'Fácil', 'Sube los brazos estirados al frente hasta la altura de los hombros.', 12),
  E('calf-raise', 'Elevación de talones', CALF_RAISE_CONFIG, ['pantorrillas'], 'Fácil', 'De pie, sube sobre la punta de los pies y baja despacio.', 20),
  E('overarm-reach', 'Estiramiento de brazos arriba', OVERARM_REACH_CONFIG, ['hombros', 'espalda'], 'Fácil', 'Sube ambos brazos por encima de la cabeza y estírate al máximo.', 12),
  E('leg-raise', 'Elevación de piernas', LEG_RAISE_CONFIG, ['abdomen'], 'Media', 'Acostado boca arriba, sube las piernas estiradas hasta la vertical y bájalas sin tocar el suelo.', 12),
  E('v-up', 'Abdominales en V', V_UP_CONFIG, ['abdomen'], 'Difícil', 'Acostado, sube a la vez piernas y torso formando una V y vuelve al suelo.', 8),
  E('glute-bridge', 'Puente de glúteos', GLUTE_BRIDGE_CONFIG, ['gluteos', 'isquios'], 'Fácil', 'Boca arriba con rodillas dobladas, sube la cadera hasta formar una línea recta.', 15),
  E('cobra-wings', 'Extensión de espalda (alas)', COBRA_WINGS_CONFIG, ['espalda'], 'Fácil', 'Boca abajo, levanta el pecho y lleva los brazos hacia atrás como alas.', 12),
  E('knee-raise', 'Elevación de rodillas', KNEE_RAISE_CONFIG, ['abdomen', 'cuadriceps'], 'Fácil', 'De pie, sube una rodilla hasta la cintura y alterna de pierna.', 20),
  E('hip-abduction', 'Abducción de cadera', HIP_ABDUCTION_CONFIG, ['gluteos'], 'Fácil', 'De pie, separa una pierna estirada hacia el lado y vuelve. Alterna de pierna.', 15),
  E('plank', 'Plancha', PLANK_CONFIG, ['abdomen', 'hombros'], 'Media', 'Mantén el cuerpo recto como una tabla, sin subir ni hundir la cadera.'),
  E('side-plank', 'Plancha lateral', SIDE_PLANK_CONFIG, ['abdomen', 'hombros'], 'Difícil', 'Apoyado de lado sobre un brazo, eleva la cadera y mantén el cuerpo en línea recta.'),
  E('wall-sit', 'Sentadilla en la pared', WALL_SIT_CONFIG, ['cuadriceps', 'gluteos'], 'Media', 'Espalda contra la pared y rodillas a 90°. Aguanta sin moverte.'),
  E('chair-pose', 'Postura de la silla', CHAIR_POSE_CONFIG, ['cuadriceps', 'gluteos', 'flexibilidad'], 'Media', 'Dobla las rodillas como si te sentaras y sube los brazos.'),
  E('warrior-i', 'Guerrero I', WARRIOR_I_CONFIG, ['cuadriceps', 'hombros', 'flexibilidad'], 'Media', 'Zancada profunda con los brazos hacia arriba y la cadera al frente.'),
  E('warrior-ii', 'Guerrero II', WARRIOR_II_CONFIG, ['cuadriceps', 'hombros', 'flexibilidad'], 'Media', 'Piernas abiertas, rodilla delantera doblada y brazos abiertos a los lados.'),
  E('warrior-iii', 'Guerrero III', WARRIOR_III_CONFIG, ['isquios', 'gluteos', 'espalda', 'flexibilidad'], 'Difícil', 'Equilibrio sobre una pierna con el torso y la pierna de atrás en horizontal.'),
  E('reverse-warrior', 'Guerrero inverso', REVERSE_WARRIOR_CONFIG, ['cuadriceps', 'flexibilidad'], 'Media', 'Desde Guerrero II, inclínate hacia atrás con un brazo arriba.'),
  E('tree-pose', 'Postura del árbol', TREE_POSE_CONFIG, ['cuadriceps', 'flexibilidad'], 'Fácil', 'Equilibrio sobre una pierna con el pie contrario apoyado en el muslo.'),
  E('downward-dog', 'Perro boca abajo', DOWNWARD_DOG_CONFIG, ['espalda', 'isquios', 'hombros', 'pantorrillas', 'flexibilidad'], 'Media', 'Forma una V invertida con la cadera arriba y talones hacia el suelo.'),
  E('cobra-pose', 'Postura de la cobra', COBRA_POSE_CONFIG, ['espalda', 'abdomen', 'flexibilidad'], 'Fácil', 'Boca abajo, empuja con las manos y eleva el pecho.'),
  E('bridge-pose', 'Postura del puente', BRIDGE_POSE_CONFIG, ['gluteos', 'espalda', 'flexibilidad'], 'Media', 'Boca arriba, sube la cadera y mantenla alta.'),
  E('boat-pose', 'Postura del bote', BOAT_POSE_CONFIG, ['abdomen', 'cuadriceps'], 'Difícil', 'Sentado, inclina el torso atrás y sube las piernas formando una V.'),
  E('extended-side-angle', 'Ángulo lateral extendido', EXTENDED_SIDE_ANGLE_CONFIG, ['cuadriceps', 'abdomen', 'flexibilidad'], 'Media', 'Zancada lateral con un brazo hacia el suelo y el otro extendido sobre la cabeza.'),
  E('camel-pose', 'Postura del camello', CAMEL_POSE_CONFIG, ['pecho', 'abdomen', 'flexibilidad'], 'Difícil', 'De rodillas, arquea la espalda hacia atrás y lleva las manos a los talones.'),
  E('childs-pose', 'Postura del niño', CHILDS_POSE_CONFIG, ['espalda', 'flexibilidad'], 'Fácil', 'Siéntate sobre los talones y estira los brazos al frente. Ideal para relajar.'),
  E('bow-pose', 'Postura del arco', BOW_POSE_CONFIG, ['espalda', 'pecho', 'flexibilidad'], 'Difícil', 'Boca abajo, sujeta los tobillos y eleva pecho y piernas.'),
  E('fish-pose', 'Postura del pez', FISH_POSE_CONFIG, ['pecho', 'espalda', 'flexibilidad'], 'Media', 'Boca arriba, arquea el pecho hacia arriba apoyado en los codos.'),
  E('mountain-pose', 'Postura de la montaña', MOUNTAIN_POSE_CONFIG, ['flexibilidad'], 'Fácil', 'De pie, firme y erguido, con los brazos a los lados. Postura base del yoga.'),
  E('triangle-pose', 'Postura del triángulo', TRIANGLE_POSE_CONFIG, ['isquios', 'abdomen', 'flexibilidad'], 'Media', 'Piernas abiertas, inclínate al lado con un brazo abajo y otro arriba.'),
];

export const porId = (id: string) => EJERCICIOS.find((e) => e.id === id)!;

export interface Circuito {
  id: string;
  nombre: string;
  descripcion: string;
  descansoSeg: number;
  items: { id: string; reps?: number; segundos?: number }[];
}

export const CIRCUITOS: Circuito[] = [
  { id: 'cuerpo-completo', nombre: 'Cuerpo completo (principiante)', descripcion: 'Un poco de todo: piernas, brazos y abdomen. ~15 min.', descansoSeg: 20,
    items: [{ id: 'squat', reps: 10 }, { id: 'pushup', reps: 8 }, { id: 'lunge', reps: 8 }, { id: 'situp', reps: 10 }, { id: 'plank', segundos: 20 }] },
  { id: 'tren-superior', nombre: 'Tren superior', descripcion: 'Pecho, hombros, brazos y espalda. ~12 min.', descansoSeg: 25,
    items: [{ id: 'pushup', reps: 10 }, { id: 'shoulder-press', reps: 10 }, { id: 'bicep-curl', reps: 12 }, { id: 'tricep-dip', reps: 10 }, { id: 'lateral-raise', reps: 12 }] },
  { id: 'tren-inferior', nombre: 'Tren inferior', descripcion: 'Piernas y glúteos. ~12 min.', descansoSeg: 25,
    items: [{ id: 'squat', reps: 12 }, { id: 'sumo-squat', reps: 12 }, { id: 'lunge', reps: 10 }, { id: 'glute-bridge', reps: 15 }, { id: 'calf-raise', reps: 20 }, { id: 'wall-sit', segundos: 30 }] },
  { id: 'core', nombre: 'Abdomen y core', descripcion: 'Fortalece el centro del cuerpo. ~10 min.', descansoSeg: 20,
    items: [{ id: 'situp', reps: 12 }, { id: 'leg-raise', reps: 10 }, { id: 'knee-raise', reps: 16 }, { id: 'plank', segundos: 30 }, { id: 'side-plank', segundos: 20 }] },
  { id: 'yoga', nombre: 'Yoga y flexibilidad', descripcion: 'Posturas suaves para estirar y relajar. ~12 min.', descansoSeg: 10,
    items: [{ id: 'mountain-pose', segundos: 20 }, { id: 'tree-pose', segundos: 20 }, { id: 'warrior-ii', segundos: 25 }, { id: 'triangle-pose', segundos: 25 }, { id: 'cobra-pose', segundos: 25 }, { id: 'childs-pose', segundos: 40 }] },
  { id: 'quema-grasa', nombre: 'Intenso (quema grasa)', descripcion: 'Más ritmo, menos descanso. ~15 min.', descansoSeg: 15,
    items: [{ id: 'squat', reps: 15 }, { id: 'pushup', reps: 12 }, { id: 'knee-raise', reps: 20 }, { id: 'lunge', reps: 12 }, { id: 'v-up', reps: 8 }, { id: 'plank', segundos: 40 }] },
];
