import { useState } from 'react';
import { daysLeft, historyOf, KEEP_DAYS, restoreEntry, type HistoryEntry } from '../domain/model';
import { tap } from '../platform/native';
import type { Ctx } from './ctx';
import { IconCheck, IconChevronRight, IconClock, IconTrash, IconUndo } from './Icons';
import { Confirm, Sheet } from './Sheets';
import { TopNav } from './TopNav';

type F = 'all' | 'done' | 'deleted';
const WEEK = ['日', '月', '火', '水', '木', '金', '土'];

export const fmtDay = (t: number) => { const d = new Date(t); return `${d.getMonth() + 1}月${d.getDate()}日(${WEEK[d.getDay()]})`; };
export const fmtTime = (t: number) => { const d = new Date(t); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
const startOfDay = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };

/** 履歴(見本「履歴と戻す」): 完了と削除を日ごとに。押すと詳しく見て、元に戻せる */
export function HistoryScreen({ ctx }: { ctx: Ctx }) {
  const { data, setData, toast } = ctx;
  const [f, setF] = useState<F>('all');
  const [open, setOpen] = useState<HistoryEntry | null>(null);
  const [confirm, setConfirm] = useState<HistoryEntry | null>(null);
  const now = Date.now();
  const all = historyOf(data);
  const shown = all.filter((e) => f === 'all' || e.kind === f);
  const groups: { day: number; items: HistoryEntry[] }[] = [];
  for (const e of shown) {
    const day = startOfDay(e.at);
    const g = groups[groups.length - 1];
    if (g && g.day === day) g.items.push(e); else groups.push({ day, items: [e] });
  }
  const today = startOfDay(now);
  const dayLabel = (day: number) => (day === today ? `今日 ${fmtDay(day)}` : day === today - 86400000 ? `昨日 ${fmtDay(day)}` : fmtDay(day));
  const multi = data.lists.length > 1;

  const restore = (e: HistoryEntry) => {
    setData((d) => restoreEntry(d, e.list.id, e.item.id, Date.now()));
    setConfirm(null);
    setOpen(null);
    tap(true);
    toast({ text: `「${short(e.item.text)}」を元に戻しました`, kind: 'dark' });
  };

  return (
    <div className="subscreen history">
      <TopNav ctx={ctx} current="history" />

      <div className="tabs" role="tablist" aria-label="履歴の切り替え">
        {([['all', 'すべて', all.length], ['done', '完了', all.filter((e) => e.kind === 'done').length], ['deleted', '削除', all.filter((e) => e.kind === 'deleted').length]] as const).map(([k, label, n]) => (
          <button key={k} type="button" role="tab" aria-selected={f === k} className={`tab${f === k ? ' on' : ''}`} onClick={() => { tap(); setF(k); }}>
            {label}<span className="num">{n}</span>
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="empty">
          <img className="empty-art" src="./img/logo_paper.png" alt="" draggable={false} />
          <p className="empty-title">履歴はまだありません</p>
          <p className="empty-body">完了したメモと削除したメモが、ここに{KEEP_DAYS}日間残ります。</p>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.day} className="hgroup" aria-label={dayLabel(g.day)}>
            <h2 className="hday"><span>{dayLabel(g.day)}</span><span className="hcount num">{g.items.length}</span></h2>
            <ul className="card hlist">
              {g.items.map((e) => (
                <li key={e.item.id}>
                  <button type="button" className="hrow" onClick={() => { tap(); setOpen(e); }}>
                    <span className={`hicon ${e.kind}`}>{e.kind === 'done' ? <IconCheck size={15} /> : <IconTrash size={16} />}</span>
                    <span className="hmain">
                      <span className="htext">{e.item.text}</span>
                      <span className="hsub">
                        {e.kind === 'done' ? `完了 ${fmtTime(e.at)}` : <>削除 {fmtTime(e.at)} <em>(あと{daysLeft(e.at, now)}日)</em></>}
                        {multi && <span className="hlist-name">・{e.list.name}</span>}
                      </span>
                    </span>
                    <IconChevronRight />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
      <p className="note center pad">完了も削除も{KEEP_DAYS}日間は残ります。それを過ぎると自動で整理されます。</p>

      {open && (
        <Sheet title="履歴" onClose={() => setOpen(null)} className="hsheet">
          <div className={`hdetail ${open.kind}`}>
            <span className={`hicon big ${open.kind}`}>{open.kind === 'done' ? <IconCheck size={22} /> : <IconTrash size={22} />}</span>
            <p className="hd-title">{open.item.text}</p>
            <p className="hd-when">{fmtDay(open.at)} {fmtTime(open.at)} に{open.kind === 'done' ? '完了' : '削除'}{multi ? `(${open.list.name})` : ''}</p>
            {open.kind === 'deleted' && <span className="badge red">あと{daysLeft(open.at, now)}日</span>}
          </div>
          <p className="field-label">メモの内容</p>
          <p className="hd-body">{open.item.text}</p>
          <p className={`hd-note${open.kind === 'deleted' ? ' warn' : ''}`}>
            <IconClock size={18} />
            <span>{open.kind === 'done'
              ? `完了後は${KEEP_DAYS}日間、履歴に残ります。その後、自動で整理されます。`
              : `このメモは${KEEP_DAYS}日後に自動で消えます。それまでなら、元に戻すことができます。`}</span>
          </p>
          <div className="sheet-btns col">
            <button type="button" className="btn primary wide" onClick={() => setConfirm(open)}><IconUndo size={18} /><span>元に戻す</span></button>
          </div>
        </Sheet>
      )}

      {confirm && (
        <Confirm
          title="このメモを元に戻しますか?"
          body={<>「{confirm.item.text}」を<br />元のリストに戻します。</>}
          ok="元に戻す"
          onOk={() => restore(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

const short = (s: string) => (Array.from(s).length > 12 ? Array.from(s).slice(0, 12).join('') + '…' : s);
