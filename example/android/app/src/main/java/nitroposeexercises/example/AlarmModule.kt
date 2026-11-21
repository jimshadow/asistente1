package nitroposeexercises.example

import android.Manifest
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager

class AlarmModule(private val rc: ReactApplicationContext) : ReactContextBaseJavaModule(rc) {
  override fun getName() = "AlarmaEjercicio"

  private fun toMap(c: AlarmScheduler.Config): WritableMap {
    val m = Arguments.createMap()
    m.putBoolean("activa", c.enabled); m.putInt("hora", c.hour); m.putInt("minuto", c.minute)
    val a = Arguments.createArray(); c.days.sorted().forEach { a.pushInt(it) }
    m.putArray("dias", a); m.putInt("repeticiones", c.repeats); m.putInt("intervaloMin", c.intervalMin)
    if (c.enabled) m.putDouble("proxima", AlarmScheduler.nextOccurrence(c).toDouble())
    return m
  }

  @ReactMethod
  fun obtener(promise: Promise) { promise.resolve(toMap(AlarmScheduler.load(rc))) }

  /** dias: Calendar.SUNDAY..SATURDAY (1=domingo ... 7=sábado); vacío = todos. */
  @ReactMethod
  fun programar(hora: Int, minuto: Int, dias: ReadableArray, repeticiones: Int, intervaloMin: Int, promise: Promise) {
    try {
      val d = HashSet<Int>()
      for (i in 0 until dias.size()) d.add(dias.getInt(i))
      val cfg = AlarmScheduler.Config(true, hora, minuto, d, repeticiones.coerceIn(1, 20), intervaloMin.coerceIn(1, 60))
      AlarmScheduler.save(rc, cfg)
      AlarmReceiver.ensureChannel(rc)
      AlarmScheduler.scheduleNext(rc)
      promise.resolve(toMap(cfg))
    } catch (e: Exception) { promise.reject("ALARMA", e) }
  }

  @ReactMethod
  fun cancelar(promise: Promise) {
    val c = AlarmScheduler.load(rc)
    AlarmScheduler.save(rc, c.copy(enabled = false))
    AlarmScheduler.cancel(rc)
    (rc.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).cancel(AlarmReceiver.NOTIF_ID)
    promise.resolve(null)
  }

  @ReactMethod
  fun pedirPermisoNotificaciones(promise: Promise) {
    if (Build.VERSION.SDK_INT < 33) { promise.resolve(true); return }
    val granted = ContextCompat.checkSelfPermission(rc, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
    if (!granted) {
      val act: android.app.Activity? = rc.currentActivity
      if (act != null) ActivityCompat.requestPermissions(act, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 9001)
    }
    promise.resolve(granted)
  }

  private var tono: ToneGenerator? = null

  /** tipo: "bien" = tono agudo de acierto, "mal" = tono grave, "fin" = tono de fin de ejercicio. */
  @ReactMethod
  fun sonido(tipo: String) {
    try {
      if (tono == null) tono = ToneGenerator(AudioManager.STREAM_MUSIC, 90)
      when (tipo) {
        "bien" -> tono?.startTone(ToneGenerator.TONE_PROP_ACK, 180)
        "mal" -> tono?.startTone(ToneGenerator.TONE_PROP_NACK, 250)
        else -> tono?.startTone(ToneGenerator.TONE_CDMA_CONFIRM, 500)
      }
    } catch (e: Exception) { /* sin sonido */ }
  }

  override fun invalidate() { tono?.release(); tono = null; super.invalidate() }

  @ReactMethod fun addListener(eventName: String) {}
  @ReactMethod fun removeListeners(count: Int) {}
}

class AlarmPackage : com.facebook.react.ReactPackage {
  override fun createNativeModules(ctx: ReactApplicationContext): List<NativeModule> = listOf(AlarmModule(ctx))
  override fun createViewManagers(ctx: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
