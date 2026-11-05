package com.kosedag.hayya.ongoing

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

object OngoingNotifier {
  const val CHANNEL = "hayya-kalici-v1"
  const val NOTIF_ID = 7701
  const val ACTION_REFRESH = "com.kosedag.hayya.ongoing.REFRESH"
  const val ACTION_DISMISSED = "com.kosedag.hayya.ongoing.DISMISSED"
  private const val RETURN_AFTER_MS = 5 * 60 * 1000L
  private val TR: TimeZone = TimeZone.getTimeZone("Europe/Istanbul")

  private fun dayKey(ms: Long): String {
    val f = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    f.timeZone = TR
    return f.format(ms)
  }

  private fun nextMidnight(now: Long): Long {
    val c = Calendar.getInstance(TR)
    c.timeInMillis = now
    c.add(Calendar.DAY_OF_YEAR, 1)
    c.set(Calendar.HOUR_OF_DAY, 0); c.set(Calendar.MINUTE, 0); c.set(Calendar.SECOND, 5); c.set(Calendar.MILLISECOND, 0)
    return c.timeInMillis
  }

  private fun ensureChannel(ctx: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      if (nm.getNotificationChannel(CHANNEL) == null) {
        val ch = NotificationChannel(CHANNEL, "Kalıcı vakit göstergesi", NotificationManager.IMPORTANCE_LOW)
        ch.description = "Bir sonraki vakte kalan süre ve günün vakitleri"
        ch.setShowBadge(false)
        ch.setSound(null, null)
        ch.enableVibration(false)
        nm.createNotificationChannel(ch)
      }
    }
  }

  private fun pending(ctx: Context, action: String, code: Int): PendingIntent {
    val i = Intent(ctx, OngoingReceiver::class.java).setAction(action)
    return PendingIntent.getBroadcast(ctx, code, i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  fun scheduleRefresh(ctx: Context, at: Long) {
    val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val pi = pending(ctx, ACTION_REFRESH, 1)
    am.cancel(pi)
    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi)
  }

  fun post(ctx: Context) {
    if (!OngoingStore.enabled(ctx)) return
    val data = OngoingStore.load(ctx) ?: return
    val now = System.currentTimeMillis()
    val next = data.items.firstOrNull { it.time > now } ?: run { cancel(ctx); return }
    ensureChannel(ctx)

    val line = data.days[dayKey(now)] ?: ""
    val launch = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)
    val open = if (launch != null) PendingIntent.getActivity(ctx, 2, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE) else null
    var icon = ctx.resources.getIdentifier("notification_icon", "drawable", ctx.packageName)
    if (icon == 0) icon = ctx.applicationInfo.icon

    val b = NotificationCompat.Builder(ctx, CHANNEL)
      .setSmallIcon(icon)
      .setContentTitle("${next.name} vaktine kalan süre")
      .setContentText(line)
      .setStyle(NotificationCompat.BigTextStyle().bigText(line))
      .setSubText(data.city)
      .setWhen(next.time)
      .setShowWhen(true)
      .setUsesChronometer(true)
      .setChronometerCountDown(true)
      .setOnlyAlertOnce(true)
      .setSilent(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .setCategory(NotificationCompat.CATEGORY_STATUS)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setDeleteIntent(pending(ctx, ACTION_DISMISSED, 3))
    if (open != null) b.setContentIntent(open)

    try {
      val nmc = NotificationManagerCompat.from(ctx)
      if (nmc.areNotificationsEnabled()) nmc.notify(NOTIF_ID, b.build())
    } catch (e: SecurityException) {
      // bildirim izni yok
    }
    // Vakit değişince ya da gece yarısı (günün vakitleri değişince) yenile
    scheduleRefresh(ctx, minOf(next.time + 1000L, nextMidnight(now)))
  }

  fun onDismissed(ctx: Context) {
    if (!OngoingStore.enabled(ctx)) return
    scheduleRefresh(ctx, System.currentTimeMillis() + RETURN_AFTER_MS)
  }

  fun cancel(ctx: Context) {
    NotificationManagerCompat.from(ctx).cancel(NOTIF_ID)
    val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    am.cancel(pending(ctx, ACTION_REFRESH, 1))
  }
}
