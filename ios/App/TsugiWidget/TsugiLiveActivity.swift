import ActivityKit
import SwiftUI
import WidgetKit

/// 「ロック画面に大きく出す」。ロック画面の下に、いまの1行と次の2行を大きく出す。
/// 丸を押すと済んで次が上がる(DoneLiveIntent はアプリの中で動き、ウィジェットも書き直す)。
struct TsugiLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TsugiActivityAttributes.self) { context in
            LiveLockView(list: context.attributes.list, state: context.state)
                .activityBackgroundTint(Color(hex: context.state.bg))
                .activitySystemActionForegroundColor(Color(hex: context.state.ink))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Button(intent: DoneLiveIntent(itemId: context.state.topId)) {
                        Circle()
                            .strokeBorder(Color(hex: context.state.mark), lineWidth: 2.5)
                            .frame(width: 24, height: 24)
                            .padding(6)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("済んだ")
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(context.state.top)
                        .font(.system(size: 17, weight: .bold))
                        .lineLimit(1)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("のこり \(context.state.left)")
                        .font(.system(size: 12).monospacedDigit())
                        .foregroundStyle(.secondary)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 2) {
                        ForEach(context.state.next, id: \.self) { t in
                            Text("つぎ  \(t)")
                                .font(.system(size: 13))
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            } compactLeading: {
                Circle()
                    .strokeBorder(Color(hex: context.state.mark), lineWidth: 2)
                    .frame(width: 14, height: 14)
            } compactTrailing: {
                Text(context.state.top)
                    .font(.system(size: 12, weight: .semibold))
                    .lineLimit(1)
                    .frame(maxWidth: 72)
            } minimal: {
                Text("\(context.state.left)")
                    .font(.system(size: 13, weight: .bold).monospacedDigit())
            }
        }
    }
}

struct LiveLockView: View {
    let list: String
    let state: TsugiActivityAttributes.ContentState

    var body: some View {
        let ink = Color(hex: state.ink)
        let mark = Color(hex: state.mark)
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(list)
                    .font(.system(size: 13, weight: .semibold))
                Spacer()
                Text("のこり \(state.left)")
                    .font(.system(size: 13).monospacedDigit())
            }
            .foregroundStyle(ink.opacity(0.62))
            HStack(alignment: .center, spacing: 10) {
                Button(intent: DoneLiveIntent(itemId: state.topId)) {
                    Circle()
                        .strokeBorder(mark, lineWidth: 3)
                        .frame(width: 28, height: 28)
                        .padding(8)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .padding(.leading, -8)
                .accessibilityLabel("済んだ")
                Text(state.top)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(ink)
                    .lineLimit(2)
            }
            if !state.next.isEmpty {
                Rectangle().fill(ink.opacity(0.18)).frame(height: 1)
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(state.next, id: \.self) { t in
                        Text(t)
                            .font(.system(size: 15))
                            .foregroundStyle(ink.opacity(0.8))
                            .lineLimit(1)
                    }
                }
            }
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 14)
    }
}
