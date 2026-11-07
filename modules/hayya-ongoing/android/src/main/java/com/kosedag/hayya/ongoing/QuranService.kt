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
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import org.json.JSONObject

/**
 * Kuran dinleme: ayet ayet mp3 kuyruğunu sırayla çalar. Ekran kapalıyken de sürer.
 * JS yalnızca kuyruğu verir; hangi ayetin çaldığını state() ile okur.
 */
class QuranService : Service() {
  companion object {
    const val ACTION_PLAY = "com.kosedag.hayya.quran.PLAY"
    const val ACTION_PAUSE = "com.kosedag.hayya.quran.PAUSE"
    const val ACTION_RESUME = "com.kosedag.hayya.quran.RESUME"
    const val ACTION_SEEK = "com.kosedag.hayya.quran.SEEK"
    const val ACTION_STOP = "com.kosedag.hayya.quran.STOP"
    const val ACTION_SPEED = "com.kosedag.hayya.quran.SPEED"
    const val NOTIF_ID = 7706
    const val CHANNEL = "kuran-v1"

    @Volatile var queue: String = ""
    @Volatile var index = -1
    @Volatile var count = 0
    @Volatile var playing = false
    @Volatile var paused = false
    @Volatile var finished = false
    @Volatile var active = false

    fun state(): String = JSONObject()
      .put("index", index).put("count", count).put("playing", playing)
      .put("paused", paused).put("finished", finished).put("active", active).toString()
  }

  private val main = Handler(Looper.getMainLooper())
  private var player: MediaPlayer? = null
  private var focus: AudioFocusRequest? = null
  private var urls: List<String> = emptyList()
  private var titles: List<String> = emptyList()
  private var pausedByFocus = false
  private var retries = 0
  private var speed = 1f
  private var stopped = true

  private val attrs: AudioAttributes = AudioAttributes.Builder()
    .setUsage(AudioAttributes.USAGE_MEDIA)
    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
    .build()

  override fun onBind(intent: Intent?): IBinder? = null

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (nm.getNotificationChannel(CHANNEL) == null) {
      val ch = NotificationChannel(CHANNEL, "Kuran dinleme", NotificationManager.IMPORTANCE_LOW)
      ch.setSound(null, null)
      ch.enableVibration(false)
      ch.setShowBadge(false)
      nm.createNotificationChannel(ch)
    }
  }

  private fun pi(code: Int, action: String): PendingIntent =
    PendingIntent.getService(this, code, Intent(this, QuranService::class.java).setAction(action),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

  private fun buildNotification(): android.app.Notification {
    val t = titles.getOrNull(index) ?: ""
    val b = NotificationCompat.Builder(this, CHANNEL)
      .setSmallIcon(Ezan.icon(this))
      .setContentTitle("📖 Kuran-ı Kerim")
      .setContentText(if (paused) "$t · duraklatıldı" else t)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setSilent(true)
      .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
    if (paused) b.addAction(0, "▶ Devam", pi(51, ACTION_RESUME)) else b.addAction(0, "⏸ Duraklat", pi(52, ACTION_PAUSE))
    b.addAction(0, "■ Durdur", pi(53, ACTION_STOP))
    Ezan.openIntent(this)?.let { b.setContentIntent(it) }
    return b.build()
  }

  private fun refreshNotification() {
    if (stopped) return
    try { NotificationManagerCompat.from(this).notify(NOTIF_ID, buildNotification()) } catch (e: SecurityException) {}
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_PLAY -> {
        if (!parseQueue()) { stopAll(); return START_NOT_STICKY }
        ensureChannel()
        active = true
        stopped = false; finished = false; paused = false; pausedByFocus = false
        val start = try { JSONObject(queue).optInt("start", 0) } catch (e: Exception) { 0 }
        index = start.coerceIn(0, urls.size - 1)
        try {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) startForeground(NOTIF_ID, buildNotification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
          else startForeground(NOTIF_ID, buildNotification())
        } catch (e: Exception) { stopAll(); return START_NOT_STICKY }
        requestFocus()
        playIndex(index)
      }
      ACTION_PAUSE -> pauseNow(false)
      ACTION_RESUME -> resumeNow()
      ACTION_SEEK -> if (!stopped) { val i = intent.getIntExtra("index", index); paused = false; pausedByFocus = false; playIndex(i.coerceIn(0, urls.size - 1)) }
      ACTION_SPEED -> { speed = (intent.getIntExtra("index", 100) / 100f).coerceIn(0.5f, 2f); if (playing) applySpeed(player) }
      ACTION_STOP -> stopAll()
    }
    return START_NOT_STICKY
  }

  private fun parseQueue(): Boolean = try {
    val o = JSONObject(queue)
    val u = o.getJSONArray("urls"); val t = o.optJSONArray("titles")
    urls = (0 until u.length()).map { u.getString(it) }
    titles = (0 until u.length()).map { t?.optString(it, "") ?: "" }
    speed = o.optDouble("speed", 1.0).toFloat().coerceIn(0.5f, 2f)
    count = urls.size
    urls.isNotEmpty()
  } catch (e: Exception) { false }

  private fun requestFocus() {
    val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val f = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
        .setAudioAttributes(attrs)
        .setWillPauseWhenDucked(false)
        .setOnAudioFocusChangeListener { c -> main.post { onFocus(c) } }
        .build()
      focus = f
      am.requestAudioFocus(f)
    } else {
      @Suppress("DEPRECATION")
      am.requestAudioFocus({ c -> main.post { onFocus(c) } }, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN)
    }
  }

  private fun onFocus(change: Int) {
    when (change) {
      AudioManager.AUDIOFOCUS_LOSS, AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> if (!paused) { pauseNow(true) }
      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> try { player?.setVolume(0.2f, 0.2f) } catch (e: Exception) {}
      AudioManager.AUDIOFOCUS_GAIN -> {
        try { player?.setVolume(1f, 1f) } catch (e: Exception) {}
        if (pausedByFocus) resumeNow()
      }
    }
  }

  /** Okuma hızı (ses perdesi bozulmadan). Yalnızca çalan oynatıcıya uygulanır. */
  private fun applySpeed(mp: MediaPlayer?) {
    if (mp == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return
    try { mp.playbackParams = mp.playbackParams.setSpeed(speed) } catch (e: Exception) {}
  }

  private fun pauseNow(byFocus: Boolean) {
    if (stopped) return
    try { player?.pause() } catch (e: Exception) {}
    paused = true; playing = false; pausedByFocus = byFocus
    refreshNotification()
  }

  private fun resumeNow() {
    if (stopped || !paused) return
    paused = false; pausedByFocus = false
    if (player != null) {
      try { player?.start(); playing = true; applySpeed(player) } catch (e: Exception) { playIndex(index) }
    } else playIndex(index)
    refreshNotification()
  }

  private var next: MediaPlayer? = null
  private var nextIdx = -1
  private var nextReady = false
  private var chained = false

  private fun makePlayer(i: Int): MediaPlayer {
    val p = MediaPlayer()
    p.setAudioAttributes(attrs)
    p.setWakeMode(this, PowerManager.PARTIAL_WAKE_LOCK)
    p.setDataSource(urls[i])
    p.setOnCompletionListener { mp -> main.post { onComplete(mp, i) } }
    p.setOnErrorListener { mp, _, _ ->
      main.post {
        if (mp === next) { releaseNext() }
        else if (mp === player) {
          releasePlayer(); playing = false
          if (retries < 3) { retries++; main.postDelayed({ playIndex(i) }, 3000) } else { retries = 0; stopAll() }
        }
      }
      true
    }
    return p
  }

  /** Bir sonraki ayeti arka planda hazırlar: ayetler arasında boşluk kalmaz. */
  private fun prepareNext(j: Int) {
    if (stopped || j >= urls.size) return
    releaseNext()
    try {
      val n = makePlayer(j)
      nextIdx = j; nextReady = false; chained = false
      n.setOnPreparedListener {
        if (next === it) {
          nextReady = true
          try { player?.setNextMediaPlayer(it); chained = true } catch (e: Exception) { chained = false }
        }
      }
      next = n
      n.prepareAsync()
    } catch (e: Exception) { releaseNext() }
  }

  private fun releaseNext() {
    val n = next ?: return
    next = null; nextReady = false; chained = false; nextIdx = -1
    try { n.reset() } catch (e: Exception) {}
    try { n.release() } catch (e: Exception) {}
  }

  private fun onComplete(done: MediaPlayer, i: Int) {
    if (stopped || done !== player) return
    val n = next
    if (n != null && nextReady && nextIdx == i + 1) {
      val wasChained = chained
      player = n; next = null; nextReady = false; chained = false; nextIdx = -1
      try { done.release() } catch (e: Exception) {}
      index = i + 1; retries = 0
      if (!wasChained && !paused) { try { n.start() } catch (e: Exception) {} }
      playing = !paused
      if (playing) applySpeed(n)
      refreshNotification()
      prepareNext(index + 1)
    } else {
      playIndex(i + 1)
    }
  }

  private fun playIndex(i: Int) {
    if (stopped) return
    if (i >= urls.size) { finished = true; stopAll(); return }
    index = i; playing = false; finished = false
    refreshNotification()
    releasePlayer()
    val n = next
    if (n != null && nextReady && nextIdx == i) {
      player = n; next = null; nextReady = false; chained = false; nextIdx = -1
      if (!paused) { try { n.start() } catch (e: Exception) {} }
      playing = !paused
      if (playing) applySpeed(n)
      refreshNotification()
      prepareNext(i + 1)
      return
    }
    releaseNext()
    try {
      val p = makePlayer(i)
      p.setOnPreparedListener {
        if (player === it) {
          retries = 0
          if (!paused) { it.start(); playing = true; applySpeed(it) }
          refreshNotification()
          prepareNext(i + 1)
        }
      }
      player = p
      p.prepareAsync()
    } catch (e: Exception) {
      if (retries < 3) { retries++; main.postDelayed({ playIndex(i) }, 3000) } else stopAll()
    }
  }

  private fun releasePlayer() {
    val p = player ?: return
    player = null
    try { p.reset() } catch (e: Exception) {}
    try { p.release() } catch (e: Exception) {}
  }

  private fun stopAll() {
    active = false
    stopped = true
    main.removeCallbacksAndMessages(null)
    releasePlayer()
    releaseNext()
    playing = false; paused = false
    val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) focus?.let { am.abandonAudioFocusRequest(it) }
    focus = null
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) stopForeground(STOP_FOREGROUND_REMOVE)
    else { @Suppress("DEPRECATION") stopForeground(true) }
    stopSelf()
  }

  override fun onDestroy() {
    active = false
    stopped = true
    main.removeCallbacksAndMessages(null)
    releasePlayer()
    releaseNext()
    playing = false; paused = false
    super.onDestroy()
  }
}
