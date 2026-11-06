package com.kosedag.hayya.ongoing

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat

class EzanService : Service() {
  companion object {
    const val ACTION_STOP = "com.kosedag.hayya.ezan.STOP"
    const val NOTIF_ID = 7702
    const val CH_VIB = "ezan-calar-v1"
    const val CH_NOVIB = "ezan-calar-nv-v1"
  }

  private var player: MediaPlayer? = null
  private var focus: AudioFocusRequest? = null
  private var title = ""
  private var body = ""
  private var finished = false
  private var snd = "ezan"

  override fun onBind(intent: Intent?): IBinder? = null

  private val attrs: AudioAttributes = AudioAttributes.Builder()
    .setUsage(AudioAttributes.USAGE_MEDIA) // ses tuşları bu sesi kısar/açar
    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
    .build()

  private fun ensureChannels() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (nm.getNotificationChannel(CH_VIB) == null) {
      val ch = NotificationChannel(CH_VIB, "Ezan okunuyor", NotificationManager.IMPORTANCE_HIGH)
      ch.setSound(null, null)
      ch.enableVibration(true)
      ch.vibrationPattern = longArrayOf(0, 400, 250, 400)
      ch.lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
      nm.createNotificationChannel(ch)
    }
    if (nm.getNotificationChannel(CH_NOVIB) == null) {
      val ch = NotificationChannel(CH_NOVIB, "Ezan okunuyor (titreşimsiz)", NotificationManager.IMPORTANCE_HIGH)
      ch.setSound(null, null)
      ch.enableVibration(false)
      ch.lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
      nm.createNotificationChannel(ch)
    }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) { finish(); return START_NOT_STICKY }
    // Yeni ezan gelirse öncekini bırak
    releasePlayer()
    finished = false
    title = intent?.getStringExtra("title") ?: "Ezan vakti"
    body = intent?.getStringExtra("body") ?: ""
    val vib = intent?.getBooleanExtra("vib", true) ?: true
    snd = intent?.getStringExtra("snd") ?: "ezan"
    Ezan.stopPreview()
    ensureChannels()

    val stopPi = PendingIntent.getService(this, 31, Intent(this, EzanService::class.java).setAction(ACTION_STOP),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val b = NotificationCompat.Builder(this, if (vib) CH_VIB else CH_NOVIB)
      .setSmallIcon(Ezan.icon(this))
      .setContentTitle(title)
      .setContentText(body)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .addAction(0, "🔇 Sustur", stopPi)
      .setDeleteIntent(stopPi)
    Ezan.openIntent(this)?.let { b.setContentIntent(it) }
    val n = b.build()
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
      else startForeground(NOTIF_ID, n)
    } catch (e: Exception) {
      Ezan.info(this, title, body, true)
      stopSelf()
      return START_NOT_STICKY
    }

    if (!startPlayer()) finish()
    return START_NOT_STICKY
  }

  private fun startPlayer(): Boolean {
    var res = resources.getIdentifier(snd, "raw", packageName)
    if (res == 0) res = resources.getIdentifier("ezan", "raw", packageName)
    if (res == 0) return false
    val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
    // Müzik vb. çalıyorsa ezan süresince dursun
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val f = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
        .setAudioAttributes(attrs)
        .setOnAudioFocusChangeListener { change -> if (change == AudioManager.AUDIOFOCUS_LOSS) finish() }
        .build()
      focus = f
      am.requestAudioFocus(f)
    } else {
      @Suppress("DEPRECATION")
      am.requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
    }
    return try {
      val p = MediaPlayer()
      p.setAudioAttributes(attrs)
      p.setDataSource(this, Uri.parse("android.resource://$packageName/$res"))
      p.setWakeMode(this, PowerManager.PARTIAL_WAKE_LOCK)
      p.setOnCompletionListener { finish() }
      p.setOnErrorListener { _, _, _ -> finish(); true }
      p.prepare()
      p.start()
      player = p
      true
    } catch (e: Exception) { false }
  }

  private fun releasePlayer() {
    try { player?.stop() } catch (e: Exception) {}
    try { player?.release() } catch (e: Exception) {}
    player = null
    val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      focus?.let { am.abandonAudioFocusRequest(it) }
    } else {
      @Suppress("DEPRECATION")
      am.abandonAudioFocus(null)
    }
    focus = null
  }

  private fun finish() {
    if (finished) return
    finished = true
    releasePlayer()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      stopForeground(STOP_FOREGROUND_REMOVE)
    } else {
      @Suppress("DEPRECATION")
      stopForeground(true)
    }
    // Vakit bilgisi bildirim çubuğunda sessizce kalsın
    if (title.isNotEmpty()) Ezan.info(this, title, body, false)
    stopSelf()
  }

  override fun onDestroy() {
    releasePlayer()
    super.onDestroy()
  }
}
