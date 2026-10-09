import { useEffect, useRef, useState } from 'react';
import {
  addItems, completeItem, deleteItem, doneItems, editItem, getList, MAX_TEXT, moveItem, pending, restoreItem, undoItem, type Item,
} from '../domain/model';
import { tap } from '../platform/native';
import type { Ctx } from './ctx';
import { IconChevron, IconPin, IconUp } from './Icons';
import { ItemSheet, ListSheet } from './Sheets';

export function NowScreen({ ctx, focusSignal }: { ctx: Ctx; focusSignal: number }) {
  const { data, setData, toast } = ctx;
  const [viewId, setViewId] = useState(data.lockListId);
  const list = getList(data, viewId);
  const pend = pending(list);
  const done = doneItems(list);
  const [text, setText] = useState('');
  const [toTop, setToTop] = useState(false);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [listsOpen, setListsOpen] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const onLock = list.id === data.lockListId;

  useEffect(() => { if (focusSignal) inputRef.current?.focus(); }, [focusSignal]);

  const add = () => {
    const t = text;
    if (!t.trim()) { inputRef.current?.focus(); return; }
    setData((d) => addItems(d, list.id, t, Date.now(), toTop));
    setText('');
    setToTop(false);
    tap();
    inputRef.current?.focus();
  };

  const complete = (it: Item) => {
    if (leaving) return;
    tap(true);
    setLeaving(it.id);
    window.setTimeout(() => {
      setData((d) => completeItem(d, list.id, it.id, Date.now()));
      setLeaving(null);
      toast({ text: `「${short(it.text)}」を済みにしました`, undo: () => setData((d) => undoItem(d, list.id, it.id, Date.now())) });
    }, 240);
  };

  const top = pend[0];
  const rest = pend.slice(1);

  return (
    <div className="now">
      <header className="head">
        <button type="button" className="listname" onClick={() => { tap(); setListsOpen(true); }} aria-haspopup="dialog">
          <span>{list.name}</span>
          <IconChevron />
        </button>
        <span className="left num" aria-label={`のこり${pend.length}行`}>のこり <b>{pend.length}</b></span>
      </header>

      <section className="lockline" aria-label="ロック画面のいちばん上">
        <p className="eyebrow">
          {onLock ? 'ロック画面のいちばん上' : 'このリストはロック画面に出ていません'}
        </p>
        {top ? (
          <div className={`toprow${leaving === top.id ? ' leaving' : ''}`} key={top.id}>
            <button type="button" className="ring big" onClick={() => complete(top)} aria-label={`「${top.text}」を済みにする`}>
              <span className="ring-in" />
            </button>
            <button type="button" className="toptext" onClick={() => setEditing(top)}>{top.text}</button>
          </div>
        ) : pend.length === 0 && done.length > 0 ? (
          <div className="empty">
            <p className="empty-title">ぜんぶ済みました</p>
            <p className="empty-body">次の1行を書いておくと、ロック画面で待っています。</p>
          </div>
        ) : (
          <div className="empty">
            <p className="empty-title">まだ何もありません</p>
            <p className="empty-body">下の欄に1行書くと、こことロック画面のいちばん上に出ます。</p>
          </div>
        )}
      </section>

      {rest.length > 0 && (
        <section aria-label="つぎ">
          <p className="eyebrow pad">つぎ</p>
          <ol className="rows">
            {rest.map((it, i) => (
              <li key={it.id} className={`row${leaving === it.id ? ' leaving' : ''}`}>
                <button type="button" className="ring" onClick={() => complete(it)} aria-label={`「${it.text}」を済みにする`}>
                  <span className="ring-in" />
                </button>
                <button type="button" className="rowtext" onClick={() => setEditing(it)}>
                  <span className="ord num">{i + 2}</span>
                  {it.text}
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

      {done.length > 0 && (
        <section className="donebox" aria-label="済んだ">
          <button type="button" className="donehead" aria-expanded={showDone} onClick={() => { tap(); setShowDone((v) => !v); }}>
            <span>済んだ <span className="num">{done.length}</span></span>
            <IconChevron className={showDone ? 'flip' : ''} />
          </button>
          {showDone && (
            <ul className="rows">
              {done.map((it) => (
                <li key={it.id} className="row done">
                  <button type="button" className="ring checked" onClick={() => { tap(); setData((d) => undoItem(d, list.id, it.id, Date.now())); }} aria-label={`「${it.text}」を戻す`}>
                    <span className="ring-in" />
                  </button>
                  <span className="rowtext static">{it.text}</span>
                </li>
              ))}
              <li className="donehint">済んだ行は7日たつと消えます。丸を押すと戻ります。</li>
            </ul>
          )}
        </section>
      )}

      <form className="inputbar" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <button
          type="button"
          className={`pin${toTop ? ' on' : ''}`}
          aria-pressed={toTop}
          aria-label="いちばん上に足す"
          onClick={() => { tap(); setToTop((v) => !v); }}
        >
          <IconPin size={18} />
          <span className="pin-label">{toTop ? '上に' : '下に'}</span>
        </button>
        <textarea
          ref={inputRef}
          className="field"
          rows={1}
          value={text}
          maxLength={MAX_TEXT * 20}
          placeholder={toTop ? '上に足す1行' : '1行書いて足す'}
          enterKeyHint="done"
          aria-label="足す1行"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); add(); }
          }}
        />
        <button type="submit" className="send" aria-label="足す" disabled={!text.trim()}>
          <IconUp />
        </button>
      </form>

      {editing && (
        <ItemSheet
          item={editing}
          isTop={top?.id === editing.id}
          onClose={() => setEditing(null)}
          onSave={(t) => { setData((d) => editItem(d, list.id, editing.id, t, Date.now())); setEditing(null); }}
          onMove={(to) => { tap(); setData((d) => moveItem(d, list.id, editing.id, to)); setEditing(null); toast({ text: to === 'top' ? 'いちばん上にしました' : 'いちばん下にしました' }); }}
          onDelete={() => {
            const id = editing.id;
            setData((d) => deleteItem(d, list.id, id, Date.now()));
            setEditing(null);
            toast({ text: '消しました', undo: () => setData((d) => restoreItem(d, list.id, id, Date.now())) });
          }}
        />
      )}

      {listsOpen && (
        <ListSheet
          ctx={ctx}
          current={list.id}
          onPick={(id) => { setViewId(id); setListsOpen(false); }}
          onClose={() => setListsOpen(false)}
        />
      )}
    </div>
  );
}

const short = (s: string) => (Array.from(s).length > 12 ? Array.from(s).slice(0, 12).join('') + '…' : s);
