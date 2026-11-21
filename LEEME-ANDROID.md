# Compilar en Windows (PowerShell)

1. Copia esta carpeta sobre la tuya (conserva tu `pose_landmarker_lite.task` en
   `example/android/app/src/main/assets/`; si no esta, el script lo descarga).
   Mejor ruta corta y sin espacios, p. ej. `C:\dev\pose`.
2. En PowerShell, dentro de la carpeta:
   ```powershell
   Set-ExecutionPolicy -Scope Process Bypass
   .\build-android.ps1 -Install -Start
   ```
   Necesitas Node >= 22, Android Studio (JDK + SDK) y un telefono real con depuracion USB.

Que se arreglo / agrego: `package.json`, `nitro.json`, `tsconfig.json`, podspec, todo `android/`
(Kotlin + MediaPipe, CMake, Gradle), `example/` (package.json, metro, babel, index.js, build.gradle raiz),
`android.builtInKotlin=false` / `android.newDsl=false` en gradle.properties (necesario con AGP 9),
y en `skia.tsx` la API `PathBuilder` de Skia 2.14.
