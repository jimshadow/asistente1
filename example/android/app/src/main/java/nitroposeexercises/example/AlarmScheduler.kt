package nitroposeexercises.example

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import java.util.Calendar

/** Guarda la configuración de la alarma y programa disparos exactos con AlarmManager. */
object AlarmScheduler {
  private const val PREFS = "alarma_ejercicio"
  const val ACTION_FIRE = "nitroposeexercises.example.ALARMA_DISPARO"
  const val ACTION_STOP = "nitroposeexercises.example.ALARMA_DETENER"
  private const val REQ_FIRE = 7001

  data class Config(
    val enabled: Boolean, val hour: Int, val minute: Int,
    val days: Set<Int>, // Calendar.SUNDAY..SATURDAY (1..7); vacío = todos los días
    val repeats: Int, val intervalMin: Int,
  )

  fun load(ctx: Context): Config {
    val p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val days = (p.getString("days", "") ?: "").split(",").mapNotNull { it.toIntOrNull() }.toSet()
    return Config(p.getBoolean("enabled", false), p.getInt("hour", 18), p.getInt("minute", 0),
      days, p.getInt("repeats", 3), p.getInt("interval", 5))
  }

  fun save(ctx: Context, c: Config) {
    ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      .putBoolean("enabled", c.enabled).putInt("hour", c.hour).putInt("minute", c.minute)
      .putString("days", c.days.joinToString(",")).putInt("repeats", c.repeats)
      .putInt("interval", c.intervalMin).apply()
  }

  private fun pending(ctx: Context, repIndex: Int): PendingIntent {
    val i = Intent(ctx, AlarmReceiver::class.java).setAction(ACTION_FIRE).putExtra("rep", repIndex)
    return PendingIntent.getBroadcast(ctx, REQ_FIRE, i,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun showIntent(ctx: Context): PendingIntent {
    val i = Intent(ctx, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    return PendingIntent.getActivity(ctx, 0, i, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
  }

  private fun setAt(ctx: Context, whenMs: Long, repIndex: Int) {
    val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    am.setAlarmClock(AlarmManager.AlarmClockInfo(whenMs, showIntent(ctx)), pending(ctx, repIndex))
  }

  /** Próxima fecha válida (hora/minuto en uno de los días elegidos). */
  fun nextOccurrence(c: Config, from: Long = System.currentTimeMillis()): Long {
    val cal = Calendar.getInstance()
    for (offset in 0..7) {
      cal.timeInMillis = from
      cal.add(Calendar.DAY_OF_YEAR, offset)
      cal.set(Calendar.HOUR_OF_DAY, c.hour); cal.set(Calendar.MINUTE, c.minute)
      cal.set(Calendar.SECOND, 0); cal.set(Calendar.MILLISECOND, 0)
      val dayOk = c.days.isEmpty() || c.days.contains(cal.get(Calendar.DAY_OF_WEEK))
      if (dayOk && cal.timeInMillis > from + 1000) return cal.timeInMillis
    }
    return from + 24 * 3600 * 1000
  }

  fun scheduleNext(ctx: Context) {
    val c = load(ctx)
    if (!c.enabled) { cancel(ctx); return }
    setAt(ctx, nextOccurrence(c), 0)
  }

  fun scheduleRepeat(ctx: Context, nextRepIndex: Int) {
    val c = load(ctx)
    setAt(ctx, System.currentTimeMillis() + c.intervalMin * 60_000L, nextRepIndex)
  }

  fun cancel(ctx: Context) {
    val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    am.cancel(pending(ctx, 0))
  }
}
