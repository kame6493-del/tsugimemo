import { useEffect, useState } from 'react';
import { isAndroid } from '../platform/native';
import { IconCheck, IconLock } from './Icons';

/**
 * 画面の中に描く「ロック画面の見本」。地の絵は持ち主の見本から切り出した物(public/img)。
 * - iPhone: 見本②のロック画面の上に、紙の札(=「ロック画面に大きく出す」のライブアクティビティ。
 *   作り: ios/App/TsugiWidget/TsugiLiveActivity.swift)。札の文はアプリの今の1行
 * - Android: ロック画面のお知らせ(題=いまの1行、つぎ×2、「完了」ボタン。作り: LockNotifier.kt)。
 *   Android はロック画面にウィジェットを置けないので、時計やウィジェットは描かない
 */
type Props = {
  items: string[];
  /** 押して次が上がる動きをくり返して見せる(最初の説明) */
  demo?: boolean;
  /** 押した後の青いチェックを出したままにする */
  checked?: boolean;
  label?: string;
  className?: string;
};

export function LockMock({ items, demo, checked, label, className }: Props) {
  const [phase, setPhase] = useState(0); // 0: 丸 1: チェック 2: 次が上がった
  useEffect(() => {
    if (!demo) return;
    const steps = [1600, 700, 1900];
    let i = 0;
    let t: number;
    const run = () => { t = window.setTimeout(() => { i = (i + 1) % 3; setPhase(i); run(); }, steps[i]); };
    run();
    return () => window.clearTimeout(t);
  }, [demo]);

  const shown = demo && phase === 2 ? items.slice(1) : items;
  const top = shown[0];
  const isChecked = checked || (demo && phase === 1);

  if (isAndroid) {
    return (
      <div className={`lockmock android${className ? ' ' + className : ''}`} role="img" aria-label={label ?? `ロック画面のお知らせの見本。いちばん上は${top ?? 'まだありません'}`}>
        <img className="lm-bg" src="./img/sky.jpg" alt="" draggable={false} />
        <span className="lm-lockicon" aria-hidden="true"><IconLock size={18} /></span>
        <div className="lm-notif" key={top}>
          <div className="lm-nhead">
            <img src="./img/app_icon.png" alt="" />
            <span>ツギメモ</span>
          </div>
          {top ? (
            <>
              <p className="lm-ntitle lm-text">{top}</p>
              {shown.slice(1, 3).map((t, i) => <p className="lm-nnext" key={i}>つぎ {t}</p>)}
              <div className="lm-nactions">
                <span className={`lm-action${isChecked ? ' pressed' : ''}`}><IconCheck size={14} />完了</span>
              </div>
            </>
          ) : (
            <p className="lm-nnext">書いた1行がここに出ます</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`lockmock ios${className ? ' ' + className : ''}`} role="img" aria-label={label ?? `ロック画面の見本。いちばん上は${top ?? 'まだありません'}`}>
      <img className="lm-bg" src="./img/lock_ios.jpg" alt="" draggable={false} />
      <div className="lm-card">
        <span className="lm-pin" aria-hidden="true" />
        <small>つぎにやること</small>
        <p className="lm-text" key={top}>{top ?? '書いた1行がここに出ます'}</p>
        <span className={`lm-ring${isChecked ? ' on' : ''}`} aria-hidden="true">{isChecked && <IconCheck size={20} />}</span>
      </div>
    </div>
  );
}

/** ホーム画面ウィジェットの見本(作り: iOS は TsugiWidget.swift の HomeView、Android は widget_tsugi.xml) */
export function WidgetMock({ size, title, items, bg }: { size: 'small' | 'medium' | 'wide'; title: string; items: string[]; bg: string }) {
  const top = items[0];
  const next = size === 'small' ? [] : items.slice(1, 3);
  return (
    <div className={`wmock ${size}`} style={{ background: bg }} role="img" aria-label={`ウィジェットの見本。${top ?? 'まだありません'}`}>
      <p className="wm-title">{title}</p>
      <div className="wm-rule" />
      {top ? (
        <>
          <div className="wm-top"><span className="wm-ring" /><span className="wm-text">{top}</span></div>
          {next.map((t, i) => <p className="wm-next" key={i}>{t}</p>)}
        </>
      ) : (
        <p className="wm-next">次の1行を書く</p>
      )}
    </div>
  );
}

/** iPhone の画面の上の黒い枠(ダイナミックアイランド)に出る見本。「大きく出す」をオンにした時だけ */
export function IslandMock({ top }: { top?: string }) {
  return (
    <div className="island" role="img" aria-label={`画面の上の黒い枠の見本。${top ?? ''}`}>
      <span className="is-ring" />
      <span className="is-body"><small>ツギメモ</small><b>{top ?? '書いた1行'}</b></span>
    </div>
  );
}
