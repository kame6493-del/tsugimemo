import Capacitor
import Foundation
import WidgetKit
#if canImport(ActivityKit)
import ActivityKit
#endif

/// src/platform/widget.ts の TsugiWidget の iOS 側。MainViewController で登録する
@objc(TsugiWidgetPlugin)
public class TsugiWidgetPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "TsugiWidgetPlugin"
    public let jsName = "TsugiWidget"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setSnapshot", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "takeEvents", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "bigStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestBig", returnType: CAPPluginReturnPromise),
    ]

    @objc func setSnapshot(_ call: CAPPluginCall) {
        guard let json = call.getString("json") else {
            call.reject("json がありません")
            return
        }
        let big = call.getBool("big") ?? false
        TsugiShared.write(json: json, big: big)
        WidgetCenter.shared.reloadAllTimelines()
        if #available(iOS 16.2, *) {
            Task { await LiveSync.sync(restartIfOld: true) }
        }
        call.resolve()
    }

    @objc func takeEvents(_ call: CAPPluginCall) {
        call.resolve(["events": TsugiShared.takeEvents()])
    }

    @objc func bigStatus(_ call: CAPPluginCall) {
        call.resolve(["supported": Self.supported, "allowed": Self.allowed])
    }

    /// iOS のライブアクティビティは実行時の許可ダイアログが無い。設定の状態を返すだけ
    @objc func requestBig(_ call: CAPPluginCall) {
        call.resolve(["allowed": Self.allowed])
    }

    private static var supported: Bool {
        if #available(iOS 16.2, *) { return true }
        return false
    }

    private static var allowed: Bool {
        if #available(iOS 16.2, *) { return ActivityAuthorizationInfo().areActivitiesEnabled }
        return false
    }
}
