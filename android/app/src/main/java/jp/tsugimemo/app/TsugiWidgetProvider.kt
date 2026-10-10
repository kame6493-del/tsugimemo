package jp.tsugimemo.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.view.View
import android.widget.RemoteViews

/**
 * ホーム画面のウィジェット。いちばん上の1行を大きく、灰の丸を押すと完了して次が上がる。下に次の2行。
 * 大きさを変えると、入らない行は自然に切れる(高さに合わせて行数が減る)。
 */
class TsugiWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        val views = build(context)
        for (id in ids) manager.updateAppWidget(id, views)
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == ACTION_DONE) {
            val itemId = intent.getStringExtra(EXTRA_ID) ?: return
            TsugiStore.complete(context, itemId)
            refreshAll(context)
            return
        }
        super.onReceive(context, intent)
    }

    companion object {
        const val ACTION_DONE = "jp.tsugimemo.app.DONE"
        const val EXTRA_ID = "id"

        /** ウィジェットとお知らせを書き直す。アプリからも、押された時にも呼ぶ */
        fun refreshAll(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, TsugiWidgetProvider::class.java))
            if (ids.isNotEmpty()) {
                val views = build(context)
                for (id in ids) manager.updateAppWidget(id, views)
            }
            LockNotifier.update(context)
        }

        fun doneIntent(context: Context, itemId: String, requestCode: Int): PendingIntent {
            val i = Intent(context, TsugiWidgetProvider::class.java).setAction(ACTION_DONE).putExtra(EXTRA_ID, itemId)
            return PendingIntent.getBroadcast(context, requestCode, i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        }

        fun openAppIntent(context: Context): PendingIntent {
            val i = Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            return PendingIntent.getActivity(context, 0, i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        }

        private fun build(context: Context): RemoteViews {
            val s = TsugiStore.read(context)
            val v = RemoteViews(context.packageName, R.layout.widget_tsugi)
            v.setInt(R.id.w_bg, "setColorFilter", s.bg)
            v.setTextViewText(R.id.w_list, s.list)
            v.setTextColor(R.id.w_list, s.ink)
            v.setTextViewText(R.id.w_left, if (s.left > 1) "のこり ${s.left}" else "")
            v.setTextColor(R.id.w_left, s.ink)
            v.setOnClickPendingIntent(R.id.w_root, openAppIntent(context))

            val top = s.items.firstOrNull()
            if (top == null) {
                v.setViewVisibility(R.id.w_check, View.GONE)
                v.setTextViewText(R.id.w_top, "次の1行を書く")
                v.setTextColor(R.id.w_top, s.ink)
                v.setTextViewText(R.id.w_sub, "押すとツギメモが開きます")
                v.setTextColor(R.id.w_sub, s.ink)
                v.setViewVisibility(R.id.w_sub, View.VISIBLE)
                v.setViewVisibility(R.id.w_next1, View.GONE)
                v.setViewVisibility(R.id.w_next2, View.GONE)
                return v
            }
            v.setViewVisibility(R.id.w_sub, View.GONE)
            v.setViewVisibility(R.id.w_check, View.VISIBLE)
            v.setInt(R.id.w_check, "setColorFilter", 0xFFB9BEC6.toInt())
            v.setOnClickPendingIntent(R.id.w_check, doneIntent(context, top.id, top.id.hashCode()))
            v.setTextViewText(R.id.w_top, top.text)
            v.setTextColor(R.id.w_top, s.ink)
            val next = listOf(R.id.w_next1, R.id.w_next2)
            next.forEachIndexed { i, rid ->
                val line = s.items.getOrNull(i + 1)
                if (line == null) {
                    v.setViewVisibility(rid, View.GONE)
                } else {
                    v.setViewVisibility(rid, View.VISIBLE)
                    v.setTextViewText(rid, line.text)
                    v.setTextColor(rid, s.ink)
                }
            }
            return v
        }
    }
}
