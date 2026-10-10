import { useState } from 'react';
import { PAPERS } from '../domain/model';
import type { Billing } from '../platform/billing';
import type { PaywallReason } from './ctx';
import { IconBan, IconList, IconPalette, IconUndo } from './Icons';
import { Sheet } from './Sheets';

const LEADS: Record<PaywallReason, string> = {
  lists: 'リストを増やすのは、ツギメモ+ でできます。',
  lockList: 'ロック画面に出すリストを替えるのは、ツギメモ+ でできます。',
  daily: '毎朝戻るリストは、ツギメモ+ でできます。',
  paper: 'この紙の色は、ツギメモ+ で使えます。',
  settings: '見た目と使い方を、もう少し自分向けに。',
};

/** ツギメモ+ の案内(見本「買い切りアップグレード」: できること4つ・無料版とのちがい・買い切り) */
export function Paywall({ reason, billing, onClose, onBuy, onRestore }: {
  reason: PaywallReason;
  billing: Billing;
  onClose: () => void;
  onBuy: () => Promise<void>;
  onRestore: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const ready = billing.status === 'ready';
  const run = async (f: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try { await f(); } finally { setBusy(false); }
  };
  return (
    <Sheet title="ツギメモ+" onClose={onClose} label="ツギメモ+ の案内" className="paywall-sheet">
      <div className="paywall">
        <p className="pw-brand">ツギメモ<b>+</b><span>買い切りアップグレード</span></p>
        <p className="pw-lead">{LEADS[reason]}</p>
        <ul className="pw-feats">
          <li><span className="fi"><IconList /></span><span><b>8つまでのリスト</b><small>用途に合わせてリストを作れる。ロック画面に出すリストも選べる。</small></span></li>
          <li><span className="fi"><IconUndo /></span><span><b>毎朝戻るリスト</b><small>決めた時刻に、完了の印が外れて元に戻る。</small></span></li>
          <li><span className="fi"><IconPalette /></span><span><b>紙の色6色</b>
            <span className="pw-papers">{PAPERS.map((p) => <img key={p.id} src={`./img/paper_${p.id}.png`} alt={p.name} title={p.name} />)}</span>
          </span></li>
          <li><span className="fi"><IconBan /></span><span><b>広告なしのまま</b><small>買った後も、ずっと広告なし。</small></span></li>
        </ul>
        <table className="pw-table">
          <thead><tr><th>機能</th><th>無料版</th><th className="plus">ツギメモ<b>+</b></th></tr></thead>
          <tbody>
            <tr><td>リスト数</td><td>1つ</td><td className="plus">最大8つ</td></tr>
            <tr><td>毎朝戻るリスト</td><td>—</td><td className="plus">○</td></tr>
            <tr><td>紙の色</td><td>1色(ミルク)</td><td className="plus">6色</td></tr>
            <tr><td>広告の表示</td><td>なし</td><td className="plus">なし</td></tr>
          </tbody>
        </table>
        <p className="pw-note">一度の購入でずっと使えます。月額ではありません。</p>
        <div className="sheet-btns col">
          <button type="button" className="btn primary wide" disabled={!ready || busy} onClick={() => run(onBuy)}>
            {ready ? `${billing.price}で開く(買い切り)` : '購入は準備中です'}
          </button>
          {!ready && billing.reason && <p className="pw-err">{billing.reason}</p>}
          <button type="button" className="btn text" disabled={busy} onClick={() => run(onRestore)}>前に買った方はこちら(購入を戻す)</button>
        </div>
      </div>
    </Sheet>
  );
}
