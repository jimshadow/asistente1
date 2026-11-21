module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Requerido por react-native-reanimated 4 / VisionCamera frame processors ('worklet').
  // Debe ir el ultimo.
  plugins: ['react-native-worklets/plugin'],
};
