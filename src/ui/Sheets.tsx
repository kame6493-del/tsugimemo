import { useEffect, useRef, useState } from 'react';
import { addList, cleanText, FREE_PAPERS, MAX_LISTS, MAX_TEXT, newId, PAPERS, pending, type Item } from '../domain/model';
import { tap } from '../platform/native';
import type { Ctx } from './ctx';
import { IconCheck, IconClose, IconPlus, IconToBottom, IconToTop, IconTrash, IconUndo } from './Icons';

/** 下から出るシート(見本: 左に ×、まん中に題)。背景を押す・× ・Esc で閉じる */
export function Sheet({ title, onClose, children, label, className }: { title: string; onClose: () => void; children: React.ReactNode; label?: string; className?: string }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="sheet-wrap" role="presentation">
      <div className="sheet-bg" onClick={onClose} />
      <div className={`sheet${className ? ' ' + className : ''}`} role="dialog" aria-modal="true" aria-label={label ?? title}>
        <div className="sheet-grip" aria-hidden="true" />
        <div className="sheet-head">
          <button type="button" className="iconbtn" onClick={onClose} aria-label="閉じる"><IconClose /></button>
          <h2>{title}</h2>
          <span className="iconbtn-space" />
        </div>
        {children}
      </div>
    </div>
  );
}

/** まん中に出る確かめ(見本: このメモを元に戻しますか?) */
export function Confirm({ title, body, ok, onOk, onCancel, danger }: { title: string; body: React.ReactNode; ok: string; onOk: () => void; onCancel: () => void; danger?: boolean }) {
  return (
    <div className="dialog-wrap" role="presentation">
      <div className="sheet-bg" onClick={onCancel} />
      <div className="dialog" role="alertdialog" aria-modal="true" aria-label={title}>
        <span className={`dialog-icon${danger ? ' danger' : ''}`} aria-hidden="true">{danger ? <IconTrash size={22} /> : <IconUndo size={22} />}</span>
        <h2>{title}</h2>
        <p>{body}</p>
        <div className="dialog-btns">
          <button type="button" className="btn soft" onClick={onCancel}>キャンセル</button>
          <button type="button" className={`btn ${danger ? 'danger' : 'primary'}`} onClick={onOk}>{ok}</button>
        </div>
      </div>
    </div>
  );
}

/** メモの編集(見本: 文の欄と ×、下に 削除・キャンセル・保存) */
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
    <Sheet title="メモの編集" onClose={onClose}>
      <div className="editbox">
        <textarea
          ref={ref}
          className="editfield"
          value={t}
          rows={2}
          aria-label="メモの文"
          onChange={(e) => setT(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); if (changed) onSave(t); } }}
        />
        {t && <button type="button" className="clearbtn" aria-label="文を消す" onClick={() => { setT(''); ref.current?.focus(); }}><IconClose size={14} /></button>}
      </div>
      <p className={`counter num${len >= MAX_TEXT ? ' full' : ''}`}>{len}/{MAX_TEXT}</p>
      <ul className="menu">
        {!isTop && (
          <li><button type="button" className="menu-row" onClick={() => onMove('top')}><IconToTop /><span>いちばん上にする</span><small>ロック画面に出ます</small></button></li>
        )}
        <li><button type="button" className="menu-row" onClick={() => onMove('bottom')}><IconToBottom /><span>いちばん下へ回す</span></button></li>
      </ul>
      <div className="sheet-btns">
        <button type="button" className="btn soft danger-text" onClick={() => { tap(); onDelete(); }}>削除</button>
        <button type="button" className="btn soft" onClick={onClose}>キャンセル</button>
        <button type="button" className="btn primary" disabled={!changed} onClick={() => onSave(t)}>保存</button>
      </div>
    </Sheet>
  );
}

/** リストの色の点(見本の「リスト」画面。リストごとに並び順で色を当てる) */
export const LIST_DOTS = ['#F3A6A0', '#C8BDF2', '#B7DDB0', '#9EC8F2', '#F6D27E', '#A9DCCB', '#F3B9D4', '#C9C2B4'];

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
      <ul className="lists">
        {data.lists.map((l, i) => (
          <li key={l.id}>
            <button type="button" className={`list-row${l.id === current ? ' on' : ''}`} aria-pressed={l.id === current} onClick={() => { tap(); onPick(l.id); }}>
              <span className="dot" style={{ background: LIST_DOTS[i % LIST_DOTS.length] }} />
              <span className="list-name">{l.name}</span>
              {l.id === data.lockListId && <span className="tag">ロック画面</span>}
              <span className="list-count num">{pending(l).length}</span>
              <span className="list-check">{l.id === current ? <IconCheck size={16} /> : null}</span>
            </button>
          </li>
        ))}
      </ul>
      {adding ? (
        <form className="addlist" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <input className="field line" autoFocus value={name} maxLength={12} placeholder="名前(買い物・仕事など)" aria-label="新しいリストの名前" onChange={(e) => setName(e.target.value)} />
          <button type="submit" className="btn primary" disabled={!cleanText(name)}>作成</button>
        </form>
      ) : (
        <button
          type="button"
          className="add-row"
          disabled={full}
          onClick={() => { if (!plus) { openPaywall('lists'); return; } tap(); setAdding(true); }}
        >
          <IconPlus />
          <span>{full ? `リストは${MAX_LISTS}つまでです` : '新しいリストを作成'}</span>
          {!plus && <span className="tag plus">ツギメモ+</span>}
        </button>
      )}
    </Sheet>
  );
}

/** 紙の色を選ぶ(見本: ちぎった紙の6色。選んだ紙は青い枠とチェック) */
export function PaperSheet({ ctx, onClose }: { ctx: Ctx; onClose: () => void }) {
  const { data, setData, plus, openPaywall } = ctx;
  return (
    <Sheet title="紙の色を選ぶ" onClose={onClose}>
      <div className="papers" role="radiogroup" aria-label="紙の色">
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
              <span className="paper-img">
                <img src={`./img/paper_${p.id}.png`} alt="" draggable={false} />
                {on && <span className="paper-on"><IconCheck size={14} /></span>}
                {locked && <span className="paper-lock">+</span>}
              </span>
              <span className="paper-name">{p.name}</span>
            </button>
          );
        })}
      </div>
      <p className="note center">{plus ? 'リストの紙と、ホーム画面のウィジェットの色が変わります。' : 'ミルクのほかの5色は、ツギメモ+ で使えます。'}</p>
    </Sheet>
  );
}
