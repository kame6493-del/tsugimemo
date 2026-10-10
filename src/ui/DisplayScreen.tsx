import { useEffect, useState } from 'react';
import { getList, PAPERS, pending, snapshotOf } from '../domain/model';
import { isAndroid, tap } from '../platform/native';
import { TsugiWidget } from '../platform/widget';
import type { Ctx } from './ctx';
import { IconCheck, IconChevronLeft, IconChevronRight, IconHome, IconLock, IconPalette } from './Icons';
import { IslandMock, LockMock, WidgetMock } from './LockMock';
import { LIST_DOTS, Sheet } from './Sheets';

/** 表示場所(見本「いつでも見える表示」): ロック画面・ホーム画面のウィジェット・出すリスト・紙の色 */
export function DisplayScreen({ ctx }: { ctx: Ctx }) {
  const { data, setData, plus, openPaywall, toast, go, openPapers } = ctx;
  const snap = snapshotOf(data, Date.now());
  const texts = snap.items.map((i) => i.text);
  const [asking, setAsking] = useState(false);
  const [denied, setDenied] = useState(false);
  const paper = PAPERS.find((p) => p.id === data.paper) ?? PAPERS[0];

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
    toast({ text: isAndroid ? 'ロック画面のお知らせに出しました' : 'ロック画面に大きく出しました', kind: 'ok' });
  };

  const bigName = isAndroid ? 'ロック画面にお知らせで出す' : 'ロック画面に大きく出す';

  return (
    <div className="subscreen display">
      <header className="topbar">
        <button type="button" className="backbtn" onClick={() => { tap(); go('settings'); }}><IconChevronLeft /><span>設定</span></button>
        <h1>表示場所</h1>
        <span className="iconbtn-space" />
      </header>

      <section className="sec">
        <h2 className="sec-title"><span className="sec-icon"><IconLock size={18} /></span>{isAndroid ? 'ロック画面のお知らせ' : 'ロック画面'}</h2>
        <div className="mockwrap"><LockMock items={texts} checked={false} /></div>
        <div className="card">
          <label className="switchrow">
            <span className="sw-text">
              <span className="sw-title">{bigName}</span>
              <span className="sw-sub">
                {isAndroid
                  ? 'いまの1行と次の2行を、ロック画面にお知らせで出します。「完了」ボタン付きで、音もバイブもありません。'
                  : 'いまの1行を、紙の札にしてロック画面に大きく出します。丸を押すと、ロックしたまま完了できます。音もバイブもありません。'}
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
            <div className="island-row">
              <IslandMock top={texts[0]} />
              <p className="note">画面の上の黒い枠にも出ます(対応する iPhone のみ)。iPhone の決まりで8時間たつと消えます。ツギメモを開くと、また出し直します。</p>
            </div>
          )}
          {denied && (
            <div className="warn" role="alert">
              <p>{isAndroid ? 'お知らせが許可されていません。' : 'ライブアクティビティがオフになっています。'}</p>
              <p>{isAndroid ? '設定アプリの「通知」でツギメモをオンにすると出せます。' : '設定アプリの「ツギメモ」で「ライブアクティビティ」をオンにすると出せます。'}</p>
              <button type="button" className="btn soft sm" onClick={() => setAsking(true)}>もう一度ためす</button>
            </div>
          )}
        </div>
        {!isAndroid && (
          <div className="card">
            <p className="card-title">ロック画面のウィジェットの置き方</p>
            <Steps steps={['ロック画面を長押しして「カスタマイズ」', '「ロック画面」を選び、時計の下の枠を押す', '「ツギメモ」を選んで、四角・1行・丸から置く']} />
            <p className="note">ロック画面のウィジェットの色は、iPhone が壁紙に合わせて決めます。</p>
          </div>
        )}
        {isAndroid && (
          <p className="note pad">Android はロック画面にウィジェットを置けないため、ロック画面にはお知らせで出します。</p>
        )}
      </section>

      <section className="sec">
        <h2 className="sec-title"><span className="sec-icon"><IconHome size={18} /></span>ホーム画面ウィジェット</h2>
        <div className="widgetstage">
          <img className="lm-bg" src="./img/sky.jpg" alt="" draggable={false} />
          {isAndroid ? (
            <div className="wgrid">
              <WidgetMock size="wide" title={snap.list} items={texts} bg={paper.bg} />
              <WidgetMock size="small" title={snap.list} items={texts} bg={paper.bg} />
            </div>
          ) : (
            <div className="wgrid">
              <WidgetMock size="medium" title={snap.list} items={texts} bg={paper.bg} />
              <WidgetMock size="small" title={snap.list} items={texts} bg={paper.bg} />
            </div>
          )}
        </div>
        <div className="card">
          <p className="card-title">置き方</p>
          <Steps steps={isAndroid
            ? ['ホーム画面の何もない所を長押し', '「ウィジェット」を押す', '「ツギメモ」を探して、置きたい所へ動かす']
            : ['ホーム画面の何もない所を長押し', '左上の「編集」(または「+」)から「ウィジェットを追加」', '「ツギメモ」を探して、小か中を置く']} />
          <p className="note">{isAndroid ? '大きさは置いた後に変えられます。丸を押すと完了して、次の1行が上がります。' : '丸を押すと完了して、次の1行が上がります。'}</p>
        </div>
      </section>

      <section className="sec">
        <h2 className="sec-title">出すリスト</h2>
        <ul className="card lists">
          {data.lists.map((l, i) => (
            <li key={l.id}>
              <button
                type="button"
                className={`list-row pick${l.id === data.lockListId ? ' on' : ''}`}
                aria-pressed={l.id === data.lockListId}
                onClick={() => {
                  if (l.id === data.lockListId) return;
                  if (!plus) { openPaywall('lockList'); return; }
                  tap();
                  setData((d) => ({ ...d, lockListId: l.id }));
                }}
              >
                <span className="dot" style={{ background: LIST_DOTS[i % LIST_DOTS.length] }} />
                <span className="list-name">{l.name}</span>
                <span className="list-count num">{pending(getList(data, l.id)).length}</span>
                <span className="list-check">{l.id === data.lockListId ? <IconCheck size={16} /> : null}</span>
              </button>
            </li>
          ))}
        </ul>
        {data.lists.length === 1 && <p className="note pad">リストを増やすと、ここで出すリストを選べます(ツギメモ+)。</p>}
      </section>

      <section className="sec">
        <button type="button" className="card navrow" onClick={() => { tap(); openPapers(); }}>
          <span className="sec-icon"><IconPalette size={18} /></span>
          <span className="nav-main"><span className="nav-title">紙の色</span><span className="nav-sub">ホーム画面のウィジェットとリストの紙</span></span>
          <img className="nav-paper" src={`./img/paper_${paper.id}.png`} alt="" />
          <span className="nav-val">{paper.name}</span>
          <IconChevronRight />
        </button>
      </section>

      {asking && (
        <Sheet title={bigName} onClose={() => setAsking(false)}>
          <p className="sheet-text">
            {isAndroid
              ? 'ロック画面に出すために、お知らせの許可を聞きます。音は鳴らしません。'
              : 'iPhone のライブアクティビティを使って出します。音もバイブもなく、オフにすればすぐ消えます。'}
          </p>
          <div className="sheet-btns col">
            <button type="button" className="btn primary wide" onClick={turnOn}>{isAndroid ? '許可を聞く' : '出す'}</button>
            <button type="button" className="btn text" onClick={() => setAsking(false)}>やめておく</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="steps">
      {steps.map((s, i) => <li key={i}><span className="stepno num">{i + 1}</span><span>{s}</span></li>)}
    </ol>
  );
}
