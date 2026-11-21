package nitroposeexercises.example

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build

class AlarmReceiver : BroadcastReceiver() {
  companion object {
    const val CHANNEL = "alarma_ejercicio_v1"
    const val NOTIF_ID = 4242

    fun ensureChannel(ctx: Context) {
      if (Build.VERSION.SDK_INT < 26) return
      val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      if (nm.getNotificationChannel(CHANNEL) != null) return
      val ch = NotificationChannel(CHANNEL, "Alarma de ejercicio", NotificationManager.IMPORTANCE_HIGH)
      ch.description = "Avisos para la hora de entrenar"
      ch.enableVibration(true)
      ch.vibrationPattern = longArrayOf(0, 700, 400, 700, 400, 700)
      val attrs = AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()
      ch.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM), attrs)
      ch.lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      nm.createNotificationChannel(ch)
    }
  }

  override fun onReceive(ctx: Context, intent: Intent) {
    val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    when (intent.action) {
      AlarmScheduler.ACTION_STOP -> {
        // El usuario descartó: se cancelan las repeticiones de hoy y se agenda el próximo día.
        nm.cancel(NOTIF_ID)
        AlarmScheduler.scheduleNext(ctx)
      }
      AlarmScheduler.ACTION_FIRE -> {
        val rep = intent.getIntExtra("rep", 0)
        val cfg = AlarmScheduler.load(ctx)
        if (!cfg.enabled) return
        ensureChannel(ctx)
        val open = PendingIntent.getActivity(ctx, 1,
          Intent(ctx, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
          PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val stop = PendingIntent.getBroadcast(ctx, 2,
          Intent(ctx, AlarmReceiver::class.java).setAction(AlarmScheduler.ACTION_STOP),
          PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val b = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(ctx, CHANNEL) else Notification.Builder(ctx)
        b.setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
          .setContentTitle("¡Hora de entrenar! 💪")
          .setContentText("Aviso ${rep + 1} de ${cfg.repeats}. Toca para abrir la app.")
          .setCategory(Notification.CATEGORY_ALARM)
          .setAutoCancel(true)
          .setContentIntent(open)
          .setFullScreenIntent(open, true)
          .addAction(Notification.Action.Builder(null, "Ya voy / Detener", stop).build())
        if (Build.VERSION.SDK_INT < 26) {
          b.setPriority(Notification.PRIORITY_MAX)
          b.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM))
          b.setVibrate(longArrayOf(0, 700, 400, 700))
        }
        nm.notify(NOTIF_ID, b.build())
        if (rep + 1 < cfg.repeats) AlarmScheduler.scheduleRepeat(ctx, rep + 1)
        else AlarmScheduler.scheduleNext(ctx)
      }
    }
  }
}
