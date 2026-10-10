import { useState } from 'react';
import { APP_CONFIG } from '../config';
import { cleanText, historyOf, MAX_LISTS, PAPERS, removeList, renameList, setDaily, type List } from '../domain/model';
import { isAndroid, tap } from '../platform/native';
import type { Ctx } from './ctx';
import {
  IconChevronRight, IconHistory, IconLock, IconMail, IconPalette, IconPlus, IconReplay, IconShield, IconStore, IconSun,
} from './Icons';
import { Confirm, LIST_DOTS, ListSheet, Sheet } from './Sheets';
import { TopNav } from './TopNav';

export function SettingsScreen({ ctx, onReplayIntro, onRestore }: { ctx: Ctx; onReplayIntro: () => void; onRestore: () => Promise<void> }) {
  const { data, setData, plus, openPaywall, toast, go, openPapers } = ctx;
  const [renaming, setRenaming] = useState<List | null>(null);
  const [adding, setAdding] = useState(false);
  const paper = PAPERS.find((p) => p.id === data.paper) ?? PAPERS[0];
  const hist = historyOf(data).length;

  return (
    <div className="subscreen settings">
      <TopNav ctx={ctx} current="settings" />

      {plus ? (
        <p className="plusrow"><span className="plusmark">ツギメモ<b>+</b></span>使っています。ありがとうございます。</p>
      ) : (
        <button type="button" className="plusbanner" onClick={() => openPaywall('settings')}>
          <span className="pb-main">
            <span className="pb-title">ツギメモ<b>+</b></span>
            <span className="pb-sub">8つまでのリスト・毎朝戻るリスト・紙の色6色。買い切りです。</span>
          </span>
          <IconChevronRight />
        </button>
      )}

      <section className="sec">
        <h2 className="sec-title">表示</h2>
        <div className="card">
          <button type="button" className="navrow" onClick={() => { tap(); go('display'); }}>
            <span className="sec-icon"><IconLock size={18} /></span>
            <span className="nav-main">
              <span className="nav-title">表示場所</span>
              <span className="nav-sub">{isAndroid ? 'ロック画面のお知らせ・ホーム画面のウィジェット' : 'ロック画面・ホーム画面のウィジェット'}</span>
            </span>
            <span className="nav-val">{data.bigOnLock ? (isAndroid ? 'お知らせ オン' : '大きく オン') : ''}</span>
            <IconChevronRight />
          </button>
          <button type="button" className="navrow" onClick={() => { tap(); openPapers(); }}>
            <span className="sec-icon"><IconPalette size={18} /></span>
            <span className="nav-main"><span className="nav-title">紙の色</span></span>
            <img className="nav-paper" src={`./img/paper_${paper.id}.png`} alt="" />
            <span className="nav-val">{paper.name}</span>
            <IconChevronRight />
          </button>
        </div>
      </section>

      <section className="sec" aria-labelledby="lists">
        <h2 id="lists" className="sec-title">リスト</h2>
        <ul className="card setlist">
          {data.lists.map((l, i) => (
            <li key={l.id} className="setrow">
              <button type="button" className="setname" onClick={() => { tap(); setRenaming(l); }} aria-label={`${l.name} の名前を変える`}>
                <span className="dot" style={{ background: LIST_DOTS[i % LIST_DOTS.length] }} />
                <span className="list-name">{l.name}</span>
                {l.id === data.lockListId && <span className="tag">ロック画面</span>}
              </button>
              <label className="mini-switch">
                <span>毎朝戻す</span>
                <input
                  type="checkbox"
                  role="switch"
                  className="switch"
                  checked={l.daily}
                  onChange={(e) => {
                    if (!plus) { openPaywall('daily'); return; }
                    tap();
                    setData((d) => setDaily(d, l.id, e.target.checked));
                  }}
                />
              </label>
            </li>
          ))}
          {data.lists.length < MAX_LISTS && (
            <li>
              <button type="button" className="add-row" onClick={() => { if (!plus) { openPaywall('lists'); return; } tap(); setAdding(true); }}>
                <IconPlus /><span>新しいリストを作成</span>{!plus && <span className="tag plus">ツギメモ+</span>}
              </button>
            </li>
          )}
        </ul>
        <div className="card">
          <label className="selectrow">
            <span className="sec-icon"><IconSun size={18} /></span>
            <span className="nav-main"><span className="nav-title">毎朝戻す時刻</span><span className="nav-sub">「毎朝戻す」のリストは、この時刻に完了の印が外れます</span></span>
            <select
              value={data.resetHour}
              aria-label="毎朝戻す時刻"
              onChange={(e) => {
                if (!plus) { openPaywall('daily'); return; }
                setData((d) => ({ ...d, resetHour: Number(e.target.value) }));
              }}
            >
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h}時</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="sec">
        <h2 className="sec-title">もしもの時</h2>
        <div className="card">
          <button type="button" className="navrow" onClick={() => { tap(); go('history'); }}>
            <span className="sec-icon"><IconHistory size={18} /></span>
            <span className="nav-main"><span className="nav-title">履歴</span><span className="nav-sub">完了と削除は7日間戻せます。いま <span className="num">{hist}</span> 件</span></span>
            <IconChevronRight />
          </button>
          <button type="button" className="navrow" onClick={() => { tap(); onRestore(); }}>
            <span className="sec-icon"><IconStore size={18} /></span>
            <span className="nav-main"><span className="nav-title">購入を戻す</span><span className="nav-sub">機種変更の後などに</span></span>
            <IconChevronRight />
          </button>
        </div>
      </section>

      <section className="sec">
        <h2 className="sec-title">このアプリ</h2>
        <div className="card">
          <button type="button" className="navrow" onClick={() => { tap(); onReplayIntro(); }}>
            <span className="sec-icon"><IconReplay size={18} /></span>
            <span className="nav-main"><span className="nav-title">はじめての説明をもう一度見る</span></span>
            <IconChevronRight />
          </button>
          <a className="navrow" href={APP_CONFIG.supportUrl} target="_blank" rel="noopener noreferrer">
            <span className="sec-icon"><IconMail size={18} /></span>
            <span className="nav-main"><span className="nav-title">不具合・ご要望を送る</span><span className="nav-sub">サポートのページが開きます</span></span>
            <IconChevronRight />
          </a>
          <a className="navrow" href={APP_CONFIG.privacyUrl} target="_blank" rel="noopener noreferrer">
            <span className="sec-icon"><IconShield size={18} /></span>
            <span className="nav-main"><span className="nav-title">プライバシーポリシー</span><span className="nav-sub">書いた物は端末の外に出ません</span></span>
            <IconChevronRight />
          </a>
        </div>
        <div className="about">
          <img src="./img/app_icon.png" alt="" />
          <p><b>ツギメモ</b><span className="num">{APP_CONFIG.version}</span></p>
          <p className="note">登録なし・広告なし</p>
        </div>
      </section>

      {renaming && (
        <RenameSheet
          list={renaming}
          canDelete={data.lists.length > 1}
          onClose={() => setRenaming(null)}
          onSave={(n) => { setData((d) => renameList(d, renaming.id, n)); setRenaming(null); tap(); toast({ text: '名前を変えました', kind: 'ok' }); }}
          onDelete={() => {
            setData((d) => removeList(d, renaming.id));
            setRenaming(null);
            toast({ text: `「${renaming.name}」を削除しました`, kind: 'info' });
          }}
        />
      )}

      {adding && (
        <ListSheet ctx={ctx} current={data.lockListId} onPick={() => setAdding(false)} onClose={() => setAdding(false)} />
      )}
    </div>
  );
}

function RenameSheet({ list, canDelete, onClose, onSave, onDelete }: { list: List; canDelete: boolean; onClose: () => void; onSave: (n: string) => void; onDelete: () => void }) {
  const [n, setN] = useState(list.name);
  const [confirm, setConfirm] = useState(false);
  return (
    <Sheet title="リストの名前" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); if (cleanText(n)) onSave(n); }}>
        <input className="field line" value={n} maxLength={12} aria-label="リストの名前" onChange={(e) => setN(e.target.value)} />
        <div className="sheet-btns">
          {canDelete && <button type="button" className="btn soft danger-text" onClick={() => setConfirm(true)}>削除</button>}
          <button type="button" className="btn soft" onClick={onClose}>キャンセル</button>
          <button type="submit" className="btn primary" disabled={!cleanText(n) || cleanText(n) === list.name}>保存</button>
        </div>
      </form>
      {confirm && (
        <Confirm
          danger
          title="このリストを削除しますか?"
          body={<>「{list.name}」と、中のメモをまとめて削除します。</>}
          ok="中のメモごと削除"
          onOk={onDelete}
          onCancel={() => setConfirm(false)}
        />
      )}
    </Sheet>
  );
}
