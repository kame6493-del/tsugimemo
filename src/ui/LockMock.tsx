/**
 * 画面の中に描く「ロック画面の見本」。iOS のロック画面ウィジェット(四角・1行・丸)が並ぶ所を、
 * 実際のウィジェットと同じ文の型で見せる(ウィジェットの作り: ios/TsugiWidget/TsugiWidget.swift)。
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
