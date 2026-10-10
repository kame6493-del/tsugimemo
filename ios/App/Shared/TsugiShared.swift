import Foundation
import SwiftUI
import WidgetKit
#if canImport(ActivityKit)
import ActivityKit
#endif

/// アプリ本体とウィジェット拡張の両方に入れる共有コード。
/// 置き場は App Group(group.jp.tsugimemo.app)の UserDefaults。
/// - snapshot: アプリ(WebView)が書く JSON。src/domain/model.ts の Snapshot と同じ形
/// - events: ウィジェット・ライブアクティビティで押された「完了」。アプリが開いた時に受け取って消す
enum TsugiShared {
    static let appGroup = "group.jp.tsugimemo.app"
    static let snapshotKey = "snapshot"
    static let eventsKey = "events"
    static let bigKey = "big"
    static let liveStartedKey = "liveStartedAt"

    static var defaults: UserDefaults? { UserDefaults(suiteName: appGroup) }

    struct Line: Codable, Hashable {
        let id: String
        let text: String
    }

    struct Paper: Codable, Hashable {
        let bg: String
        let ink: String
        let mark: String
        let dark: Bool
    }

    struct Snapshot: Codable, Hashable {
        var v: Int
        var list: String
        var items: [Line]
        var left: Int
        var doneToday: Int
        var paper: Paper
        var updatedAt: Double

        static let kinari = Paper(bg: "#FEFBF3", ink: "#1F2937", mark: "#3B84E6", dark: false)
        static let sample = Snapshot(
            v: 1, list: "ツギメモ",
            items: [Line(id: "a", text: "企画書の下書きを進める"), Line(id: "b", text: "ジムに行く"), Line(id: "c", text: "本を30分読む")],
            left: 3, doneToday: 1, paper: kinari, updatedAt: 0
        )
        static let empty = Snapshot(v: 1, list: "ツギメモ", items: [], left: 0, doneToday: 0, paper: kinari, updatedAt: 0)
    }

    static func read() -> Snapshot {
        guard let s = defaults?.string(forKey: snapshotKey),
              let d = s.data(using: .utf8),
              let snap = try? JSONDecoder().decode(Snapshot.self, from: d) else { return .empty }
        return snap
    }

    static func write(json: String, big: Bool) {
        defaults?.set(json, forKey: snapshotKey)
        defaults?.set(big, forKey: bigKey)
    }

    static var isBig: Bool { defaults?.bool(forKey: bigKey) ?? false }

    /// 押された行をすぐ外し(次が上がる)、アプリに渡す印を貯める
    @discardableResult
    static func complete(id: String) -> Bool {
        var snap = read()
        guard let idx = snap.items.firstIndex(where: { $0.id == id }) else { return false }
        snap.items.remove(at: idx)
        snap.left = max(0, snap.left - 1)
        snap.doneToday += 1
        if let data = try? JSONEncoder().encode(snap), let json = String(data: data, encoding: .utf8) {
            defaults?.set(json, forKey: snapshotKey)
        }
        var events = (defaults?.array(forKey: eventsKey) as? [[String: Any]]) ?? []
        events.append(["id": id, "at": Date().timeIntervalSince1970 * 1000])
        defaults?.set(events, forKey: eventsKey)
        return true
    }

    static func takeEvents() -> [[String: Any]] {
        let events = (defaults?.array(forKey: eventsKey) as? [[String: Any]]) ?? []
        defaults?.removeObject(forKey: eventsKey)
        return events
    }
}

extension Color {
    /// "#RRGGBB" から色を作る。読めない時は墨
    init(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespaces)
        if s.hasPrefix("#") { s.removeFirst() }
        var v: UInt64 = 0
        guard s.count == 6, Scanner(string: s).scanHexInt64(&v) else {
            self = Color(red: 0.13, green: 0.12, blue: 0.11)
            return
        }
        self = Color(
            red: Double((v >> 16) & 0xFF) / 255,
            green: Double((v >> 8) & 0xFF) / 255,
            blue: Double(v & 0xFF) / 255
        )
    }
}

#if canImport(ActivityKit)
/// 「ロック画面に大きく出す」のライブアクティビティ。アプリと拡張で同じ型を使う
@available(iOS 16.1, *)
struct TsugiActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var top: String
        var topId: String
        var next: [String]
        var left: Int
        var bg: String
        var ink: String
        var mark: String
    }
    var list: String
}

@available(iOS 16.1, *)
extension TsugiActivityAttributes.ContentState {
    init?(_ snap: TsugiShared.Snapshot) {
        guard let top = snap.items.first else { return nil }
        self.init(
            top: top.text, topId: top.id,
            next: snap.items.dropFirst().prefix(2).map { $0.text },
            left: snap.left,
            bg: snap.paper.bg, ink: snap.paper.ink, mark: snap.paper.mark
        )
    }
}
#endif

#if !WIDGET_EXTENSION && canImport(ActivityKit)
/// ライブアクティビティを今の中身に合わせる(アプリの中でだけ動かす)
@available(iOS 16.2, *)
enum LiveSync {
    /// restartIfOld: アプリを開いた時は true。iPhone の決まりで 8 時間で終わるので、4 時間を過ぎていたら出し直す
    static func sync(restartIfOld: Bool) async {
        let snap = TsugiShared.read()
        let acts = Activity<TsugiActivityAttributes>.activities
        guard TsugiShared.isBig,
              ActivityAuthorizationInfo().areActivitiesEnabled,
              let state = TsugiActivityAttributes.ContentState(snap) else {
            for a in acts { await a.end(nil, dismissalPolicy: .immediate) }
            return
        }
        let content = ActivityContent(state: state, staleDate: nil)
        let started = TsugiShared.defaults?.double(forKey: TsugiShared.liveStartedKey) ?? 0
        let old = Date().timeIntervalSince1970 - started > 4 * 3600
        if let a = acts.first, a.attributes.list == snap.list, !(restartIfOld && old) {
            // 音もバイブも出さない更新(alertConfiguration を渡さない)
            await a.update(content)
            for extra in acts.dropFirst() { await extra.end(nil, dismissalPolicy: .immediate) }
            return
        }
        for a in acts { await a.end(nil, dismissalPolicy: .immediate) }
        do {
            _ = try Activity.request(attributes: TsugiActivityAttributes(list: snap.list), content: content, pushType: nil)
            TsugiShared.defaults?.set(Date().timeIntervalSince1970, forKey: TsugiShared.liveStartedKey)
        } catch {
            // 裏で動いている時は出し直せない。次にアプリを開いた時に出す
        }
    }
}
#endif
