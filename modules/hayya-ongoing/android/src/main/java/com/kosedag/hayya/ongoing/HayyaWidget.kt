package com.kosedag.hayya.ongoing

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.SystemClock
import android.widget.RemoteViews
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

/** Ana ekran widget'ı: sonraki vakit, canlı geri sayım (Chronometer) ve günün vakitleri. */
class HayyaWidget : AppWidgetProvider() {
  companion object {
    const val ACTION_TICK = "com.kosedag.hayya.widget.TICK"
    private val TR: TimeZone = TimeZone.getTimeZone("Europe/Istanbul")

    private fun fmt(p: String, ms: Long): String { val f = SimpleDateFormat(p, Locale.US); f.timeZone = TR; return f.format(ms) }

    fun updateAll(ctx: Context) {
      val mgr = AppWidgetManager.getInstance(ctx)
      val ids = mgr.getAppWidgetIds(ComponentName(ctx, HayyaWidget::class.java))
      if (ids.isEmpty()) return
      val data = OngoingStore.load(ctx)
      val now = System.currentTimeMillis()
      val v = RemoteViews(ctx.packageName, R.layout.hayya_widget)
      val next = data?.items?.firstOrNull { it.time > now }
      if (data == null || next == null) {
        v.setTextViewText(R.id.hw_title, "Hayya")
        v.setTextViewText(R.id.hw_city, "")
        v.setTextViewText(R.id.hw_times, "Vakitleri görmek için uygulamayı açın")
        v.setChronometer(R.id.hw_chrono, SystemClock.elapsedRealtime(), "--:--", false)
      } else {
        v.setTextViewText(R.id.hw_title, "${next.name} ${fmt("HH:mm", next.time)}")
        v.setTextViewText(R.id.hw_city, data.city)
        v.setTextViewText(R.id.hw_times, data.days[fmt("yyyy-MM-dd", now)] ?: "")
        v.setChronometer(R.id.hw_chrono, SystemClock.elapsedRealtime() + (next.time - now), null, true)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) v.setChronometerCountDown(R.id.hw_chrono, true)
      }
      ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)?.let {
        v.setOnClickPendingIntent(R.id.hw_root, PendingIntent.getActivity(ctx, 52, it, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))
      }
      mgr.updateAppWidget(ids, v)
      // Vakit girince ve gece yarısı yenile
      val c = Calendar.getInstance(TR); c.timeInMillis = now; c.add(Calendar.DAY_OF_YEAR, 1)
      c.set(Calendar.HOUR_OF_DAY, 0); c.set(Calendar.MINUTE, 0); c.set(Calendar.SECOND, 5); c.set(Calendar.MILLISECOND, 0)
      val at = minOf((next?.time ?: c.timeInMillis) + 1000L, c.timeInMillis)
      val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      val pi = PendingIntent.getBroadcast(ctx, 51, Intent(ctx, HayyaWidget::class.java).setAction(ACTION_TICK),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      am.cancel(pi)
      val exact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms()
      try {
        if (exact) am.setExactAndAllowWhileIdle(AlarmManager.RTC, at, pi) else am.setAndAllowWhileIdle(AlarmManager.RTC, at, pi)
      } catch (e: SecurityException) { am.setAndAllowWhileIdle(AlarmManager.RTC, at, pi) }
    }
  }

  override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) = updateAll(ctx)

  override fun onReceive(ctx: Context, intent: Intent) {
    super.onReceive(ctx, intent)
    if (intent.action == ACTION_TICK) updateAll(ctx)
  }
}
