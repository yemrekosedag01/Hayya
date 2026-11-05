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
      OngoingNotifier.post(ctx)
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
