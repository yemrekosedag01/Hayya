package com.kosedag.hayya.ongoing

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class EzanReceiver : BroadcastReceiver() {
  override fun onReceive(ctx: Context, intent: Intent) {
    if (intent.action == Ezan.ACTION_FIRE) Ezan.onFire(ctx) else Ezan.scheduleNext(ctx)
  }
}
