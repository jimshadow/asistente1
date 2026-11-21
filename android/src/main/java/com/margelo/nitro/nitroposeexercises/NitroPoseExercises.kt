package com.margelo.nitro.nitroposeexercises

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Matrix
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerResult
import com.margelo.nitro.NitroModules
import com.margelo.nitro.camera.HybridFrameSpec
import com.margelo.nitro.camera.public.NativeFrame
import com.margelo.nitro.core.Promise
import java.io.File
import java.nio.ByteBuffer
import kotlin.math.abs
import kotlin.math.acos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

/**
 * Implementacion Android de `NitroPoseExercises`.
 *
 * Es el equivalente de `ios/NitroPoseExercises.swift`, pero la deteccion de pose usa
 * MediaPipe PoseLandmarker (33 landmarks, mismos indices que esperan los configs de `src/config`)
 * en lugar de Apple Vision.
 *
 * Hilos:
 *  - `processFrameAndroid` se llama desde el worklet runtime de VisionCamera (un frame a la vez).
 *  - El resto de metodos se llaman desde el hilo JS.
 *  El estado se protege con [stateLock]; la inferencia con [inferenceLock].
 */
@DoNotStrip
@Keep
class NitroPoseExercises : HybridNitroPoseExercisesSpec() {

  companion object {
    private const val TAG = "NitroPoseExercises"
    private const val DEFAULT_MODEL_ASSET = "pose_landmarker_lite.task"
    private const val LANDMARK_COUNT = 33
  }

  // ─── Locks ──────────────────────────────────────────────────
  private val stateLock = Any()
  private val inferenceLock = Any()

  // ─── MediaPipe ──────────────────────────────────────────────
  private var poseLandmarker: PoseLandmarker? = null
  @Volatile private var isInitialized = false
  private var lastTimestampMs: Long = 0L

  // ─── Exercise Config ────────────────────────────────────────
  private var exerciseConfig: ExerciseConfig? = null

  // ─── Session State ──────────────────────────────────────────
  @Volatile private var _status: SessionStatus = SessionStatus.IDLE
  override val status: SessionStatus
    get() = _status

  @Volatile private var _currentPhase: ExercisePhase = ExercisePhase.UNKNOWN
  override val currentPhase: ExercisePhase
    get() = _currentPhase

  @Volatile private var _repCount: Double = 0.0
  override val repCount: Double
    get() = _repCount

  @Volatile private var _landmarks: Array<Landmark> = emptyArray()
  override val landmarks: Array<Landmark>
    get() = _landmarks

  // ─── State Machine ──────────────────────────────────────────
  private val phaseHistory = ArrayList<ExercisePhase>()
  private var repStartTimeMs: Long = 0L
  private var sessionStartTimeMs: Long = 0L
  private var targetReps: Double = 0.0
  private var countdownSeconds: Double = 0.0
  private val mainHandler = Handler(Looper.getMainLooper())
  private var countdownRunnable: Runnable? = null

  // ─── Form Tracking ──────────────────────────────────────────
  private val lastFormFeedbackTimeMs = HashMap<String, Long>()
  private val sessionFormViolations = ArrayList<FormFeedback>()
  private var repFormScore: Double = 100.0
  private var repAngleSnapshots: List<AngleSnapshot> = emptyList()
  private val allRepDurations = ArrayList<Double>()
  private val allRepFormScores = ArrayList<Double>()

  // ─── Posture Gate ───────────────────────────────────────────
  private var consecutivePostureFailures = 0
  private val postureFailureThreshold = 30 // tolerante a oclusiones (flexiones)
  private var postureWasLost = false

  // ─── Pose Tracking ──────────────────────────────────────────
  private var poseWasLost = false

  // ─── Frame Throttle ─────────────────────────────────────────
  private var frameCount = 0
  private val processEveryNFrames = 3

  // ─── Hold Tracking ──────────────────────────────────────────
  private var holdStartTimeMs: Long? = null

  // ─── Callbacks ──────────────────────────────────────────────
  override var onRepComplete: ((data: RepData) -> Unit)? = null
  override var onPhaseChange: ((phase: ExercisePhase) -> Unit)? = null
  override var onFormFeedback: ((feedback: FormFeedback) -> Unit)? = null
  override var onHoldProgress: ((progress: HoldProgress) -> Unit)? = null
  override var onPoseLost: (() -> Unit)? = null
  override var onPoseRegained: (() -> Unit)? = null
  override var onSessionComplete: ((result: SessionResult) -> Unit)? = null
  override var onPostureLost: (() -> Unit)? = null
  override var onPostureRegained: (() -> Unit)? = null

  // ═══════════════════════════════════════════════════════════
  // Lifecycle
  // ═══════════════════════════════════════════════════════════

  /**
   * @param modelPath ''  -> usa `pose_landmarker_lite.task` de los assets de la app.
   *                  'nombre.task' -> asset con ese nombre.
   *                  '/ruta/absoluta.task' o 'file:///...' -> archivo en disco.
   */
  override fun initialize(modelPath: String): Promise<Unit> {
    return Promise.parallel {
      val context = NitroModules.applicationContext?.applicationContext
        ?: throw Error("NitroPoseExercises: no hay Context de aplicacion disponible todavia.")

      val landmarker = createLandmarker(context, modelPath)

      synchronized(inferenceLock) {
        poseLandmarker?.close()
        poseLandmarker = landmarker
        lastTimestampMs = 0L
      }
      isInitialized = true
      Log.i(TAG, "Inicializado con MediaPipe PoseLandmarker")
      Unit
    }
  }

  private fun createLandmarker(context: Context, modelPath: String): PoseLandmarker {
    val baseOptions = BaseOptions.builder()
    val path = modelPath.trim()

    if (path.startsWith("/") || path.startsWith("file://")) {
      val file = File(path.removePrefix("file://"))
      if (!file.exists()) {
        throw Error("NitroPoseExercises: no existe el modelo en '${file.absolutePath}'.")
      }
      val bytes = file.readBytes()
      val buffer = ByteBuffer.allocateDirect(bytes.size)
      buffer.put(bytes)
      buffer.rewind()
      baseOptions.setModelAssetBuffer(buffer)
    } else {
      baseOptions.setModelAssetPath(if (path.isEmpty()) DEFAULT_MODEL_ASSET else path)
    }

    val options = PoseLandmarker.PoseLandmarkerOptions.builder()
      .setBaseOptions(baseOptions.build())
      .setRunningMode(RunningMode.VIDEO)
      .setNumPoses(1)
      .setMinPoseDetectionConfidence(0.5f)
      .setMinPosePresenceConfidence(0.5f)
      .setMinTrackingConfidence(0.5f)
      .build()

    try {
      return PoseLandmarker.createFromOptions(context, options)
    } catch (e: Exception) {
      throw Error(
        "NitroPoseExercises: no se pudo cargar el modelo de MediaPipe. " +
          "Comprueba que '$DEFAULT_MODEL_ASSET' esta en android/app/src/main/assets. (${e.message})",
        e
      )
    }
  }

  override fun release() {
    isInitialized = false
    synchronized(inferenceLock) {
      poseLandmarker?.close()
      poseLandmarker = null
    }
    synchronized(stateLock) {
      resetSession()
    }
  }

  override fun dispose() {
    release()
    super.dispose()
  }

  override fun isReady(): Boolean {
    synchronized(stateLock) {
      val config = exerciseConfig ?: return false
      if (_landmarks.isEmpty()) return false
      return isPostureValid(config.postureFamily, config.visibilityThreshold)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Exercise Setup
  // ═══════════════════════════════════════════════════════════

  override fun loadExercise(config: ExerciseConfig) {
    synchronized(stateLock) {
      exerciseConfig = config
      resetSession()
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Session Control
  // ═══════════════════════════════════════════════════════════

  override fun startSession(targetReps: Double, countdownSeconds: Double) {
    synchronized(stateLock) {
      resetSession()
      this.targetReps = targetReps
      this.countdownSeconds = countdownSeconds

      if (countdownSeconds > 0) {
        _status = SessionStatus.COUNTDOWN
        startCountdown()
      } else {
        _status = SessionStatus.ACTIVE
        val now = SystemClock.elapsedRealtime()
        sessionStartTimeMs = now
        repStartTimeMs = now
      }
    }
  }

  override fun pauseSession() {
    synchronized(stateLock) {
      if (_status == SessionStatus.ACTIVE) _status = SessionStatus.PAUSED
    }
  }

  override fun resumeSession() {
    synchronized(stateLock) {
      if (_status == SessionStatus.PAUSED) _status = SessionStatus.ACTIVE
    }
  }

  override fun stopSession() {
    synchronized(stateLock) {
      if (_status == SessionStatus.ACTIVE || _status == SessionStatus.PAUSED) {
        completeSession()
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Frame Processing (MediaPipe)
  // ═══════════════════════════════════════════════════════════

  /** iOS usa Apple Vision; en Android no hace nada. */
  override fun processFrameIOS(frame: HybridFrameSpec) {
    // no-op en Android
  }

  override fun processFrameAndroid(frame: HybridFrameSpec) {
    val currentStatus = _status
    if (currentStatus != SessionStatus.ACTIVE && currentStatus != SessionStatus.COUNTDOWN) return
    if (!isInitialized) return

    // Throttle: procesar 1 de cada N frames
    synchronized(stateLock) {
      frameCount += 1
      if (frameCount % processEveryNFrames != 0) return
    }

    val nativeFrame = frame as? NativeFrame ?: return

    val result: PoseLandmarkerResult = try {
      detect(nativeFrame) ?: return
    } catch (e: Throwable) {
      Log.w(TAG, "Error en la deteccion de pose: ${e.message}")
      return
    }

    val detected = result.landmarks()

    synchronized(stateLock) {
      // El estado pudo cambiar mientras corria la inferencia
      if (_status != SessionStatus.ACTIVE && _status != SessionStatus.COUNTDOWN) return

      if (detected.isEmpty() || detected[0].isEmpty()) {
        if (!poseWasLost) {
          poseWasLost = true
          onPoseLost?.invoke()
        }
        _landmarks = emptyArray()
        return
      }

      if (poseWasLost) {
        poseWasLost = false
        onPoseRegained?.invoke()
      }

      // Coordenadas normalizadas (0..1), origen arriba-izquierda, imagen ya "de pie" (rotada).
      // NO se aplica espejo: el overlay (skia.tsx) ya invierte X para la camara frontal.
      val pose = detected[0]
      val count = min(pose.size, LANDMARK_COUNT)
      val array = Array(LANDMARK_COUNT) { i ->
        if (i < count) {
          val lm = pose[i]
          Landmark(
            x = lm.x().toDouble(),
            y = lm.y().toDouble(),
            z = lm.z().toDouble(),
            visibility = lm.visibility().orElse(0f).toDouble()
          )
        } else {
          Landmark(0.0, 0.0, 0.0, 0.0)
        }
      }
      _landmarks = array

      if (_status == SessionStatus.ACTIVE) {
        processExerciseLogic()
      }
    }
  }

  /** Convierte el ImageProxy de VisionCamera en un Bitmap "de pie" y ejecuta PoseLandmarker. */
  private fun detect(nativeFrame: NativeFrame): PoseLandmarkerResult? {
    val image = nativeFrame.image
    val rotationDegrees = image.imageInfo.rotationDegrees

    val raw: Bitmap = image.toBitmap()
    var upright: Bitmap = raw
    try {
      if (rotationDegrees != 0) {
        val matrix = Matrix()
        matrix.postRotate(rotationDegrees.toFloat())
        upright = Bitmap.createBitmap(raw, 0, 0, raw.width, raw.height, matrix, true)
      }

      val mpImage = BitmapImageBuilder(upright).build()

      val result: PoseLandmarkerResult? = synchronized(inferenceLock) {
        val landmarker = poseLandmarker
        if (landmarker == null) {
          null
        } else {
          // En modo VIDEO los timestamps deben ser estrictamente crecientes
          val ts = max(SystemClock.uptimeMillis(), lastTimestampMs + 1)
          lastTimestampMs = ts
          landmarker.detectForVideo(mpImage, ts)
        }
      }
      return result
    } finally {
      if (upright !== raw) upright.recycle()
      raw.recycle()
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Exercise Logic Engine
  // ═══════════════════════════════════════════════════════════

  private fun processExerciseLogic() {
    val config = exerciseConfig ?: return
    val lms = _landmarks
    if (lms.isEmpty()) return

    // Los ejercicios "hold" toleran 3x mas perdida de visibilidad
    val failureThreshold =
      if (config.type == ExerciseType.HOLD) postureFailureThreshold * 3 else postureFailureThreshold

    // Posture gate con histeresis
    if (!isPostureValid(config.postureFamily, config.visibilityThreshold)) {
      consecutivePostureFailures += 1
      if (consecutivePostureFailures >= failureThreshold) {
        if (!postureWasLost) {
          postureWasLost = true
          onPostureLost?.invoke()
        }
        // Solo se borra el historial tras una perdida prolongada
        if (consecutivePostureFailures >= failureThreshold * 3) {
          _currentPhase = ExercisePhase.UNKNOWN
          phaseHistory.clear()
        }
      }
      return
    }

    consecutivePostureFailures = 0
    if (postureWasLost) {
      postureWasLost = false
      onPostureRegained?.invoke()
    }

    // Calculo de angulos
    val visThreshold = config.visibilityThreshold
    val currentAngles = HashMap<String, Double>()
    val snapshots = ArrayList<AngleSnapshot>()

    for (def in config.angles) {
      val a = def.landmarkA.toInt()
      val b = def.landmarkB.toInt()
      val c = def.landmarkC.toInt()

      if (a >= lms.size || b >= lms.size || c >= lms.size) continue
      if (a < 0 || b < 0 || c < 0) continue

      if (lms[a].visibility <= visThreshold ||
        lms[b].visibility <= visThreshold ||
        lms[c].visibility <= visThreshold
      ) continue

      val angle = calculateAngle(lms[a], lms[b], lms[c])
      currentAngles[def.name] = angle
      snapshots.add(AngleSnapshot(def.name, angle))
    }

    repAngleSnapshots = snapshots

    val detectedPhase = determinePhase(currentAngles, config)

    if (detectedPhase != _currentPhase && detectedPhase != ExercisePhase.UNKNOWN) {
      val previous = _currentPhase
      _currentPhase = detectedPhase
      onPhaseChange?.invoke(detectedPhase)
      handlePhaseTransition(previous, detectedPhase, config)
    }

    checkFormRules(currentAngles, config)

    if (config.type == ExerciseType.HOLD) {
      handleHoldProgress(currentAngles, config)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Posture Gates
  // ═══════════════════════════════════════════════════════════

  private fun isPostureValid(family: PostureFamily, threshold: Double): Boolean {
    val lms = _landmarks
    if (lms.size < LANDMARK_COUNT) return false

    val ls = lms[11]
    val rs = lms[12]
    val lh = lms[23]
    val rh = lms[24]
    val lk = lms[25]
    val rk = lms[26]
    val la = lms[27]
    val ra = lms[28]
    val lw = lms[15]
    val rw = lms[16]

    // Los hombros son obligatorios; el resto es opcional para encuadres cercanos
    val shouldersVisible = ls.visibility > threshold && rs.visibility > threshold
    if (!shouldersVisible) return false

    val hipsVisible = lh.visibility > threshold && rh.visibility > threshold
    val kneesVisible = lk.visibility > threshold && rk.visibility > threshold
    val anklesVisible = la.visibility > threshold && ra.visibility > threshold
    val wristsVisible = lw.visibility > threshold && rw.visibility > threshold
    val oneWristVisible = lw.visibility > threshold || rw.visibility > threshold

    val shoulderY = (ls.y + rs.y) / 2
    val shoulderX = (ls.x + rs.x) / 2
    val hipY = if (hipsVisible) (lh.y + rh.y) / 2 else shoulderY
    val hipX = if (hipsVisible) (lh.x + rh.x) / 2 else shoulderX
    val kneeY = if (kneesVisible) (lk.y + rk.y) / 2 else hipY
    val ankleY = if (anklesVisible) (la.y + ra.y) / 2 else kneeY

    // Invariante al espejo: funciona igual con camara frontal y trasera
    val shoulderWidth = abs(ls.x - rs.x)

    return when (family) {
      PostureFamily.HORIZONTALPRONE, PostureFamily.SUPINE -> {
        // Caso A: vista lateral, cuerpo completo en una banda horizontal
        if (hipsVisible) {
          val ys = if (anklesVisible) listOf(shoulderY, hipY, ankleY) else listOf(shoulderY, hipY)
          val ySpread = (ys.maxOrNull() ?: 0.0) - (ys.minOrNull() ?: 0.0)
          if (ySpread < 0.25) return true
        }

        // Caso B: vista frontal en posicion prona: hombros + al menos una muneca
        if (!oneWristVisible) return false

        val wristY = if (wristsVisible) (lw.y + rw.y) / 2 else max(lw.y, rw.y)

        val handsLowerOrLevel = wristY > shoulderY - 0.08
        val torsoFacing = shoulderWidth > 0.06
        handsLowerOrLevel && torsoFacing
      }

      PostureFamily.STANDINGUPRIGHT -> {
        if (hipsVisible) {
          if (kneesVisible) {
            shoulderY < hipY - 0.05 &&
              hipY < kneeY + 0.05 &&
              (if (anklesVisible) kneeY < ankleY else true)
          } else {
            shoulderY < hipY - 0.05
          }
        } else {
          // Caderas fuera de cuadro (primer plano frontal)
          shoulderWidth > 0.08
        }
      }

      PostureFamily.SEATED -> {
        if (hipsVisible && kneesVisible) {
          shoulderY < hipY - 0.05 && abs(hipY - kneeY) < 0.20
        } else if (hipsVisible) {
          shoulderY < hipY - 0.05
        } else {
          shoulderWidth > 0.08
        }
      }

      PostureFamily.SIDEPLANK -> {
        if (!hipsVisible) return false
        val ySpread = abs(shoulderY - hipY)
        val shoulderHipDx = abs(shoulderX - hipX)
        ySpread < 0.20 && shoulderHipDx < 0.15
      }

      PostureFamily.INVERTED -> {
        if (!hipsVisible || !anklesVisible) return false
        hipY < shoulderY && hipY < ankleY
      }

      PostureFamily.NONE -> true
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Angle Calculation
  // ═══════════════════════════════════════════════════════════

  private fun calculateAngle(a: Landmark, vertex: Landmark, c: Landmark): Double {
    val vaX = a.x - vertex.x
    val vaY = a.y - vertex.y
    val vcX = c.x - vertex.x
    val vcY = c.y - vertex.y

    val dot = vaX * vcX + vaY * vcY
    val magA = sqrt(vaX * vaX + vaY * vaY)
    val magC = sqrt(vcX * vcX + vcY * vcY)

    if (magA <= 0.0 || magC <= 0.0) return 0.0

    val cosAngle = max(-1.0, min(1.0, dot / (magA * magC)))
    return Math.toDegrees(acos(cosAngle))
  }

  // ═══════════════════════════════════════════════════════════
  // Phase Detection
  // ═══════════════════════════════════════════════════════════

  private fun determinePhase(angles: Map<String, Double>, config: ExerciseConfig): ExercisePhase {
    for (threshold in config.phases) {
      val angle = angles[threshold.angleName] ?: continue
      if (angle >= threshold.minAngle && angle <= threshold.maxAngle) {
        return threshold.phase
      }
    }
    return ExercisePhase.UNKNOWN
  }

  // ═══════════════════════════════════════════════════════════
  // Rep Counting State Machine
  // ═══════════════════════════════════════════════════════════

  private fun handlePhaseTransition(
    previousPhase: ExercisePhase,
    newPhase: ExercisePhase,
    config: ExerciseConfig
  ) {
    if (config.type != ExerciseType.REP) return

    phaseHistory.add(newPhase)

    val repSeq = config.repSequence.toList()
    if (repSeq.isNotEmpty() && phaseHistory.size >= repSeq.size) {
      val tail = phaseHistory.subList(phaseHistory.size - repSeq.size, phaseHistory.size).toList()

      if (tail == repSeq) {
        val now = SystemClock.elapsedRealtime()
        val repDuration = (now - repStartTimeMs).toDouble()

        // Minimo 800 ms por repeticion: evita falsos positivos por ruido
        if (repDuration <= 800) {
          phaseHistory.clear()
          phaseHistory.add(newPhase)
          return
        }

        // No cuenta si la tecnica es muy mala
        if (repFormScore <= 30) {
          onFormFeedback?.invoke(
            FormFeedback(
              ruleName = "poorForm",
              message = "Fix your form before continuing",
              severity = FormSeverity.ERROR
            )
          )
          repFormScore = 100.0
          phaseHistory.clear()
          phaseHistory.add(newPhase)
          return
        }

        _repCount += 1

        val repData = RepData(
          repNumber = _repCount,
          durationMs = repDuration,
          formScore = repFormScore,
          angles = repAngleSnapshots.toTypedArray()
        )

        allRepDurations.add(repDuration)
        allRepFormScores.add(repFormScore)

        onRepComplete?.invoke(repData)

        repStartTimeMs = now
        repFormScore = 100.0
        phaseHistory.clear()
        phaseHistory.add(newPhase)

        if (targetReps > 0 && _repCount >= targetReps) {
          completeSession()
        }
      }
    }

    val maxHistory = max(1, config.repSequence.size * 2)
    while (phaseHistory.size > maxHistory) {
      phaseHistory.removeAt(0)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Form Validation
  // ═══════════════════════════════════════════════════════════

  private fun checkFormRules(currentAngles: Map<String, Double>, config: ExerciseConfig) {
    val now = SystemClock.elapsedRealtime()
    val throttleMs = 3000L

    for (rule in config.formRules) {
      val angle = currentAngles[rule.angleName] ?: continue

      val isViolating = angle < rule.minAngle || angle > rule.maxAngle
      if (!isViolating) continue

      val last = lastFormFeedbackTimeMs[rule.name]
      if (last != null && now - last < throttleMs) continue

      val feedback = FormFeedback(
        ruleName = rule.name,
        message = rule.message,
        severity = rule.severity
      )

      when (rule.severity) {
        FormSeverity.WARNING -> repFormScore = max(0.0, repFormScore - 5)
        FormSeverity.ERROR -> repFormScore = max(0.0, repFormScore - 15)
        FormSeverity.INFO -> Unit
      }

      sessionFormViolations.add(feedback)
      lastFormFeedbackTimeMs[rule.name] = now
      onFormFeedback?.invoke(feedback)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Hold Progress
  // ═══════════════════════════════════════════════════════════

  private fun handleHoldProgress(currentAngles: Map<String, Double>, config: ExerciseConfig) {
    if (config.holdDurationMs <= 0) return

    var inPosition = true
    for (threshold in config.phases) {
      val angle = currentAngles[threshold.angleName]
      if (angle == null || angle < threshold.minAngle || angle > threshold.maxAngle) {
        inPosition = false
        break
      }
    }

    if (inPosition) {
      val now = SystemClock.elapsedRealtime()
      val start = holdStartTimeMs ?: now.also { holdStartTimeMs = it }

      val elapsed = (now - start).toDouble()
      val stability = min(100.0, max(0.0, repFormScore))

      onHoldProgress?.invoke(
        HoldProgress(
          elapsedMs = elapsed,
          targetMs = config.holdDurationMs,
          stability = stability
        )
      )

      if (elapsed >= config.holdDurationMs) {
        completeSession()
      }
    } else {
      holdStartTimeMs = null
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Session Completion
  // ═══════════════════════════════════════════════════════════

  private fun completeSession() {
    _status = SessionStatus.COMPLETED

    val totalDuration = (SystemClock.elapsedRealtime() - sessionStartTimeMs).toDouble()
    val avgRepDuration =
      if (allRepDurations.isEmpty()) 0.0 else allRepDurations.sum() / allRepDurations.size
    val avgFormScore =
      if (allRepFormScores.isEmpty()) 100.0 else allRepFormScores.sum() / allRepFormScores.size

    val result = SessionResult(
      totalReps = _repCount,
      totalDurationMs = totalDuration,
      averageRepDurationMs = avgRepDuration,
      averageFormScore = avgFormScore,
      formViolations = sessionFormViolations.toTypedArray(),
      angleHistory = repAngleSnapshots.toTypedArray()
    )

    onSessionComplete?.invoke(result)
  }

  // ═══════════════════════════════════════════════════════════
  // Countdown
  // ═══════════════════════════════════════════════════════════

  private fun startCountdown() {
    var remaining = countdownSeconds
    cancelCountdown()

    val runnable = object : Runnable {
      override fun run() {
        synchronized(stateLock) {
          if (countdownRunnable !== this) return
          remaining -= 1
          if (remaining <= 0) {
            countdownRunnable = null
            if (_status == SessionStatus.COUNTDOWN) {
              _status = SessionStatus.ACTIVE
              val now = SystemClock.elapsedRealtime()
              sessionStartTimeMs = now
              repStartTimeMs = now
            }
          } else {
            mainHandler.postDelayed(this, 1000L)
          }
        }
      }
    }
    countdownRunnable = runnable
    mainHandler.postDelayed(runnable, 1000L)
  }

  private fun cancelCountdown() {
    countdownRunnable?.let { mainHandler.removeCallbacks(it) }
    countdownRunnable = null
  }

  // ═══════════════════════════════════════════════════════════
  // Reset (llamar con stateLock tomado)
  // ═══════════════════════════════════════════════════════════

  private fun resetSession() {
    _status = SessionStatus.IDLE
    _currentPhase = ExercisePhase.UNKNOWN
    _repCount = 0.0
    _landmarks = emptyArray()
    phaseHistory.clear()
    repFormScore = 100.0
    repAngleSnapshots = emptyList()
    allRepDurations.clear()
    allRepFormScores.clear()
    sessionFormViolations.clear()
    lastFormFeedbackTimeMs.clear()
    holdStartTimeMs = null
    poseWasLost = false
    targetReps = 0.0
    countdownSeconds = 0.0
    cancelCountdown()
    frameCount = 0
    consecutivePostureFailures = 0
    postureWasLost = false
  }
}
