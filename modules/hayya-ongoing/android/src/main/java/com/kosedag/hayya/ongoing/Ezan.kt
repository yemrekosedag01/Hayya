package com.kosedag.hayya.ongoing

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import org.json.JSONArray

data class EzanItem(val time: Long, val title: String, val body: String, val snd: String)

/**
 * Ezan vakitlerini AlarmManager ile kurar; vakit gelince ezanı EzanService içinde
 * medya sesiyle çalar. Böylece ses tuşları ezanı kesmez, sesini kısar; bildirim
 * çubuğunu indirmek de susturmaz (yalnızca "Ezanı sustur" düğmesi susturur).
 */
object Ezan {
  const val ACTION_FIRE = "com.kosedag.hayya.ezan.FIRE"
  private const val PREFS = "hayya_ezan"
  private const val LATE_LIMIT_MS = 15 * 60 * 1000L // bu kadar geç kalan ezan okunmaz
  const val CH_INFO = "vakit-bilgi-v1"

  private fun prefs(ctx: Context) = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun save(ctx: Context, json: String, vib: Boolean) {
    prefs(ctx).edit().putString("list", json).putBoolean("vib", vib).apply()
    scheduleNext(ctx)
  }

  fun vib(ctx: Context) = prefs(ctx).getBoolean("vib", true)

  private fun load(ctx: Context): List<EzanItem> {
    val raw = prefs(ctx).getString("list", null) ?: return emptyList()
    return try {
      val a = JSONArray(raw)
      (0 until a.length()).map {
        val o = a.getJSONObject(it)
        EzanItem(o.getLong("t"), o.optString("title", "Ezan vakti"), o.optString("body", ""), o.optString("snd", "ezan"))
      }.sortedBy { it.time }
    } catch (e: Exception) { emptyList() }
  }

  private fun firePending(ctx: Context): PendingIntent {
    val i = Intent(ctx, EzanReceiver::class.java).setAction(ACTION_FIRE)
    return PendingIntent.getBroadcast(ctx, 21, i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  fun scheduleNext(ctx: Context) {
    val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val pi = firePending(ctx)
    am.cancel(pi)
    val last = prefs(ctx).getLong("lastFired", 0L)
    val next = load(ctx).firstOrNull { it.time > System.currentTimeMillis() && it.time != last } ?: return
    val exact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms()
    try {
      if (exact) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next.time, pi)
      else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next.time, pi)
    } catch (e: SecurityException) {
      am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next.time, pi)
    }
  }

  fun clear(ctx: Context) {
    prefs(ctx).edit().remove("list").apply()
    (ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(firePending(ctx))
  }

  fun onFire(ctx: Context) {
    val now = System.currentTimeMillis()
    val item = load(ctx).lastOrNull { it.time <= now + 5000 && now - it.time < LATE_LIMIT_MS }
    if (item != null && item.time != prefs(ctx).getLong("lastFired", 0L)) {
      prefs(ctx).edit().putLong("lastFired", item.time).apply()
      play(ctx, item.title, item.body, item.snd)
    }
    scheduleNext(ctx)
  }

  /** Telefon sessizde / rahatsız etme modundaysa ezan sesi çalınmaz. */
  private fun isSilenced(ctx: Context): Boolean {
    val am = ctx.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    if (am.ringerMode != AudioManager.RINGER_MODE_NORMAL) return true
    val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    return nm.currentInterruptionFilter > NotificationManager.INTERRUPTION_FILTER_ALL
  }

  fun play(ctx: Context, title: String, body: String, snd: String = "ezan") {
    if (isSilenced(ctx)) { fallback(ctx, title, body); return }
    val i = Intent(ctx, EzanService::class.java)
      .putExtra("title", title).putExtra("body", body).putExtra("vib", vib(ctx)).putExtra("snd", snd)
    try {
      ContextCompat.startForegroundService(ctx, i)
    } catch (e: Exception) {
      // Arka planda servis başlatılamadıysa (ör. kesin alarm izni yok) eski yöntem:
      // ezan bildirim kanalının sesiyle çalar
      fallback(ctx, title, body)
    }
  }

  /** Uygulamanın JS tarafında oluşturulan ezan kanalı (ezan.wav sesli). Sessiz modu telefon uygular. */
  fun fallback(ctx: Context, title: String, body: String) {
    val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val ch = if (vib(ctx)) "ezan-v2" else "ezan-v2-nv"
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm.getNotificationChannel(ch) == null) { info(ctx, title, body, true); return }
    val b = NotificationCompat.Builder(ctx, ch)
      .setSmallIcon(icon(ctx))
      .setContentTitle(title)
      .setContentText(body)
      .setAutoCancel(true)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
    openIntent(ctx)?.let { b.setContentIntent(it) }
    try { NotificationManagerCompat.from(ctx).notify(7703, b.build()) } catch (e: SecurityException) {}
  }

  /** Ezan bitince / susturulunca kalan bilgi bildirimi (sessiz). */
  fun info(ctx: Context, title: String, body: String, alert: Boolean) {
    val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm.getNotificationChannel(CH_INFO) == null) {
      val ch = NotificationChannel(CH_INFO, "Vakit bilgisi (sessiz)", NotificationManager.IMPORTANCE_DEFAULT)
      ch.setSound(null, null)
      nm.createNotificationChannel(ch)
    }
    val b = NotificationCompat.Builder(ctx, CH_INFO)
      .setSmallIcon(icon(ctx))
      .setContentTitle(title)
      .setContentText(body)
      .setAutoCancel(true)
      .setOnlyAlertOnce(!alert)
      .setSilent(!alert)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
    openIntent(ctx)?.let { b.setContentIntent(it) }
    try { NotificationManagerCompat.from(ctx).notify(7703, b.build()) } catch (e: SecurityException) {}
  }

  private var preview: android.media.MediaPlayer? = null

  /** Ses seçerken dinletme. name: raw kaynak adı ya da "default" (telefonun bildirim sesi). */
  fun preview(ctx: Context, name: String) {
    stopPreview()
    try {
      val uri = if (name == "default") android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_NOTIFICATION)
      else {
        val res = ctx.resources.getIdentifier(name, "raw", ctx.packageName)
        if (res == 0) return
        android.net.Uri.parse("android.resource://${ctx.packageName}/$res")
      }
      val p = android.media.MediaPlayer()
      p.setAudioAttributes(android.media.AudioAttributes.Builder().setUsage(android.media.AudioAttributes.USAGE_MEDIA).build())
      p.setDataSource(ctx, uri)
      p.setOnCompletionListener { stopPreview() }
      p.prepare()
      p.start()
      preview = p
    } catch (e: Exception) { stopPreview() }
  }

  fun stopPreview() {
    val p = preview ?: return
    preview = null
    try { p.stop() } catch (e: Exception) {}
    try { p.release() } catch (e: Exception) {}
  }

  fun isPreviewing() = preview != null

  fun icon(ctx: Context): Int {
    var icon = ctx.resources.getIdentifier("notification_icon", "drawable", ctx.packageName)
    if (icon == 0) icon = ctx.applicationInfo.icon
    return icon
  }

  fun openIntent(ctx: Context): PendingIntent? {
    val launch = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName) ?: return null
    return PendingIntent.getActivity(ctx, 22, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }
}
