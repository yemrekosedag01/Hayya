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

data class RadioItem(val url: String, val dur: Long, val title: String, val sub: String)

/**
 * Hayya Radyo: sunucusuz "canlı" yayın. Çalma listesi saate göre hesaplanır
 * (herkes aynı anda aynı yeri dinler). Ezan başlayınca ses odağını kaybedip
 * durur, ezan bitince yayının o anki yerinden devam eder.
 */
class RadioService : Service() {
  companion object {
    const val ACTION_START = "com.kosedag.hayya.radio.START"
    const val ACTION_STOP = "com.kosedag.hayya.radio.STOP"
    private const val OTHER_AUDIO_WAIT_MS = 2 * 60 * 1000L
    private const val STOPPED_NOTIF_TTL_MS = 30 * 60 * 1000L
    const val NOTIF_ID = 7704
    const val CHANNEL = "radyo-v1"
    private const val PREFS = "hayya_radio"

    // JS'in okuduğu durum
    @Volatile var playing = false
    @Volatile var buffering = false
    @Volatile var nowTitle = ""
    @Volatile var nowSub = ""

    fun savePlaylist(ctx: Context, json: String) {
      ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("list", json).apply()
    }

    fun state(): String = JSONObject()
      .put("playing", playing).put("buffering", buffering)
      .put("title", nowTitle).put("sub", nowSub).toString()
  }

  private val main = Handler(Looper.getMainLooper())
  private var player: MediaPlayer? = null
  private var focus: AudioFocusRequest? = null
  private var items: List<RadioItem> = emptyList()
  private var epoch = 0L
  private var index = -1
  private var pausedByFocus = false
  private var pauseReason = "ezan" // ezan | arama | diger
  private var otherSince = 0L
  private var stopped = true

  private val attrs: AudioAttributes = AudioAttributes.Builder()
    .setUsage(AudioAttributes.USAGE_MEDIA)
    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
    .build()

  override fun onBind(intent: Intent?): IBinder? = null

  private fun loadList(): Boolean {
    val raw = getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("list", null) ?: return false
    return try {
      val o = JSONObject(raw)
      epoch = o.getLong("epoch")
      val a = o.getJSONArray("items")
      items = (0 until a.length()).map {
        val x = a.getJSONObject(it)
        RadioItem(x.getString("url"), x.getLong("dur"), x.optString("title", ""), x.optString("sub", ""))
      }.filter { it.dur > 0 }
      items.isNotEmpty()
    } catch (e: Exception) { false }
  }

  /** Şu an yayında olan parça ve saniyesi (saate göre). */
  private fun livePosition(): Pair<Int, Long> {
    val total = items.sumOf { it.dur * 1000 }
    var t = ((System.currentTimeMillis() - epoch) % total + total) % total
    for ((i, item) in items.withIndex()) {
      val d = item.dur * 1000
      if (t < d) return Pair(i, t)
      t -= d
    }
    return Pair(0, 0L)
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (nm.getNotificationChannel(CHANNEL) == null) {
      val ch = NotificationChannel(CHANNEL, "Hayya Radyo", NotificationManager.IMPORTANCE_LOW)
      ch.setSound(null, null)
      ch.enableVibration(false)
      ch.setShowBadge(false)
      nm.createNotificationChannel(ch)
    }
  }

  private fun buildNotification(): android.app.Notification {
    val stopPi = PendingIntent.getService(this, 41, Intent(this, RadioService::class.java).setAction(ACTION_STOP),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val text = when {
      pausedByFocus && pauseReason == "ezan" -> "🕌 Ezan okunuyor · bitince devam edecek"
      pausedByFocus && pauseReason == "arama" -> "📞 Arama sürüyor · bitince devam edecek"
      pausedByFocus -> "⏸ Telefonunuzda başka bir ses çalıyor · radyo duraklatıldı"
      buffering -> "Bağlanıyor…"
      else -> listOf(nowTitle, nowSub).filter { it.isNotEmpty() }.joinToString(" · ")
    }
    val b = NotificationCompat.Builder(this, CHANNEL)
      .setSmallIcon(Ezan.icon(this))
      .setContentTitle("📻 Hayya Radyo")
      .setContentText(text)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setSilent(true)
      .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .addAction(0, "■ Durdur", stopPi)
    Ezan.openIntent(this)?.let { b.setContentIntent(it) }
    return b.build()
  }

  private fun refreshNotification() {
    if (stopped) return
    try { NotificationManagerCompat.from(this).notify(NOTIF_ID, buildNotification()) } catch (e: SecurityException) {}
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) { stopAll(); return START_NOT_STICKY }
    if (!loadList()) { stopAll(); return START_NOT_STICKY }
    ensureChannel()
    stopped = false
    buffering = true
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) startForeground(NOTIF_ID, buildNotification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
      else startForeground(NOTIF_ID, buildNotification())
    } catch (e: Exception) { stopAll(); return START_NOT_STICKY }
    requestFocus()
    playLive(-1)
    return START_NOT_STICKY
  }

  private fun requestFocus() {
    val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val f = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
        .setAudioAttributes(attrs)
        .setWillPauseWhenDucked(false) // bildirim sesinde sistem sesi kısar, durdurmaz
        .setOnAudioFocusChangeListener { change -> main.post { onFocus(change) } }
        .build()
      focus = f
      am.requestAudioFocus(f)
    } else {
      @Suppress("DEPRECATION")
      am.requestAudioFocus({ change -> main.post { onFocus(change) } }, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN)
    }
  }

  private fun onFocus(change: Int) {
    when (change) {
      AudioManager.AUDIOFOCUS_LOSS -> {
        // Başka uygulama (YouTube, Instagram, müzik…) sesi aldı: bekle, kısa sürerse devam et
        pauseReason = "diger"
        pausedByFocus = true
        otherSince = System.currentTimeMillis()
        releasePlayer()
        playing = false; buffering = false
        refreshNotification()
        main.removeCallbacks(otherPoll)
        main.postDelayed(otherPoll, 3000)
      }
      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
        // Bildirim sesi: radyo durmaz, sesi kısılır (eski Android sürümleri için elle)
        try { player?.setVolume(0.2f, 0.2f) } catch (e: Exception) {}
      }
      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
        pausedByFocus = true // ezan, arama ya da kısa süreli başka ses
        val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        pauseReason = when {
          EzanService.active -> "ezan"
          am.mode == AudioManager.MODE_IN_CALL || am.mode == AudioManager.MODE_RINGTONE || am.mode == AudioManager.MODE_IN_COMMUNICATION -> "arama"
          else -> "diger"
        }
        releasePlayer()
        playing = false
        refreshNotification()
      }
      AudioManager.AUDIOFOCUS_GAIN -> {
        try { player?.setVolume(1f, 1f) } catch (e: Exception) {}
        if (pausedByFocus) { pausedByFocus = false; playLive(-1) }
      }
    }
  }

  /** Başka uygulama sesi bitince (2 dk içinde) radyoya döner, bitmezse durdurur. */
  private val otherPoll = object : Runnable {
    override fun run() {
      if (stopped || !pausedByFocus || pauseReason != "diger") return
      val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
      val busy = am.isMusicActive || am.mode == AudioManager.MODE_IN_CALL || am.mode == AudioManager.MODE_IN_COMMUNICATION
      val waited = System.currentTimeMillis() - otherSince
      when {
        !busy && waited > 1500 -> { pausedByFocus = false; requestFocus(); playLive(-1) }
        waited >= OTHER_AUDIO_WAIT_MS -> stopWithResume()
        else -> main.postDelayed(this, 2000)
      }
    }
  }

  /** Radyoyu bırakır, bildirimde "Devam et" kalır (30 dk sonra kendiliğinden silinir). */
  private fun stopWithResume() {
    val keepText = "Radyo durduruldu · başka bir ses çalıyordu"
    stopped = true
    main.removeCallbacksAndMessages(null)
    releasePlayer()
    playing = false; buffering = false; pausedByFocus = false
    val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) focus?.let { am.abandonAudioFocusRequest(it) }
    focus = null
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) stopForeground(STOP_FOREGROUND_DETACH)
    else { @Suppress("DEPRECATION") stopForeground(false) }
    val startIntent = Intent(this, RadioService::class.java).setAction(ACTION_START)
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    val resumePi = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) PendingIntent.getForegroundService(this, 42, startIntent, flags)
      else PendingIntent.getService(this, 42, startIntent, flags)
    val b = NotificationCompat.Builder(this, CHANNEL)
      .setSmallIcon(Ezan.icon(this))
      .setContentTitle("📻 Hayya Radyo")
      .setContentText(keepText)
      .setOngoing(false)
      .setAutoCancel(true)
      .setSilent(true)
      .setTimeoutAfter(STOPPED_NOTIF_TTL_MS)
      .addAction(0, "▶ Devam et", resumePi)
    Ezan.openIntent(this)?.let { b.setContentIntent(it) }
    try { NotificationManagerCompat.from(this).notify(NOTIF_ID, b.build()) } catch (e: SecurityException) {}
    stopSelf()
  }

  /** Saate göre o anki yerden çalar. finished: az önce biten parça (saat geride kaldıysa bir sonrakine geç). */
  private fun playLive(finished: Int) {
    if (stopped || pausedByFocus) return
    var (i, offset) = livePosition()
    if (i == finished) { i = (finished + 1) % items.size; offset = 0L }
    index = i
    val item = items[i]
    nowTitle = item.title; nowSub = item.sub
    buffering = true
    refreshNotification()
    releasePlayer()
    try {
      val p = MediaPlayer()
      p.setAudioAttributes(attrs)
      p.setWakeMode(this, PowerManager.PARTIAL_WAKE_LOCK)
      p.setDataSource(item.url)
      p.setOnPreparedListener {
        // Hazırlanırken geçen süreyi de ekle
        val (ni, noff) = livePosition()
        val seek = if (ni == i) noff else offset
        if (seek > 1000) it.seekTo(seek.toInt())
        it.start()
        buffering = false; playing = true
        refreshNotification()
      }
      p.setOnCompletionListener { main.post { playLive(i) } }
      p.setOnErrorListener { _, _, _ ->
        // İnternet yok vb.: 5 sn sonra yeniden dene
        playing = false; buffering = true
        refreshNotification()
        releasePlayer()
        main.postDelayed({ playLive(-1) }, 5000)
        true
      }
      p.prepareAsync()
      player = p
    } catch (e: Exception) {
      main.postDelayed({ playLive(-1) }, 5000)
    }
  }

  private fun releasePlayer() {
    val p = player ?: return
    player = null
    try { p.reset() } catch (e: Exception) {}
    try { p.release() } catch (e: Exception) {}
  }

  private fun stopAll() {
    stopped = true
    main.removeCallbacksAndMessages(null)
    releasePlayer()
    playing = false; buffering = false; pausedByFocus = false
    val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      focus?.let { am.abandonAudioFocusRequest(it) }
    }
    focus = null
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      stopForeground(STOP_FOREGROUND_REMOVE)
    } else {
      @Suppress("DEPRECATION")
      stopForeground(true)
    }
    stopSelf()
  }

  override fun onDestroy() {
    stopped = true
    main.removeCallbacksAndMessages(null)
    releasePlayer()
    playing = false; buffering = false
    super.onDestroy()
  }
}
