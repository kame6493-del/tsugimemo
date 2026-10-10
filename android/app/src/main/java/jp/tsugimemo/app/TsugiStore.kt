package jp.tsugimemo.app

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * アプリ(WebView)とウィジェット・お知らせの間で共有する置き場。中身は SharedPreferences の JSON 文字列。
 * - snapshot: アプリが書く。src/domain/model.ts の Snapshot と同じ形
 * - events: ウィジェットやお知らせで押された「完了」。アプリが開いた時に takeEvents で受け取って消す
 */
object TsugiStore {
    private const val PREFS = "tsugimemo_widget"
    private const val K_SNAPSHOT = "snapshot"
    private const val K_EVENTS = "events"
    private const val K_BIG = "big"

    data class Line(val id: String, val text: String)
    data class Snap(
        val list: String,
        val items: List<Line>,
        val left: Int,
        val bg: Int,
        val ink: Int,
        val mark: Int,
        val dark: Boolean,
    )

    private fun prefs(c: Context) = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun saveSnapshot(c: Context, json: String, big: Boolean) {
        prefs(c).edit().putString(K_SNAPSHOT, json).putBoolean(K_BIG, big).apply()
    }

    fun isBig(c: Context): Boolean = prefs(c).getBoolean(K_BIG, false)

    fun read(c: Context): Snap {
        val raw = prefs(c).getString(K_SNAPSHOT, null)
        return try {
            val o = JSONObject(raw ?: "{}")
            val arr = o.optJSONArray("items") ?: JSONArray()
            val items = (0 until arr.length()).mapNotNull { i ->
                val it = arr.optJSONObject(i) ?: return@mapNotNull null
                val id = it.optString("id")
                val text = it.optString("text")
                if (id.isEmpty() || text.isEmpty()) null else Line(id, text)
            }
            val p = o.optJSONObject("paper") ?: JSONObject()
            Snap(
                list = o.optString("list", "ツギメモ"),
                items = items,
                left = o.optInt("left", items.size),
                bg = parse(p.optString("bg"), 0xFFFEFBF3.toInt()),
                ink = parse(p.optString("ink"), 0xFF1F2937.toInt()),
                mark = parse(p.optString("mark"), 0xFF3B84E6.toInt()),
                dark = p.optBoolean("dark", false),
            )
        } catch (e: Exception) {
            Snap("ツギメモ", emptyList(), 0, 0xFFFEFBF3.toInt(), 0xFF1F2937.toInt(), 0xFF3B84E6.toInt(), false)
        }
    }

    private fun parse(s: String, fallback: Int): Int = try {
        if (s.isEmpty()) fallback else android.graphics.Color.parseColor(s)
    } catch (e: Exception) {
        fallback
    }

    /** 押された行をすぐ画面から外し(次が上がる)、アプリに渡す印を貯める */
    @Synchronized
    fun complete(c: Context, id: String) {
        val p = prefs(c)
        val raw = p.getString(K_SNAPSHOT, null) ?: return
        val o = try { JSONObject(raw) } catch (e: Exception) { return }
        val arr = o.optJSONArray("items") ?: return
        val next = JSONArray()
        var found = false
        for (i in 0 until arr.length()) {
            val it = arr.optJSONObject(i) ?: continue
            if (it.optString("id") == id) found = true else next.put(it)
        }
        if (!found) return
        o.put("items", next)
        o.put("left", maxOf(0, o.optInt("left", 1) - 1))
        o.put("doneToday", o.optInt("doneToday", 0) + 1)
        val events = try { JSONArray(p.getString(K_EVENTS, "[]")) } catch (e: Exception) { JSONArray() }
        events.put(JSONObject().put("id", id).put("at", System.currentTimeMillis()))
        p.edit().putString(K_SNAPSHOT, o.toString()).putString(K_EVENTS, events.toString()).apply()
    }

    @Synchronized
    fun takeEvents(c: Context): JSONArray {
        val p = prefs(c)
        val events = try { JSONArray(p.getString(K_EVENTS, "[]")) } catch (e: Exception) { JSONArray() }
        p.edit().remove(K_EVENTS).apply()
        return events
    }
}
