import { useState } from 'react';
import { PAPERS } from '../domain/model';
import type { Billing } from '../platform/billing';
import type { PaywallReason } from './ctx';
import { Sheet } from './Sheets';

const LEADS: Record<PaywallReason, string> = {
  lists: 'リストを増やすのは、ツギメモ+ でできます。',
  lockList: 'ロック画面に出すリストを替えるのは、ツギメモ+ でできます。',
  daily: '毎朝もどすリストは、ツギメモ+ でできます。',
  paper: 'この紙の色は、ツギメモ+ で使えます。',
  settings: 'ツギメモ+ で、できることが3つ増えます。',
};

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
    <Sheet title="ツギメモ+" onClose={onClose} label="ツギメモ+ の案内">
      <div className="paywall">
        <p className="pw-lead">{LEADS[reason]}</p>
        <dl className="pw-list">
          <div>
            <dt>リストを8つまで</dt>
            <dd>「買い物」「仕事」「持ち物」に分けて、ロック画面に出すリストを選べます。</dd>
          </div>
          <div>
            <dt>毎朝もどすリスト</dt>
            <dd>決めた時刻に済んだ印が外れます。朝の支度や毎日の決まり事に。</dd>
          </div>
          <div>
            <dt>紙の色6色</dt>
            <dd className="pw-papers">
              {PAPERS.map((p) => (
                <span key={p.id} className="swatch sm" style={{ background: p.bg, color: p.ink }} title={p.name} aria-label={p.name} />
              ))}
            </dd>
          </div>
        </dl>
        <p className="pw-note">一度の購入でずっと使えます。月額ではありません。広告もありません。</p>
        <div className="sheet-foot">
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
