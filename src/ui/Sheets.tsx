import { useEffect, useRef, useState } from 'react';
import { addList, cleanText, newId, MAX_LISTS, MAX_TEXT, pending, type Item } from '../domain/model';
import { tap } from '../platform/native';
import type { Ctx } from './ctx';
import { IconCheck, IconClose, IconPlus, IconToBottom, IconToTop, IconTrash } from './Icons';

/** 下から出るシート。背景を押すか「閉じる」で閉じる。Esc でも閉じる */
export function Sheet({ title, onClose, children, label }: { title: string; onClose: () => void; children: React.ReactNode; label?: string }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="sheet-wrap" role="presentation">
      <div className="sheet-bg" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label ?? title}>
        <div className="sheet-grip" aria-hidden="true" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="閉じる"><IconClose /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ItemSheet({ item, isTop, onClose, onSave, onMove, onDelete }: {
  item: Item;
  isTop: boolean;
  onClose: () => void;
  onSave: (t: string) => void;
  onMove: (to: 'top' | 'bottom') => void;
  onDelete: () => void;
}) {
  const [t, setT] = useState(item.text);
  const ref = useRef<HTMLTextAreaElement>(null);
  const changed = cleanText(t) !== item.text && !!cleanText(t);
  const len = Array.from(cleanText(t)).length;
  return (
    <Sheet title="この行" onClose={onClose}>
      <textarea
        ref={ref}
        className="editfield"
        value={t}
        rows={2}
        aria-label="行の文"
        onChange={(e) => setT(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); if (changed) onSave(t); } }}
      />
      <p className={`counter num${len >= MAX_TEXT ? ' full' : ''}`}>{len} / {MAX_TEXT}</p>
      <ul className="actions">
        {!isTop && (
          <li><button type="button" className="action" onClick={() => onMove('top')}><IconToTop /><span>いちばん上にする</span></button></li>
        )}
        <li><button type="button" className="action" onClick={() => onMove('bottom')}><IconToBottom /><span>いちばん下へ回す</span></button></li>
        <li><button type="button" className="action danger" onClick={() => { tap(); onDelete(); }}><IconTrash /><span>消す</span></button></li>
      </ul>
      <div className="sheet-foot">
        <button type="button" className="btn primary wide" disabled={!changed} onClick={() => onSave(t)}>書き直す</button>
      </div>
    </Sheet>
  );
}

export function ListSheet({ ctx, current, onPick, onClose }: { ctx: Ctx; current: string; onPick: (id: string) => void; onClose: () => void }) {
  const { data, setData, plus, openPaywall } = ctx;
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const full = data.lists.length >= MAX_LISTS;
  const submit = () => {
    const n = cleanText(name);
    if (!n) return;
    const id = newId(Date.now());
    setData((d) => addList(d, n, Date.now(), id));
    setName('');
    setAdding(false);
    tap();
    onPick(id);
  };
  return (
    <Sheet title="リスト" onClose={onClose}>
      <ul className="picklist">
        {data.lists.map((l) => (
          <li key={l.id}>
            <button type="button" className={`pick${l.id === current ? ' on' : ''}`} onClick={() => { tap(); onPick(l.id); }}>
              <span className="pick-mark">{l.id === current ? <IconCheck /> : null}</span>
              <span className="pick-name">{l.name}</span>
              {l.id === data.lockListId && <span className="tag">ロック画面</span>}
              <span className="pick-count num">{pending(l).length}</span>
            </button>
          </li>
        ))}
      </ul>
      {adding ? (
        <form className="addlist" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <input className="field line" autoFocus value={name} maxLength={12} placeholder="名前(買い物・仕事など)" aria-label="新しいリストの名前" onChange={(e) => setName(e.target.value)} />
          <button type="submit" className="btn primary" disabled={!cleanText(name)}>足す</button>
        </form>
      ) : (
        <button
          type="button"
          className="action"
          disabled={full}
          onClick={() => { if (!plus) { openPaywall('lists'); return; } tap(); setAdding(true); }}
        >
          <IconPlus />
          <span>{full ? `リストは${MAX_LISTS}つまでです` : 'リストを足す'}</span>
          {!plus && <span className="tag shu">ツギメモ+</span>}
        </button>
      )}
    </Sheet>
  );
}
