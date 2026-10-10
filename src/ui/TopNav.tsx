import { getList, pending } from '../domain/model';
import { tap } from '../platform/native';
import type { Ctx, Screen } from './ctx';
import { IconGear } from './Icons';

/** 履歴と設定の上(見本「履歴と戻す」①): 題「ツギメモ」と、リスト・履歴・設定の切り替え */
export function TopNav({ ctx, current }: { ctx: Ctx; current: Screen }) {
  const n = pending(getList(ctx.data, ctx.data.lockListId)).length;
  return (
    <>
      <header className="topbar">
        <span className="iconbtn-space" />
        <h1>ツギメモ</h1>
        <button type="button" className="iconbtn" aria-label="設定" aria-current={current === 'settings' ? 'page' : undefined} onClick={() => { tap(); ctx.go('settings'); }}><IconGear /></button>
      </header>
      <nav className="seg" aria-label="画面の切り替え">
        {([['list', 'リスト'], ['history', '履歴'], ['settings', '設定']] as const).map(([k, label]) => (
          <button key={k} type="button" className={`seg-btn${current === k ? ' on' : ''}`} aria-current={current === k ? 'page' : undefined} onClick={() => { if (current !== k) { tap(); ctx.go(k); } }}>
            {label}{k === 'list' && <span className="num">{n}</span>}
          </button>
        ))}
      </nav>
    </>
  );
}
