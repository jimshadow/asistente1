<#
.SYNOPSIS
  Instala dependencias, genera el codigo Nitro y compila (y opcionalmente instala) el APK debug
  usando el JDK y el SDK de Android Studio, todo desde PowerShell.
.EXAMPLE
  .\build-android.ps1                 # compila
  .\build-android.ps1 -Install        # compila e instala en el telefono (USB debugging)
  .\build-android.ps1 -Install -Start # ademas arranca Metro
  .\build-android.ps1 -Clean          # limpia antes de compilar
#>
param([switch]$Install, [switch]$Start, [switch]$Clean, [switch]$SkipNpm, [switch]$Release)

$ErrorActionPreference = 'Stop'
$root    = $PSScriptRoot
$example = Join-Path $root 'example'
$android = Join-Path $example 'android'

function Step($m) { Write-Host "`n== $m" -ForegroundColor Cyan }

# 1) Ruta: espacios / longitud rompen CMake+Ninja en Windows
if ($root -match ' ' -or $root.Length -gt 60) {
  Write-Host "AVISO: la ruta '$root' tiene espacios o es larga. Si falla CMake/ninja, mueve el proyecto a algo como C:\dev\pose" -ForegroundColor Yellow
}

# 2) JDK + SDK de Android Studio
Step 'Entorno (JDK / Android SDK)'
$jbr = 'C:\Program Files\Android\Android Studio\jbr'
if (-not (Test-Path $jbr)) { $jbr = "$env:LOCALAPPDATA\Programs\Android Studio\jbr" }
if (-not $env:JAVA_HOME -and (Test-Path $jbr)) { $env:JAVA_HOME = $jbr }
if (-not $env:JAVA_HOME) { throw 'No encuentro el JDK. Define JAVA_HOME (p.ej. la carpeta jbr de Android Studio).' }
if (-not $env:ANDROID_HOME) { $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk" }
if (-not (Test-Path $env:ANDROID_HOME)) { throw "No encuentro el Android SDK en $env:ANDROID_HOME. Abre Android Studio > SDK Manager una vez." }
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:Path"
Write-Host "JAVA_HOME   = $env:JAVA_HOME"
Write-Host "ANDROID_HOME = $env:ANDROID_HOME"

# local.properties con la ruta real del SDK (el que venia era de otro PC)
$sdkEsc = $env:ANDROID_HOME -replace '\\', '\\'
Set-Content -Path (Join-Path $android 'local.properties') -Value "sdk.dir=$sdkEsc" -Encoding ASCII

# Gradle exigiria JDK 17 exacto con este archivo; usamos el JDK de Android Studio
$daemon = Join-Path $android 'gradle\gradle-daemon-jvm.properties'
if (Test-Path $daemon) { Rename-Item $daemon 'gradle-daemon-jvm.properties.disabled' -Force }

# 3) Componentes del SDK (si existe sdkmanager; si no, Gradle los descarga solo)
if (Get-Command sdkmanager -ErrorAction SilentlyContinue) {
  Step 'Componentes del SDK'
  $yes = ('y' * 30) -split '' | Where-Object { $_ }
  $yes | & sdkmanager --licenses | Out-Null
  & sdkmanager 'platforms;android-36' 'build-tools;36.0.0' 'ndk;27.1.12297006' 'cmake;3.22.1'
}

# 4) Modelo MediaPipe
$assets = Join-Path $android 'app\src\main\assets'
$model  = Join-Path $assets 'pose_landmarker_lite.task'
if (-not (Test-Path $model)) {
  Step 'Descargando pose_landmarker_lite.task'
  New-Item -ItemType Directory -Force $assets | Out-Null
  Invoke-WebRequest 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task' -OutFile $model
}

# 5) npm + nitrogen
if (-not $SkipNpm) {
  Step 'npm install (libreria)'
  Push-Location $root; npm install; if ($LASTEXITCODE) { throw 'npm install fallo' }
  Step 'nitrogen (genera el codigo nativo)'
  npx nitrogen; if ($LASTEXITCODE) { throw 'nitrogen fallo' }
  Pop-Location
  Step 'npm install (example)'
  Push-Location $example; npm install; if ($LASTEXITCODE) { throw 'npm install example fallo' }
  Pop-Location
}

# 6) Gradle
Push-Location $android
try {
  if ($Clean) { Step 'gradlew clean'; .\gradlew.bat clean }
  $task = if ($Release) { 'assembleRelease' } else { 'assembleDebug' }
  Step "gradlew $task"
  .\gradlew.bat $task -PreactNativeArchitectures=arm64-v8a
  if ($LASTEXITCODE) { throw 'La compilacion fallo (revisa el error de arriba)' }
} finally { Pop-Location }

$apk = if ($Release) { Join-Path $android 'app\build\outputs\apk\release\app-release.apk' } else { Join-Path $android 'app\build\outputs\apk\debug\app-debug.apk' }
Write-Host "`nAPK: $apk" -ForegroundColor Green

if ($Install) {
  Step 'adb install'
  adb install -r $apk
  if ($LASTEXITCODE) { throw 'adb install fallo (telefono conectado y con depuracion USB?)' }
  adb reverse tcp:8081 tcp:8081
  adb shell monkey -p nitroposeexercises.example -c android.intent.category.LAUNCHER 1 | Out-Null
}
if ($Start -and -not $Release) { Step 'Metro'; Push-Location $example; npx react-native start; Pop-Location }
