import { useState } from 'react';
import { APP_CONFIG } from '../config';
import { cleanText, deletedItems, MAX_LISTS, removeList, renameList, restoreItem, setDaily, type List } from '../domain/model';
import { tap } from '../platform/native';
import type { Ctx } from './ctx';
import { IconChevronRight, IconPlus } from './Icons';
import { ListSheet, Sheet } from './Sheets';

export function SettingsScreen({ ctx, onReplayIntro, onRestore }: { ctx: Ctx; onReplayIntro: () => void; onRestore: () => Promise<void> }) {
  const { data, setData, plus, openPaywall, toast } = ctx;
  const [renaming, setRenaming] = useState<List | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const trash = data.lists.flatMap((l) => deletedItems(l).map((i) => ({ list: l, item: i })));

  return (
    <div className="settings">
      <header className="head"><h1 className="title">設定</h1></header>

      <section className="group">
        {plus ? (
          <p className="plusrow pad"><span className="tag shu">ツギメモ+</span>使っています。ありがとうございます。</p>
        ) : (
          <button type="button" className="row-link" onClick={() => openPaywall('settings')}>
            <span className="rl-main">
              <span className="rl-title">ツギメモ+</span>
              <span className="rl-sub">リストを増やす・毎朝もどす・紙の色。買い切りです。</span>
            </span>
            <IconChevronRight />
          </button>
        )}
      </section>

      <section className="group" aria-labelledby="lists">
        <h2 id="lists" className="eyebrow pad">リスト</h2>
        <ul className="setlist">
          {data.lists.map((l) => (
            <li key={l.id} className="setrow">
              <button type="button" className="setname" onClick={() => { tap(); setRenaming(l); }} aria-label={`${l.name} の名前を変える`}>
                <span>{l.name}</span>
                {l.id === data.lockListId && <span className="tag">ロック画面</span>}
              </button>
              <label className="mini-switch">
                <span>毎朝もどす</span>
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
        </ul>
        {data.lists.length < MAX_LISTS && (
          <button type="button" className="action" onClick={() => { if (!plus) { openPaywall('lists'); return; } tap(); setAdding(true); }}>
            <IconPlus /><span>リストを足す</span>{!plus && <span className="tag shu">ツギメモ+</span>}
          </button>
        )}
        <label className="selectrow">
          <span>毎朝もどす時刻</span>
          <select
            value={data.resetHour}
            onChange={(e) => {
              if (!plus) { openPaywall('daily'); return; }
              setData((d) => ({ ...d, resetHour: Number(e.target.value) }));
            }}
          >
            {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h}時</option>)}
          </select>
        </label>
      </section>

      <section className="group" aria-labelledby="keep">
        <h2 id="keep" className="eyebrow pad">もしもの時</h2>
        <button type="button" className="row-link" onClick={() => { tap(); setTrashOpen(true); }}>
          <span className="rl-main">
            <span className="rl-title">消したもの</span>
            <span className="rl-sub">7日のあいだ戻せます。いま <span className="num">{trash.length}</span> 行</span>
          </span>
          <IconChevronRight />
        </button>
        <button type="button" className="row-link" onClick={() => { tap(); onRestore(); }}>
          <span className="rl-main"><span className="rl-title">購入を戻す</span><span className="rl-sub">機種変更の後などに</span></span>
          <IconChevronRight />
        </button>
      </section>

      <section className="group" aria-labelledby="about">
        <h2 id="about" className="eyebrow pad">このアプリ</h2>
        <button type="button" className="row-link" onClick={() => { tap(); onReplayIntro(); }}>
          <span className="rl-main"><span className="rl-title">最初の説明をもう一度見る</span></span>
          <IconChevronRight />
        </button>
        <a className="row-link" href={APP_CONFIG.supportUrl} target="_blank" rel="noopener noreferrer">
          <span className="rl-main"><span className="rl-title">不具合・ご要望を送る</span><span className="rl-sub">サポートのページが開きます</span></span>
          <IconChevronRight />
        </a>
        <a className="row-link" href={APP_CONFIG.privacyUrl} target="_blank" rel="noopener noreferrer">
          <span className="rl-main"><span className="rl-title">プライバシーポリシー</span><span className="rl-sub">書いた物は端末の外に出ません</span></span>
          <IconChevronRight />
        </a>
        <p className="version pad num">ツギメモ {APP_CONFIG.version}</p>
      </section>

      {renaming && (
        <RenameSheet
          list={renaming}
          canDelete={data.lists.length > 1}
          onClose={() => setRenaming(null)}
          onSave={(n) => { setData((d) => renameList(d, renaming.id, n)); setRenaming(null); tap(); }}
          onDelete={() => {
            setData((d) => removeList(d, renaming.id));
            setRenaming(null);
            toast({ text: `「${renaming.name}」を消しました` });
          }}
        />
      )}

      {trashOpen && (
        <Sheet title="消したもの" onClose={() => setTrashOpen(false)}>
          {trash.length === 0 ? (
            <p className="sheet-text">消した行はありません。消した行と、済んだ行をまとめて片づけた分は、ここに7日残ります。</p>
          ) : (
            <ul className="rows trash">
              {trash.map(({ list, item }) => (
                <li key={item.id} className="row">
                  <span className="rowtext static">
                    {item.text}
                    {data.lists.length > 1 && <small className="from">{list.name}</small>}
                  </span>
                  <button type="button" className="btn ghost sm" onClick={() => { tap(); setData((d) => restoreItem(d, list.id, item.id, Date.now())); }}>戻す</button>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
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
        <div className="sheet-foot">
          <button type="submit" className="btn primary wide" disabled={!cleanText(n) || cleanText(n) === list.name}>名前を変える</button>
          {canDelete && (confirm ? (
            <button type="button" className="btn danger wide" onClick={onDelete}>中の行ごと消す</button>
          ) : (
            <button type="button" className="btn text danger-text" onClick={() => setConfirm(true)}>このリストを消す</button>
          ))}
        </div>
      </form>
    </Sheet>
  );
}
