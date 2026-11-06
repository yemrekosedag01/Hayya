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
  // Kaydırılınca 3 dk sonra geri gelir; 20 dk içinde 5. kez kaydırılırsa 30 dk gizli kalır.
  private const val RETURN_AFTER_MS = 3 * 60 * 1000L
  private const val LONG_HIDE_MS = 30 * 60 * 1000L
  private const val WINDOW_MS = 20 * 60 * 1000L
  private const val MAX_DISMISSALS = 5
  private val TR: TimeZone = TimeZone.getTimeZone("Europe/Istanbul")

  private fun dayKey(ms: Long): String {
    val f = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    f.timeZone = TR
    return f.format(ms)
  }

  private fun hhmm(ms: Long): String {
    val f = SimpleDateFormat("HH:mm", Locale.US)
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
    val hidden = OngoingStore.hiddenUntil(ctx)
    if (now < hidden) { scheduleRefresh(ctx, hidden); return }
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
      // Kapalıyken tek satır (sonraki vakit), oka basınca günün bütün vakitleri
      .setContentText("${next.name} vakti: ${hhmm(next.time)}")
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
    val now = System.currentTimeMillis()
    val list = OngoingStore.dismissals(ctx).filter { now - it < WINDOW_MS }.toMutableList()
    list.add(now)
    val wait = if (list.size >= MAX_DISMISSALS) LONG_HIDE_MS else RETURN_AFTER_MS
    OngoingStore.setDismissals(ctx, if (wait == LONG_HIDE_MS) emptyList() else list)
    OngoingStore.setHiddenUntil(ctx, now + wait)
    scheduleRefresh(ctx, now + wait)
  }

  fun cancel(ctx: Context) {
    NotificationManagerCompat.from(ctx).cancel(NOTIF_ID)
    val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    am.cancel(pending(ctx, ACTION_REFRESH, 1))
  }
}
