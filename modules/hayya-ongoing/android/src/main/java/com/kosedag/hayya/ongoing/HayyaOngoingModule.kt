package com.kosedag.hayya.ongoing

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class HayyaOngoingModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("HayyaOngoing")

    // payload: {"city": "...", "items": [{"k": "Akşam", "t": 1730000000000}], "days": {"2026-11-06": "İmsak 05:38 · ..."}}
    Function("start") { payload: String ->
      val ctx = appContext.reactContext?.applicationContext ?: return@Function false
      OngoingStore.save(ctx, payload)
      OngoingStore.setEnabled(ctx, true)
      // Uygulama açıldı: kaydırma bekleme süresi (3/30 dk) iptal, gösterge hemen geri gelir
      OngoingStore.setHiddenUntil(ctx, 0L)
      OngoingStore.setDismissals(ctx, emptyList())
      OngoingNotifier.post(ctx)
      true
    }

    // list: [{"t": ms, "title": "...", "body": "..."}] — ezan seçili vakitler
    Function("setEzan") { list: String, vib: Boolean ->
      val ctx = appContext.reactContext?.applicationContext ?: return@Function false
      Ezan.save(ctx, list, vib)
      true
    }

    Function("clearEzan") {
      val ctx = appContext.reactContext?.applicationContext ?: return@Function false
      Ezan.clear(ctx)
      true
    }

    Function("testEzan") { title: String, body: String, snd: String ->
      val ctx = appContext.reactContext?.applicationContext ?: return@Function false
      Ezan.play(ctx, title, body, snd)
      true
    }

    Function("preview") { name: String ->
      val ctx = appContext.reactContext?.applicationContext ?: return@Function false
      Ezan.preview(ctx, name)
      true
    }

    Function("stopPreview") { Ezan.stopPreview(); true }

    Function("isPreviewing") { Ezan.isPreviewing() }

    // Hayya Radyo. playlist: {"epoch": ms, "items": [{"url","dur","title","sub"}]}
    Function("radioPlay") { playlist: String ->
      val ctx = appContext.reactContext?.applicationContext ?: return@Function false
      RadioService.savePlaylist(ctx, playlist)
      val i = android.content.Intent(ctx, RadioService::class.java).setAction(RadioService.ACTION_START)
      androidx.core.content.ContextCompat.startForegroundService(ctx, i)
      true
    }

    Function("radioStop") {
      val ctx = appContext.reactContext?.applicationContext ?: return@Function false
      val i = android.content.Intent(ctx, RadioService::class.java).setAction(RadioService.ACTION_STOP)
      try { ctx.startService(i) } catch (e: Exception) {}
      true
    }

    Function("radioState") { RadioService.state() }

    // Kuran dinleme. queue: {"urls":[...],"titles":[...],"start":n}
    Function("quranPlay") { queue: String ->
      val ctx = appContext.reactContext?.applicationContext ?: return@Function false
      QuranService.queue = queue
      val i = android.content.Intent(ctx, QuranService::class.java).setAction(QuranService.ACTION_PLAY)
      androidx.core.content.ContextCompat.startForegroundService(ctx, i)
      true
    }

    Function("quranCmd") { action: String, index: Int ->
      val ctx = appContext.reactContext?.applicationContext ?: return@Function false
      val i = android.content.Intent(ctx, QuranService::class.java).setAction(action).putExtra("index", index)
      try { ctx.startService(i) } catch (e: Exception) {}
      true
    }

    Function("quranState") { QuranService.state() }

    // Widget ve kalıcı gösterge için vakit listesini kaydet (gösterge kapalı olsa da widget kullanır)
    Function("setData") { payload: String ->
      val ctx = appContext.reactContext?.applicationContext ?: return@Function false
      OngoingStore.save(ctx, payload)
      HayyaWidget.updateAll(ctx)
      true
    }

    // "Alarmlar ve hatırlatıcılar" izni (Android 12+): kapalıysa ezan birkaç dakika gecikebilir
    Function("canExact") {
      val ctx = appContext.reactContext?.applicationContext ?: return@Function true
      if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.S) return@Function true
      (ctx.getSystemService(android.content.Context.ALARM_SERVICE) as android.app.AlarmManager).canScheduleExactAlarms()
    }

    Function("openExactSettings") {
      val ctx = appContext.reactContext?.applicationContext ?: return@Function false
      if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.S) return@Function false
      val i = android.content.Intent(android.provider.Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
        .setData(android.net.Uri.parse("package:" + ctx.packageName))
        .addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
      try { ctx.startActivity(i); true } catch (e: Exception) { false }
    }

    Function("stop") {
      val ctx = appContext.reactContext?.applicationContext ?: return@Function false
      OngoingStore.setEnabled(ctx, false)
      OngoingNotifier.cancel(ctx)
      true
    }
  }
}
