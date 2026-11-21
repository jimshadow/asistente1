const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// La libreria vive en la carpeta padre y el ejemplo la importa por nombre.
const root = path.resolve(__dirname, '..');
const pkg = require('../package.json');

// Dependencias que SOLO deben existir una vez (la copia del ejemplo).
const singletons = Object.keys(pkg.peerDependencies || {});

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const extraNodeModules = { [pkg.name]: root };
for (const name of singletons) {
  extraNodeModules[name] = path.join(__dirname, 'node_modules', name);
}

/** @type {import('@react-native/metro-config').MetroConfig} */
const config = {
  watchFolders: [root],
  resolver: {
    // Evita que los archivos de ../src resuelvan react / react-native desde ../node_modules
    // (dos copias de React rompen la app).
    blockList: singletons.map(
      (name) =>
        new RegExp(
          '^' +
            escapeRegExp(path.join(root, 'node_modules', name)) +
            '([\\\\/].*)?$'
        )
    ),
    extraNodeModules,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
