package com.kosedag.hayya.ongoing

import android.content.Context
import org.json.JSONObject

data class PrayerEvent(val name: String, val time: Long)
data class OngoingData(val city: String, val items: List<PrayerEvent>, val days: Map<String, String>)

object OngoingStore {
  private const val PREFS = "hayya_ongoing"

  fun save(ctx: Context, payload: String) {
    ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("payload", payload).apply()
  }

  fun setEnabled(ctx: Context, on: Boolean) {
    ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean("enabled", on).apply()
  }

  fun enabled(ctx: Context): Boolean =
    ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean("enabled", false)

  /** Kaydırma zamanları (ms) ve gizli kalma bitişi */
  fun dismissals(ctx: Context): MutableList<Long> =
    (ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("dismissals", "") ?: "")
      .split(',').mapNotNull { it.toLongOrNull() }.toMutableList()

  fun setDismissals(ctx: Context, list: List<Long>) {
    ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("dismissals", list.joinToString(",")).apply()
  }

  fun hiddenUntil(ctx: Context): Long =
    ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getLong("hiddenUntil", 0L)

  fun setHiddenUntil(ctx: Context, at: Long) {
    ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putLong("hiddenUntil", at).apply()
  }

  fun load(ctx: Context): OngoingData? {
    val raw = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("payload", null) ?: return null
    return try {
      val o = JSONObject(raw)
      val arr = o.getJSONArray("items")
      val items = ArrayList<PrayerEvent>(arr.length())
      for (i in 0 until arr.length()) {
        val it = arr.getJSONObject(i)
        items.add(PrayerEvent(it.getString("k"), it.getLong("t")))
      }
      val d = o.getJSONObject("days")
      val days = HashMap<String, String>()
      val keys = d.keys()
      while (keys.hasNext()) {
        val k = keys.next()
        days[k] = d.getString(k)
      }
      OngoingData(o.optString("city", ""), items.sortedBy { it.time }, days)
    } catch (e: Exception) {
      null
    }
  }
}
