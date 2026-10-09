import { useEffect, useState } from 'react';
import { FREE_PAPERS, getList, PAPERS, pending, snapshotOf } from '../domain/model';
import { isAndroid, tap } from '../platform/native';
import { TsugiWidget } from '../platform/widget';
import type { Ctx } from './ctx';
import { IconCheck } from './Icons';
import { LockMock } from './LockMock';
import { Sheet } from './Sheets';

export function LockTab({ ctx }: { ctx: Ctx }) {
  const { data, setData, plus, openPaywall, toast } = ctx;
  const snap = snapshotOf(data, Date.now());
  const [asking, setAsking] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    TsugiWidget.bigStatus().then((s) => { if (data.bigOnLock && !s.allowed) setDenied(true); }).catch(() => {});
  }, [data.bigOnLock]);

  const turnOn = async () => {
    setAsking(false);
    const r = await TsugiWidget.requestBig().catch(() => ({ allowed: false }));
    if (!r.allowed) { setDenied(true); setData((d) => ({ ...d, bigOnLock: false })); return; }
    setDenied(false);
    setData((d) => ({ ...d, bigOnLock: true }));
    tap(true);
    toast({ text: isAndroid ? 'ロック画面のお知らせに出しました' : 'ロック画面に大きく出しました' });
  };

  const bigName = isAndroid ? 'ロック画面にお知らせで出す' : 'ロック画面に大きく出す';

  return (
    <div className="locktab">
      <header className="head"><h1 className="title">ロック画面</h1></header>

      <div className="mockwrap">
        <LockMock items={snap.items.map((i) => i.text)} left={snap.left} />
      </div>
      <p className="note pad">
        {isAndroid
          ? 'Android はロック画面にウィジェットを置けないため、ホーム画面のウィジェットと、ロック画面のお知らせで出します。'
          : 'ロック画面のウィジェットの色は、iPhone が壁紙に合わせて決めます。紙の色はホーム画面と「大きく出す」に使われます。'}
      </p>

      <section className="group" aria-labelledby="howto">
        <h2 id="howto" className="eyebrow pad">置き方</h2>
        <ol className="steps">
          {(isAndroid
            ? ['ホーム画面の何もない所を長押し', '「ウィジェット」を押す', '「ツギメモ」を探して、置きたい所へ動かす']
            : ['ロック画面を長押しして「カスタマイズ」', '「ロック画面」を選び、時計の下の枠を押す', '「ツギメモ」を選んで、四角・1行・丸から置く']
          ).map((s, i) => (
            <li key={i}><span className="stepno num">{i + 1}</span><span>{s}</span></li>
          ))}
        </ol>
        {!isAndroid && <p className="note pad">ホーム画面にも小・中の2つの大きさで置けます。置き方は同じで、ホーム画面を長押しします。</p>}
      </section>

      <section className="group" aria-labelledby="big">
        <h2 id="big" className="eyebrow pad">{isAndroid ? 'ロック画面のお知らせ' : 'もっと大きく'}</h2>
        <label className="switchrow">
          <span className="sw-text">
            <span className="sw-title">{bigName}</span>
            <span className="sw-sub">
              {isAndroid
                ? 'いまの1行と次の2行を、ロック画面にお知らせで出します。「済んだ」ボタン付きで、音もバイブもありません。'
                : 'いまの1行と次の2行を、ロック画面の下に大きく出します。音もバイブもありません。'}
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            className="switch"
            checked={data.bigOnLock}
            onChange={(e) => {
              tap();
              if (e.target.checked) setAsking(true);
              else setData((d) => ({ ...d, bigOnLock: false }));
            }}
          />
        </label>
        {!isAndroid && data.bigOnLock && (
          <p className="note pad">iPhone の決まりで、8時間たつと小さくなります。ツギメモを開くと、また出し直します。</p>
        )}
        {denied && (
          <div className="warn pad" role="alert">
            <p>{isAndroid ? 'お知らせが許可されていません。' : 'ライブアクティビティがオフになっています。'}</p>
            <p>{isAndroid ? '設定アプリの「通知」でツギメモをオンにすると出せます。' : '設定アプリの「ツギメモ」で「ライブアクティビティ」をオンにすると出せます。'}</p>
            <button type="button" className="btn ghost" onClick={() => setAsking(true)}>もう一度ためす</button>
          </div>
        )}
      </section>

      <section className="group" aria-labelledby="which">
        <h2 id="which" className="eyebrow pad">出すリスト</h2>
        <ul className="picklist">
          {data.lists.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                className={`pick${l.id === data.lockListId ? ' on' : ''}`}
                aria-pressed={l.id === data.lockListId}
                onClick={() => {
                  if (l.id === data.lockListId) return;
                  if (!plus) { openPaywall('lockList'); return; }
                  tap();
                  setData((d) => ({ ...d, lockListId: l.id }));
                }}
              >
                <span className="pick-mark">{l.id === data.lockListId ? <IconCheck /> : null}</span>
                <span className="pick-name">{l.name}</span>
                <span className="pick-count num">{pending(getList(data, l.id)).length}</span>
              </button>
            </li>
          ))}
        </ul>
        {data.lists.length === 1 && <p className="note pad">リストを増やすと、ここで出すリストを選べます(ツギメモ+)。</p>}
      </section>

      <section className="group" aria-labelledby="paper">
        <h2 id="paper" className="eyebrow pad">紙の色</h2>
        <div className="papers pad" role="radiogroup" aria-label="紙の色">
          {PAPERS.map((p) => {
            const locked = !plus && !FREE_PAPERS.includes(p.id);
            const on = data.paper === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={on}
                className={`paper${on ? ' on' : ''}`}
                onClick={() => {
                  if (locked) { openPaywall('paper'); return; }
                  tap();
                  setData((d) => ({ ...d, paper: p.id }));
                }}
              >
                <span className="swatch" style={{ background: p.bg, color: p.ink }}>
                  <span className="swatch-mark" style={{ borderColor: p.mark }} />
                  <span className="swatch-ink" style={{ background: p.ink }} />
                </span>
                <span className="paper-name">{p.name}</span>
                {locked && <span className="paper-lock">+</span>}
              </button>
            );
          })}
        </div>
      </section>

      {asking && (
        <Sheet title={bigName} onClose={() => setAsking(false)}>
          <p className="sheet-text">
            {isAndroid
              ? 'ロック画面に出すために、お知らせの許可を聞きます。音は鳴らしません。'
              : 'iPhone のライブアクティビティを使って出します。音もバイブもなく、オフにすればすぐ消えます。'}
          </p>
          <div className="sheet-foot">
            <button type="button" className="btn primary wide" onClick={turnOn}>{isAndroid ? '許可を聞く' : '出す'}</button>
            <button type="button" className="btn text" onClick={() => setAsking(false)}>やめておく</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
