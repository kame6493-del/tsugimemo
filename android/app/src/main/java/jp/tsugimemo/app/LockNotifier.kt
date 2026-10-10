package jp.tsugimemo.app

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

/**
 * Android の「ロック画面にお知らせで出す」。音もバイブも無い、消えにくいお知らせを1つだけ出す。
 * いまの1行を題に、次の行を本文に、「完了」ボタンを付ける。オフにすると取り消す。
 */
object LockNotifier {
    private const val CHANNEL = "lock_line"
    private const val ID = 7301

    fun allowed(context: Context): Boolean {
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) return false
        return NotificationManagerCompat.from(context).areNotificationsEnabled()
    }

    private fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < 26) return
        val nm = context.getSystemService(NotificationManager::class.java) ?: return
        if (nm.getNotificationChannel(CHANNEL) != null) return
        val ch = NotificationChannel(CHANNEL, "ロック画面の1行", NotificationManager.IMPORTANCE_LOW).apply {
            description = "いまの1行をロック画面に出します。音とバイブはありません。"
            setSound(null, null)
            enableVibration(false)
            setShowBadge(false)
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        }
        nm.createNotificationChannel(ch)
    }

    fun update(context: Context) {
        val nm = NotificationManagerCompat.from(context)
        if (!TsugiStore.isBig(context) || !allowed(context)) {
            nm.cancel(ID)
            return
        }
        val s = TsugiStore.read(context)
        val top = s.items.firstOrNull()
        if (top == null) {
            nm.cancel(ID)
            return
        }
        ensureChannel(context)
        val rest = s.items.drop(1).take(2).joinToString("\n") { "つぎ  " + it.text }
        val body = if (rest.isEmpty()) "のこり " + s.left else rest
        val b = NotificationCompat.Builder(context, CHANNEL)
            .also { if (s.list != "ツギメモ") it.setSubText(s.list) } // リストが1つの時はアプリ名と同じなので出さない
            .setSmallIcon(R.drawable.ic_stat_tsugi)
            .setContentTitle(top.text)
            .setContentText(body.lineSequence().first())
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setShowWhen(false)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setColor(s.mark)
            .setContentIntent(TsugiWidgetProvider.openAppIntent(context))
            .addAction(0, "完了", TsugiWidgetProvider.doneIntent(context, top.id, top.id.hashCode() + 1))
        try {
            nm.notify(ID, b.build())
        } catch (e: SecurityException) {
            // 許可が外された。アプリ側で「許可されていません」と出す
        }
    }
}
