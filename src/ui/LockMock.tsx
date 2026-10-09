import { isAndroid } from '../platform/native';

/**
 * 画面の中に描く「ロック画面の見本」。
 * - iOS: ロック画面ウィジェット(四角・1行・丸)が並ぶ所(作り: ios/TsugiWidget/TsugiWidget.swift)
 * - Android: ロック画面のお知らせ(いまの1行・つぎの2行・「済んだ」ボタン。作り: android/.../LockNotifier.kt)
 *   Android はロック画面にウィジェットを置けないので、時計やウィジェットは描かない
 */
type Props = {
  items: string[];
  left: number;
  /** 丸を押した直後の見せ方(最初の説明の2枚目で使う) */
  pressed?: boolean;
  compact?: boolean;
  label?: string;
};

export function LockMock({ items, left, pressed, compact, label }: Props) {
  const top = items[0];
  const next = items.slice(1, 3);
  if (isAndroid) return <NotifMock top={top} next={next} pressed={pressed} compact={compact} label={label} />;
  return (
    <div className={`lockmock${compact ? ' compact' : ''}`} role="img" aria-label={label ?? `ロック画面の見本。いちばん上は${top ?? 'まだありません'}`}>
      <div className="lm-inline">{top ? `いま ${top}` : 'ツギメモ'}</div>
      <div className="lm-time num">9:41</div>
      <div className="lm-row">
        <div className="lm-rect">
          {top ? (
            <>
              <div className={`lm-top${pressed ? ' pressed' : ''}`}>
                <span className="lm-ring" aria-hidden="true">{pressed ? <span className="lm-dot" /> : null}</span>
                <span className="lm-text">{top}</span>
              </div>
              {next.map((t, i) => (
                <div className="lm-next" key={i}><span className="lm-nextmark">つぎ</span>{t}</div>
              ))}
            </>
          ) : (
            <div className="lm-empty">書いた1行がここに出ます</div>
          )}
        </div>
        <div className="lm-circle num" aria-hidden="true">
          <span>{left}</span>
          <small>のこり</small>
        </div>
      </div>
    </div>
  );
}

/** Android のロック画面のお知らせの見本。文の並びは LockNotifier.kt と同じ(題=いま、本文=つぎ×2、ボタン=済んだ) */
function NotifMock({ top, next, pressed, compact, label }: { top?: string; next: string[]; pressed?: boolean; compact?: boolean; label?: string }) {
  return (
    <div className={`lockmock android${compact ? ' compact' : ''}`} role="img" aria-label={label ?? `ロック画面のお知らせの見本。いちばん上は${top ?? 'まだありません'}`}>
      <div className="lm-lock" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M7 10V7a5 5 0 0 1 10 0v3" fill="none" stroke="currentColor" strokeWidth="2" /><rect x="5" y="10" width="14" height="10" rx="2.5" fill="currentColor" /></svg>
      </div>
      <div className="lm-notif">
        <div className="lm-nhead">
          <span className="lm-appicon" aria-hidden="true"><span /></span>
          <span>ツギメモ</span>
        </div>
        {top ? (
          <>
            <div className="lm-top lm-ntitle"><span className="lm-text">{top}</span></div>
            {next.map((t, i) => (
              <div className="lm-nbody" key={i}><span className="lm-nextmark">つぎ</span>{t}</div>
            ))}
            <div className="lm-actions"><span className={`lm-action${pressed ? ' pressed' : ''}`}>済んだ</span></div>
          </>
        ) : (
          <div className="lm-empty">書いた1行がここに出ます</div>
        )}
      </div>
    </div>
  );
}
