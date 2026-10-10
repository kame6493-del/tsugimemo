import AppIntents
import Foundation
import WidgetKit

/// ロック画面・ホーム画面のウィジェットの丸を押した時。ロックしたまま動く
@available(iOS 17.0, *)
struct DoneIntent: AppIntent {
    static var title: LocalizedStringResource = "完了"
    static var description = IntentDescription("いまの1行を済みにして、次の行を上げます。")
    static var isDiscoverable: Bool = false
    static var openAppWhenRun: Bool = false
    static var authenticationPolicy: IntentAuthenticationPolicy { .alwaysAllowed }

    @Parameter(title: "行")
    var itemId: String

    init() {}

    init(itemId: String) {
        self.itemId = itemId
    }

    func perform() async throws -> some IntentResult {
        TsugiShared.complete(id: itemId)
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

/// ライブアクティビティの丸を押した時。iPhone はこれをアプリの中で動かす
@available(iOS 17.0, *)
struct DoneLiveIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "完了"
    static var isDiscoverable: Bool = false
    static var authenticationPolicy: IntentAuthenticationPolicy { .alwaysAllowed }

    @Parameter(title: "行")
    var itemId: String

    init() {}

    init(itemId: String) {
        self.itemId = itemId
    }

    func perform() async throws -> some IntentResult {
        TsugiShared.complete(id: itemId)
        WidgetCenter.shared.reloadAllTimelines()
        #if !WIDGET_EXTENSION
        await LiveSync.sync(restartIfOld: false)
        #endif
        return .result()
    }
}
