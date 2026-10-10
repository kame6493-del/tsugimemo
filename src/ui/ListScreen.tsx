import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  addItems, completeItem, deleteItem, doneItems, editItem, getList, MAX_TEXT, moveItem, pending, reorderPending, restoreItem, undoItem, type Item,
} from '../domain/model';
import { tap } from '../platform/native';
import type { Ctx } from './ctx';
import { IconArrowRight, IconCheck, IconChevronDown, IconClose, IconGear, IconHandle, IconHistory, IconPencil, IconPlus, IconToTop, IconTrash } from './Icons';
import { ItemSheet, ListSheet } from './Sheets';

type Filter = 'all' | 'open' | 'done';
const SWIPE = 144; // 左にずらして出す「編集」「削除」の幅
const LONG_PRESS = 450;

/**
 * メモ一覧(見本①・アプリ画面の詳細①・ギミックUI集)
 * - 丸を押すと: 縮む(0.12秒)→青いチェック(0.2秒)→下の完了へ移り、次の行がスッと上がる
 * - 左にスワイプで「編集」「削除」、長押し(または右の取っ手)で並べ替え
 * - いちばん上の行(黄色)がロック画面とウィジェットに出る
 */
export function ListScreen({ ctx, focusSignal }: { ctx: Ctx; focusSignal: number }) {
  const { data, setData, toast, go } = ctx;
  const [viewId, setViewId] = useState(data.lockListId);
  const list = getList(data, viewId);
  const pend = pending(list);
  const done = doneItems(list);
  const [filter, setFilter] = useState<Filter>('all');
  const [text, setText] = useState('');
  const [toTop, setToTop] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [listsOpen, setListsOpen] = useState(false);
  const [openSwipe, setOpenSwipe] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; from: number; dy: number; h: number } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const onLock = list.id === data.lockListId;
  const title = data.lists.length > 1 ? list.name : 'ツギメモ';

  useEffect(() => { if (focusSignal) inputRef.current?.focus(); }, [focusSignal]);

  // 並びが変わった時に、行を前の場所から今の場所へすべらせる(次の行がスッと上がる)
  useFlip(listRef, [...pend.map((i) => i.id), '|', ...done.map((i) => i.id), filter].join(','));

  // 並べ替えの間は、指の縦の動きで画面がスクロールしないようにする
  useEffect(() => {
    const el = listRef.current;
    if (!el || !drag) return;
    const stop = (e: TouchEvent) => e.preventDefault();
    el.addEventListener('touchmove', stop, { passive: false });
    return () => el.removeEventListener('touchmove', stop);
  }, [drag]);

  const add = () => {
    const t = text;
    if (!t.trim()) { inputRef.current?.focus(); return; }
    setData((d) => addItems(d, list.id, t, Date.now(), toTop));
    setText('');
    if (toTop) toast({ text: 'いちばん上に足しました。ロック画面に出ます', kind: 'ok' });
    setToTop(false);
    tap();
    inputRef.current?.focus();
  };

  const complete = (it: Item) => {
    if (checking) return;
    tap(true);
    setOpenSwipe(null);
    setChecking(it.id);
    window.setTimeout(() => {
      setData((d) => completeItem(d, list.id, it.id, Date.now()));
      setChecking(null);
      toast({ text: `「${short(it.text)}」を完了にしました`, kind: 'ok', undo: () => setData((d) => undoItem(d, list.id, it.id, Date.now())) });
    }, 420);
  };

  const remove = (it: Item) => {
    setOpenSwipe(null);
    setData((d) => deleteItem(d, list.id, it.id, Date.now()));
    toast({ text: 'メモを削除しました。7日間は履歴から戻せます', kind: 'info', undo: () => setData((d) => restoreItem(d, list.id, it.id, Date.now())) });
  };

  // ---------- 並べ替え ----------
  const startDrag = (id: string, h: number) => {
    const from = pend.findIndex((i) => i.id === id);
    if (from < 0) return;
    tap();
    setOpenSwipe(null);
    setDrag({ id, from, dy: 0, h });
  };
  const moveDrag = (dy: number) => setDrag((g) => (g ? { ...g, dy } : g));
  const endDrag = () => {
    if (!drag) return;
    const to = clamp(drag.from + Math.round(drag.dy / drag.h), 0, pend.length - 1);
    if (to !== drag.from) {
      const order = pend.map((i) => i.id);
      order.splice(drag.from, 1);
      order.splice(to, 0, drag.id);
      setData((d) => reorderPending(d, list.id, order));
      tap();
    }
    setDrag(null);
  };
  const dragTarget = drag ? clamp(drag.from + Math.round(drag.dy / drag.h), 0, pend.length - 1) : -1;
  const shiftOf = (idx: number) => {
    if (!drag || idx === drag.from) return 0;
    if (drag.from < dragTarget && idx > drag.from && idx <= dragTarget) return -drag.h;
    if (drag.from > dragTarget && idx < drag.from && idx >= dragTarget) return drag.h;
    return 0;
  };

  const showOpen = filter !== 'done';
  const showDone = filter !== 'open';
  const empty = pend.length === 0 && done.length === 0;

  return (
    <div className="listscreen">
      <header className="topbar">
        <button type="button" className="iconbtn" aria-label="履歴" onClick={() => { tap(); go('history'); }}><IconHistory /></button>
        <button type="button" className="titlebtn" onClick={() => { tap(); setListsOpen(true); }} aria-haspopup="dialog" aria-label={`リストを選ぶ(いまは${list.name})`}>
          <h1>{title}</h1>
          <IconChevronDown />
        </button>
        <button type="button" className="iconbtn" aria-label="設定" onClick={() => { tap(); go('settings'); }}><IconGear /></button>
      </header>

      <div className="tabs" role="tablist" aria-label="表示の切り替え">
        {([['all', 'すべて', pend.length + done.length], ['open', '進行中', pend.length], ['done', '完了', done.length]] as const).map(([k, label, n]) => (
          <button key={k} type="button" role="tab" aria-selected={filter === k} className={`tab${filter === k ? ' on' : ''}`} onClick={() => { tap(); setFilter(k); }}>
            {label}<span className="num">{n}</span>
          </button>
        ))}
      </div>

      {(!empty || !onLock) && (
        <p className={`hint${onLock ? '' : ' off'}`}>
          {onLock ? (pend.length ? '黄色の行が、ロック画面とウィジェットに出ます' : 'ぜんぶ完了しました') : 'このリストはロック画面に出ていません'}
        </p>
      )}

      <div className="paper-panel" ref={listRef}>
        {empty ? (
          <Empty
            title="まだメモがありません"
            body="やることを追加して、今日を少しずつ進めましょう。"
            action="メモを追加…"
            onAction={() => inputRef.current?.focus()}
          />
        ) : (
          <>
            {showOpen && pend.length === 0 && (
              <Empty small title="ぜんぶ完了しました" body="次の1行を書いておくと、ロック画面で待っています。" />
            )}
            {showOpen && pend.length > 0 && (
              <ol className="rows" aria-label="進行中">
                {pend.map((it, idx) => (
                  <Row
                    key={it.id}
                    item={it}
                    top={idx === 0 && onLock}
                    checking={checking === it.id}
                    swipeOpen={openSwipe === it.id}
                    onSwipe={(open) => setOpenSwipe(open ? it.id : null)}
                    dragging={drag?.id === it.id}
                    dragDy={drag?.id === it.id ? drag.dy : shiftOf(idx)}
                    anyDrag={!!drag}
                    onToggle={() => complete(it)}
                    onEdit={() => { setOpenSwipe(null); setEditing(it); }}
                    onDelete={() => remove(it)}
                    onDragStart={(h) => startDrag(it.id, h)}
                    onDragMove={moveDrag}
                    onDragEnd={endDrag}
                  />
                ))}
              </ol>
            )}
            {showDone && done.length > 0 && (
              <ul className="rows done-rows" aria-label="完了">
                {done.map((it) => (
                  <li key={it.id} className="row done" data-flip={it.id}>
                    <div className="row-in">
                      <button type="button" className="ring checked" onClick={() => { tap(); setData((d) => undoItem(d, list.id, it.id, Date.now())); }} aria-label={`「${it.text}」を未完了に戻す`}>
                        <span className="ring-fill"><IconCheck size={14} /></span>
                      </button>
                      <span className="rowtext">{it.text}</span>
                      <span className="handle ghost" aria-hidden="true"><IconHandle /></span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {filter === 'done' && done.length === 0 && (
              <Empty small title="完了したメモはまだありません" body="丸を押すと、ここに移ります。" />
            )}
            {filter === 'done' && (
              <button type="button" className="linkrow" onClick={() => { tap(); go('history'); }}>
                <IconHistory size={18} /><span>完了と削除は7日間、履歴から戻せます</span><IconArrowRight size={16} />
              </button>
            )}
          </>
        )}
      </div>

      <form className="addbar" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <button
          type="button"
          className={`addbar-mode${toTop ? ' on' : ''}`}
          aria-pressed={toTop}
          aria-label="いちばん上に足す"
          title={toTop ? 'いちばん上に足します' : '下に足します'}
          onClick={() => { tap(); setToTop((v) => !v); inputRef.current?.focus(); }}
        >
          {toTop ? <IconToTop size={20} /> : <IconPlus size={20} />}
        </button>
        <textarea
          ref={inputRef}
          className="field"
          rows={1}
          value={text}
          maxLength={MAX_TEXT * 20}
          placeholder={toTop ? 'いちばん上に追加…' : 'メモを追加…'}
          enterKeyHint="done"
          aria-label="追加するメモ"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); add(); }
          }}
        />
        {text && (
          <button type="button" className="clearbtn" aria-label="入力を消す" onClick={() => { setText(''); inputRef.current?.focus(); }}><IconClose size={14} /></button>
        )}
        <button type="submit" className="send" aria-label="追加" disabled={!text.trim()}>
          <IconArrowRight size={20} />
        </button>
      </form>

      {editing && (
        <ItemSheet
          item={editing}
          isTop={pend[0]?.id === editing.id}
          onClose={() => setEditing(null)}
          onSave={(t) => { setData((d) => editItem(d, list.id, editing.id, t, Date.now())); setEditing(null); toast({ text: 'メモを保存しました', kind: 'ok' }); }}
          onMove={(to) => { tap(); setData((d) => moveItem(d, list.id, editing.id, to)); setEditing(null); toast({ text: to === 'top' ? 'いちばん上にしました' : 'いちばん下にしました', kind: 'ok' }); }}
          onDelete={() => { const it = editing; setEditing(null); remove(it); }}
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

function Row({ item, top, checking, swipeOpen, onSwipe, dragging, dragDy, anyDrag, onToggle, onEdit, onDelete, onDragStart, onDragMove, onDragEnd }: {
  item: Item;
  top: boolean;
  checking: boolean;
  swipeOpen: boolean;
  onSwipe: (open: boolean) => void;
  dragging: boolean;
  dragDy: number;
  anyDrag: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: (h: number) => void;
  onDragMove: (dy: number) => void;
  onDragEnd: () => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const g = useRef<{ x: number; y: number; mode: 'none' | 'swipe' | 'drag' | 'cancel'; timer?: number; base: number; id: number } | null>(null);
  const [dx, setDx] = useState<number | null>(null);
  const suppress = useRef(false);
  const offset = dx ?? (swipeOpen ? -SWIPE : 0);

  const begin = (e: React.PointerEvent, viaHandle: boolean) => {
    if (e.button !== 0 || anyDrag) return;
    const s = { x: e.clientX, y: e.clientY, mode: 'none' as const, base: swipeOpen ? -SWIPE : 0, id: e.pointerId, timer: undefined as number | undefined };
    g.current = s;
    const h = ref.current?.getBoundingClientRect().height ?? 52;
    if (viaHandle) {
      g.current.mode = 'drag';
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      onDragStart(h);
      return;
    }
    g.current.timer = window.setTimeout(() => {
      if (g.current && g.current.mode === 'none') {
        g.current.mode = 'drag';
        try { ref.current?.setPointerCapture(s.id); } catch { /* 指が離れていた */ }
        onDragStart(h);
      }
    }, LONG_PRESS);
  };

  const move = (e: React.PointerEvent) => {
    const s = g.current;
    if (!s) return;
    const mx = e.clientX - s.x;
    const my = e.clientY - s.y;
    if (s.mode === 'drag') { onDragMove(my); return; }
    if (s.mode === 'none') {
      if (Math.abs(mx) > 10 && Math.abs(mx) > Math.abs(my)) {
        s.mode = 'swipe';
        window.clearTimeout(s.timer);
        try { ref.current?.setPointerCapture(e.pointerId); } catch { /* 無くても動く */ }
      } else if (Math.abs(my) > 10) {
        s.mode = 'cancel';
        window.clearTimeout(s.timer);
      }
    }
    if (s.mode === 'swipe') setDx(clamp(s.base + mx, -SWIPE - 24, 0));
  };

  const end = () => {
    const s = g.current;
    g.current = null;
    if (!s) return;
    window.clearTimeout(s.timer);
    if (s.mode === 'drag' || s.mode === 'swipe') { suppress.current = true; window.setTimeout(() => { suppress.current = false; }, 50); }
    if (s.mode === 'drag') { onDragEnd(); return; }
    if (s.mode === 'swipe') {
      const open = (dx ?? 0) < -SWIPE / 2.4;
      setDx(null);
      onSwipe(open);
      if (open) tap();
    }
  };

  return (
    <li
      ref={ref}
      className={`row${top ? ' top' : ''}${checking ? ' checking' : ''}${dragging ? ' dragging' : ''}`}
      data-flip={item.id}
      style={{ transform: dragDy ? `translateY(${dragDy}px)${dragging ? ' scale(1.03)' : ''}` : dragging ? 'scale(1.03)' : undefined, zIndex: dragging ? 5 : undefined }}
      onPointerDown={(e) => begin(e, false)}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onContextMenu={(e) => e.preventDefault()}
      onClickCapture={(e) => { if (suppress.current) { e.stopPropagation(); e.preventDefault(); suppress.current = false; } }}
    >
      <div className="swipe-actions" aria-hidden={!swipeOpen}>
        <button type="button" className="sa edit" tabIndex={swipeOpen ? 0 : -1} onClick={onEdit}><IconPencil /><span>編集</span></button>
        <button type="button" className="sa del" tabIndex={swipeOpen ? 0 : -1} onClick={onDelete}><IconTrash /><span>削除</span></button>
      </div>
      <div className={`row-in${dx !== null ? ' moving' : ''}`} style={{ transform: offset ? `translateX(${offset}px)` : undefined }}>
        <button type="button" className={`ring${checking ? ' checked pop' : ''}`} onClick={onToggle} aria-label={`「${item.text}」を完了にする`}>
          <span className="ring-fill"><IconCheck size={14} /></span>
          {checking && <span className="spark" aria-hidden="true"><i /><i /><i /><i /><i /></span>}
        </button>
        <button type="button" className="rowtext" onClick={() => { if (swipeOpen) { onSwipe(false); return; } onEdit(); }}>{item.text}</button>
        <span
          className="handle"
          role="button"
          tabIndex={-1}
          aria-label={`「${item.text}」を並べ替える`}
          onPointerDown={(e) => { e.stopPropagation(); begin(e, true); }}
        >
          <IconHandle />
        </span>
      </div>
    </li>
  );
}

function Empty({ title, body, action, onAction, small }: { title: string; body: string; action?: string; onAction?: () => void; small?: boolean }) {
  return (
    <div className={`empty${small ? ' small' : ''}`}>
      {!small && <img className="empty-art" src="./img/logo_paper.png" alt="" draggable={false} />}
      <p className="empty-title">{title}</p>
      <p className="empty-body">{body}</p>
      {action && (
        <button type="button" className="btn primary pill" onClick={onAction}><IconPlus size={18} /><span>{action}</span></button>
      )}
    </div>
  );
}

/** 並びが変わった行を、前の場所からすべらせる(FLIP) */
function useFlip(ref: React.RefObject<HTMLElement | null>, key: string) {
  const prev = useRef(new Map<string, number>());
  const lastKey = useRef(key);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const now = new Map<string, number>();
    el.querySelectorAll<HTMLElement>('[data-flip]').forEach((n) => now.set(n.dataset.flip!, n.getBoundingClientRect().top));
    if (lastKey.current !== key) {
      el.querySelectorAll<HTMLElement>('[data-flip]').forEach((n) => {
        const before = prev.current.get(n.dataset.flip!);
        const after = now.get(n.dataset.flip!);
        if (before === undefined || after === undefined || Math.abs(before - after) < 1) return;
        n.animate([{ transform: `translateY(${before - after}px)` }, { transform: 'translateY(0)' }], { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' });
      });
      lastKey.current = key;
    }
    prev.current = now;
  });
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const short = (s: string) => (Array.from(s).length > 12 ? Array.from(s).slice(0, 12).join('') + '…' : s);
