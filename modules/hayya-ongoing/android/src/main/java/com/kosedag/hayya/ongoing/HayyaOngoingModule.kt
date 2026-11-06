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

    Function("testEzan") { title: String, body: String ->
      val ctx = appContext.reactContext?.applicationContext ?: return@Function false
      Ezan.play(ctx, title, body)
      true
    }

    Function("stop") {
      val ctx = appContext.reactContext?.applicationContext ?: return@Function false
      OngoingStore.setEnabled(ctx, false)
      OngoingNotifier.cancel(ctx)
      true
    }
  }
}
