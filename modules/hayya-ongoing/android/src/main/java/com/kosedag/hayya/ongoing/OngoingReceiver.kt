package com.kosedag.hayya.ongoing

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class OngoingReceiver : BroadcastReceiver() {
  override fun onReceive(ctx: Context, intent: Intent) {
    when (intent.action) {
      OngoingNotifier.ACTION_DISMISSED -> OngoingNotifier.onDismissed(ctx)
      else -> OngoingNotifier.post(ctx) // yenileme, açılış, güncelleme, saat değişimi
    }
  }
}
