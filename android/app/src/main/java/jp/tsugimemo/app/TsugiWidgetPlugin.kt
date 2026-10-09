package jp.tsugimemo.app

import android.Manifest
import android.os.Build
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback

/** src/platform/widget.ts の TsugiWidget の Android 側 */
@CapacitorPlugin(
    name = "TsugiWidget",
    permissions = [Permission(alias = "notifications", strings = [Manifest.permission.POST_NOTIFICATIONS])],
)
class TsugiWidgetPlugin : Plugin() {

    @PluginMethod
    fun setSnapshot(call: PluginCall) {
        val json = call.getString("json")
        if (json == null) {
            call.reject("json がありません")
            return
        }
        val big = call.getBoolean("big", false) ?: false
        TsugiStore.saveSnapshot(context, json, big)
        TsugiWidgetProvider.refreshAll(context)
        call.resolve()
    }

    @PluginMethod
    fun takeEvents(call: PluginCall) {
        val arr = TsugiStore.takeEvents(context)
        val out = JSArray()
        for (i in 0 until arr.length()) out.put(arr.getJSONObject(i))
        val r = JSObject()
        r.put("events", out)
        call.resolve(r)
    }

    @PluginMethod
    fun bigStatus(call: PluginCall) {
        val r = JSObject()
        r.put("supported", true)
        r.put("allowed", LockNotifier.allowed(context))
        call.resolve(r)
    }

    @PluginMethod
    fun requestBig(call: PluginCall) {
        if (Build.VERSION.SDK_INT < 33 || getPermissionState("notifications") == PermissionState.GRANTED) {
            val r = JSObject()
            r.put("allowed", LockNotifier.allowed(context))
            call.resolve(r)
            return
        }
        requestPermissionForAlias("notifications", call, "afterPermission")
    }

    @PermissionCallback
    private fun afterPermission(call: PluginCall) {
        val r = JSObject()
        r.put("allowed", LockNotifier.allowed(context))
        call.resolve(r)
    }
}
