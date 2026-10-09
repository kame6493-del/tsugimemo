import SwiftUI
import WidgetKit

/// ツギメモのウィジェット。ロック画面(四角・1行・丸)とホーム画面(小・中)。
/// いちばん上の「いまの1行」に丸があり、押すと済んで次の行が上がる(iOS 17 以降の押せるウィジェット)。
@main
struct TsugiWidgetBundle: WidgetBundle {
    var body: some Widget {
        TsugiWidget()
        TsugiLiveActivity()
    }
}

struct TsugiEntry: TimelineEntry {
    let date: Date
    let snap: TsugiShared.Snapshot
}

struct TsugiProvider: TimelineProvider {
    func placeholder(in context: Context) -> TsugiEntry {
        TsugiEntry(date: Date(), snap: .sample)
    }

    func getSnapshot(in context: Context, completion: @escaping (TsugiEntry) -> Void) {
        let s = TsugiShared.read()
        completion(TsugiEntry(date: Date(), snap: context.isPreview && s.items.isEmpty ? .sample : s))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TsugiEntry>) -> Void) {
        // 中身はアプリと丸のボタンが書き換えた時だけ変わる。時間で書き直す必要はない
        completion(Timeline(entries: [TsugiEntry(date: Date(), snap: TsugiShared.read())], policy: .never))
    }
}

struct TsugiWidget: Widget {
    let kind = "TsugiWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TsugiProvider()) { entry in
            TsugiWidgetView(snap: entry.snap)
        }
        .configurationDisplayName("ツギメモ")
        .description("いまの1行。丸を押すと、次が上がります。")
        .supportedFamilies([.accessoryRectangular, .accessoryInline, .accessoryCircular, .systemSmall, .systemMedium])
    }
}

struct TsugiWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let snap: TsugiShared.Snapshot

    var body: some View {
        switch family {
        case .accessoryRectangular:
            LockRectView(snap: snap)
                .containerBackground(for: .widget) { AccessoryWidgetBackground() }
        case .accessoryInline:
            Text(snap.items.first.map { "いま \($0.text)" } ?? "ツギメモ")
                .containerBackground(for: .widget) { Color.clear }
        case .accessoryCircular:
            LockCircleView(snap: snap)
                .containerBackground(for: .widget) { AccessoryWidgetBackground() }
        case .systemMedium:
            HomeView(snap: snap, nextCount: 3, topFont: .system(size: 20, weight: .bold))
                .containerBackground(for: .widget) { Color(hex: snap.paper.bg) }
        default:
            HomeView(snap: snap, nextCount: 2, topFont: .system(size: 16, weight: .bold))
                .containerBackground(for: .widget) { Color(hex: snap.paper.bg) }
        }
    }
}

/// 済ませる丸。見た目は小さく、押せる所は広く
struct DoneButton: View {
    let id: String
    let size: CGFloat
    let color: Color

    var body: some View {
        Button(intent: DoneIntent(itemId: id)) {
            Circle()
                .strokeBorder(color, lineWidth: max(1.6, size / 9))
                .frame(width: size, height: size)
                .padding(4)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("済んだ")
    }
}

/// ロック画面の四角。1行目が「いま」、下に「つぎ」を2行
struct LockRectView: View {
    let snap: TsugiShared.Snapshot

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if let top = snap.items.first {
                HStack(spacing: 2) {
                    DoneButton(id: top.id, size: 13, color: .primary)
                    Text(top.text)
                        .font(.system(size: 15, weight: .bold))
                        .lineLimit(1)
                }
                .padding(.leading, -4)
                ForEach(Array(snap.items.dropFirst().prefix(2)), id: \.id) { line in
                    Text("つぎ  \(line.text)")
                        .font(.system(size: 12))
                        .lineLimit(1)
                        .foregroundStyle(.secondary)
                        .padding(.leading, 19)
                }
            } else {
                Text(snap.left > 0 ? "続きはアプリで" : "ぜんぶ済みました")
                    .font(.system(size: 15, weight: .bold))
                Text("次の1行を書く")
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// ロック画面の丸。のこりの数
struct LockCircleView: View {
    let snap: TsugiShared.Snapshot

    var body: some View {
        VStack(spacing: -2) {
            Text("\(snap.left)")
                .font(.system(size: 22, weight: .bold).monospacedDigit())
                .minimumScaleFactor(0.6)
            Text("のこり")
                .font(.system(size: 9, weight: .semibold))
        }
    }
}

/// ホーム画面の小・中。紙の色の上に、いまの1行と丸、つぎの行
struct HomeView: View {
    let snap: TsugiShared.Snapshot
    let nextCount: Int
    let topFont: Font

    var body: some View {
        let ink = Color(hex: snap.paper.ink)
        let mark = Color(hex: snap.paper.mark)
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(snap.list)
                    .font(.system(size: 12, weight: .semibold))
                    .lineLimit(1)
                Spacer(minLength: 4)
                if snap.left > 0 {
                    Text("のこり \(snap.left)")
                        .font(.system(size: 12).monospacedDigit())
                }
            }
            .foregroundStyle(ink.opacity(0.62))

            if let top = snap.items.first {
                HStack(alignment: .top, spacing: 4) {
                    DoneButton(id: top.id, size: 18, color: mark)
                        .padding(.leading, -4)
                        .padding(.top, -2)
                    Text(top.text)
                        .font(topFont)
                        .foregroundStyle(ink)
                        .lineLimit(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Rectangle()
                    .fill(ink.opacity(0.18))
                    .frame(height: 1)
                VStack(alignment: .leading, spacing: 3) {
                    ForEach(Array(snap.items.dropFirst().prefix(nextCount)), id: \.id) { line in
                        Text(line.text)
                            .font(.system(size: 13))
                            .foregroundStyle(ink.opacity(0.78))
                            .lineLimit(1)
                    }
                }
            } else {
                Text(snap.left > 0 ? "続きはアプリで" : "ぜんぶ済みました")
                    .font(topFont)
                    .foregroundStyle(ink)
                Text("押すと、次の1行を書けます")
                    .font(.system(size: 12))
                    .foregroundStyle(ink.opacity(0.62))
            }
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}
