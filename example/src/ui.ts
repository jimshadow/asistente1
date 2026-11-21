import { StyleSheet } from 'react-native';

export const C = {
  bg: '#0f1b1e', card: '#17282c', card2: '#1f353a', acc: '#2ec4b6', acc2: '#ffbf47',
  txt: '#ffffff', sub: '#9db4b8', bad: '#ff6b6b',
};

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, paddingTop: 36 },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  h1: { color: C.txt, fontSize: 26, fontWeight: '800' },
  h2: { color: C.txt, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  sub: { color: C.sub, fontSize: 14 },
  body: { color: C.txt, fontSize: 15, lineHeight: 21 },
  list: { padding: 12, paddingBottom: 90 },
  card: { backgroundColor: C.card, borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  cardBody: { padding: 12 },
  cardImg: { width: '100%', aspectRatio: 1.6, backgroundColor: '#eef6f7' },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { backgroundColor: C.card2, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  chipOn: { backgroundColor: C.acc },
  chipTxt: { color: C.txt, fontSize: 14 },
  chipTxtOn: { color: '#00201d', fontWeight: '700' },
  tag: { color: C.acc, fontSize: 12, fontWeight: '700' },
  btn: { backgroundColor: C.acc, paddingVertical: 14, paddingHorizontal: 22, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  btnTxt: { color: '#00201d', fontSize: 17, fontWeight: '800' },
  btn2: { backgroundColor: C.card2, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  btn2Txt: { color: C.txt, fontSize: 16, fontWeight: '600' },
  tabs: { flexDirection: 'row', backgroundColor: C.card, borderTopWidth: 1, borderTopColor: '#223a3f' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabTxt: { color: C.sub, fontSize: 12, marginTop: 2 },
  tabTxtOn: { color: C.acc, fontWeight: '800' },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 6 },
  stepBtn: { backgroundColor: C.card2, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  stepBtnTxt: { color: C.txt, fontSize: 24, fontWeight: '700' },
  stepVal: { color: C.txt, fontSize: 40, fontWeight: '800', minWidth: 80, textAlign: 'center' },
  stepValSm: { color: C.txt, fontSize: 24, fontWeight: '800', minWidth: 70, textAlign: 'center' },
  label: { color: C.sub, fontSize: 13, marginTop: 10, marginBottom: 4 },
  // entrenamiento
  fullDark: { flex: 1, backgroundColor: C.bg, padding: 16, paddingTop: 44 },
  hero: { width: '100%', aspectRatio: 1.6, borderRadius: 16, backgroundColor: '#eef6f7', marginVertical: 12 },
  bigNum: { color: C.txt, fontSize: 72, fontWeight: '900', textAlign: 'center' },
});
