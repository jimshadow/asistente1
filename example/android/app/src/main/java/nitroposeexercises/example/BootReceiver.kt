package nitroposeexercises.example

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Reprograma la alarma al reiniciar el teléfono. */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(ctx: Context, intent: Intent) {
    AlarmScheduler.scheduleNext(ctx)
  }
}
