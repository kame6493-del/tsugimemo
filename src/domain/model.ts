/**
 * ツギメモのデータと計算。画面にも端末にも触らない純粋な関数だけを置く(vitest で確かめる所)。
 *
 * 決まり
 * - 行の並びは list.items の並び。済んでいない行の先頭が「いまの1行」= ロック画面のいちばん上。
 * - 済んだ行は消さずに done にする。ロック画面からは消え、アプリの「済んだ」に7日残る。
 * - 消した行も deletedAt を付けて7日残す(白紙で上書きされて戻せない、をなくすため)。
 */

export const MAX_TEXT = 60;
export const KEEP_DAYS = 7;
export const MAX_LISTS = 8;
const DAY = 24 * 60 * 60 * 1000;

export type Item = {
  id: string;
  text: string;
  done: boolean;
  doneAt?: number;
  deletedAt?: number;
  createdAt: number;
  editedAt: number;
};

export type List = {
  id: string;
  name: string;
  items: Item[];
  /** 毎朝もどす(ツギメモ+) */
  daily: boolean;
};

export type PaperId = 'kinari' | 'sumi' | 'shiro' | 'sakura' | 'wakatake' | 'ai';

export type AppData = {
  v: 1;
  lists: List[];
  /** ロック画面に出すリスト */
  lockListId: string;
  /** 毎朝もどす時刻(0〜23時) */
  resetHour: number;
  /** 最後に毎朝もどすを行った日(resetHour 区切りの日付) */
  lastResetDay: string;
  paper: PaperId;
  onboarded: boolean;
  /** iOS: ライブアクティビティ / Android: ロック画面のお知らせ */
  bigOnLock: boolean;
  /** 済ませた合計(評価のお願いを出す時期に使う) */
  doneCount: number;
  reviewAsked: boolean;
};

export const FREE_PAPERS: PaperId[] = ['kinari', 'sumi'];

export const PAPERS: { id: PaperId; name: string; bg: string; ink: string; mark: string }[] = [
  { id: 'kinari', name: '生成り', bg: '#F4EFE4', ink: '#22201C', mark: '#C8402A' },
  { id: 'sumi', name: '墨', bg: '#1E1D1B', ink: '#EFEAE0', mark: '#E8664E' },
  { id: 'shiro', name: '白', bg: '#FFFFFF', ink: '#1A1A1A', mark: '#C8402A' },
  { id: 'sakura', name: '桜鼠', bg: '#EBDCD9', ink: '#3A2B2A', mark: '#B2402F' },
  { id: 'wakatake', name: '若竹', bg: '#DCE6D6', ink: '#1F2C22', mark: '#2F6B45' },
  { id: 'ai', name: '藍', bg: '#22324A', ink: '#E9EEF5', mark: '#F0A35B' },
];

let seq = 0;
export function newId(now: number): string {
  seq = (seq + 1) % 1296;
  return now.toString(36) + seq.toString(36).padStart(2, '0') + Math.floor(Math.random() * 1296).toString(36).padStart(2, '0');
}

export function emptyData(now = Date.now()): AppData {
  const id = 'main';
  return {
    v: 1,
    lists: [{ id, name: 'いま', items: [], daily: false }],
    lockListId: id,
    resetHour: 4,
    lastResetDay: dayKey(now, 4),
    paper: 'kinari',
    onboarded: false,
    bigOnLock: false,
    doneCount: 0,
    reviewAsked: false,
  };
}

/** 文字の整え: 改行・前後の空白を取り、60字で切る */
export function cleanText(s: string): string {
  return Array.from(s.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, MAX_TEXT).join('');
}

/** 1回の入力に複数行を貼り付けたら、行ごとに分ける(空行は捨てる) */
export function splitLines(s: string): string[] {
  return s.split(/\r?\n/).map(cleanText).filter(Boolean);
}

/** 区切り時刻 resetHour で日付を数える。4時区切りなら 3:59 は前の日 */
export function dayKey(t: number, resetHour: number): string {
  const d = new Date(t - resetHour * 60 * 60 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const alive = (i: Item) => !i.deletedAt;
export const pending = (l: List) => l.items.filter((i) => alive(i) && !i.done);
export const doneItems = (l: List) => l.items.filter((i) => alive(i) && i.done).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
export const deletedItems = (l: List) => l.items.filter((i) => !!i.deletedAt).sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0));

export function getList(d: AppData, id: string): List {
  return d.lists.find((l) => l.id === id) ?? d.lists[0];
}

function mapList(d: AppData, listId: string, f: (l: List) => List): AppData {
  return { ...d, lists: d.lists.map((l) => (l.id === listId ? f(l) : l)) };
}

function mapItem(d: AppData, listId: string, itemId: string, f: (i: Item) => Item): AppData {
  return mapList(d, listId, (l) => ({ ...l, items: l.items.map((i) => (i.id === itemId ? f(i) : i)) }));
}

/** 行を足す。top=true なら「いまの1行」として先頭へ */
export function addItems(d: AppData, listId: string, input: string, now: number, top = false): AppData {
  const texts = splitLines(input);
  if (!texts.length) return d;
  const added: Item[] = texts.map((text) => ({ id: newId(now), text, done: false, createdAt: now, editedAt: now }));
  return mapList(d, listId, (l) => ({ ...l, items: top ? [...added, ...l.items] : [...l.items, ...added] }));
}

export function editItem(d: AppData, listId: string, itemId: string, text: string, now: number): AppData {
  const t = cleanText(text);
  if (!t) return d;
  return mapItem(d, listId, itemId, (i) => ({ ...i, text: t, editedAt: now }));
}

export function completeItem(d: AppData, listId: string, itemId: string, now: number): AppData {
  const l = getList(d, listId);
  const it = l.items.find((i) => i.id === itemId);
  if (!it || it.done || it.deletedAt) return d;
  const next = mapItem(d, listId, itemId, (i) => ({ ...i, done: true, doneAt: now, editedAt: now }));
  return { ...next, doneCount: d.doneCount + 1 };
}

export function undoItem(d: AppData, listId: string, itemId: string, now: number): AppData {
  return mapItem(d, listId, itemId, (i) => ({ ...i, done: false, doneAt: undefined, editedAt: now }));
}

export function deleteItem(d: AppData, listId: string, itemId: string, now: number): AppData {
  return mapItem(d, listId, itemId, (i) => ({ ...i, deletedAt: now, editedAt: now }));
}

export function restoreItem(d: AppData, listId: string, itemId: string, now: number): AppData {
  return mapItem(d, listId, itemId, (i) => ({ ...i, deletedAt: undefined, done: false, doneAt: undefined, editedAt: now }));
}

/** 済んでいない行の中で場所を変える。to='top' は先頭、'bottom' は済んでいない行の最後 */
export function moveItem(d: AppData, listId: string, itemId: string, to: 'top' | 'bottom'): AppData {
  return mapList(d, listId, (l) => {
    const it = l.items.find((i) => i.id === itemId);
    if (!it) return l;
    const rest = l.items.filter((i) => i.id !== itemId);
    return { ...l, items: to === 'top' ? [it, ...rest] : [...rest, it] };
  });
}

/** 済んでいない行を並べ替える(ドラッグの結果)。order は済んでいない行の id を新しい順に並べたもの */
export function reorderPending(d: AppData, listId: string, order: string[]): AppData {
  return mapList(d, listId, (l) => {
    const byId = new Map(l.items.map((i) => [i.id, i]));
    const pend = order.map((id) => byId.get(id)).filter((i): i is Item => !!i && !i.done && !i.deletedAt);
    const used = new Set(pend.map((i) => i.id));
    const others = l.items.filter((i) => !used.has(i.id));
    return { ...l, items: [...pend, ...others] };
  });
}

/** 済んだ行をまとめて片づける(削除扱いで7日残す) */
export function clearDone(d: AppData, listId: string, now: number): AppData {
  return mapList(d, listId, (l) => ({ ...l, items: l.items.map((i) => (i.done && !i.deletedAt ? { ...i, deletedAt: now } : i)) }));
}

/** 7日より前に済んだ行・消した行を本当に捨てる。毎朝もどすリストの済んだ行は捨てない(戻すため) */
export function purgeOld(d: AppData, now: number): AppData {
  const limit = now - KEEP_DAYS * DAY;
  let changed = false;
  const lists = d.lists.map((l) => {
    const items = l.items.filter((i) => {
      const gone = (i.deletedAt && i.deletedAt < limit) || (!l.daily && i.done && (i.doneAt ?? 0) < limit);
      if (gone) changed = true;
      return !gone;
    });
    return items.length === l.items.length ? l : { ...l, items };
  });
  return changed ? { ...d, lists } : d;
}

/** 毎朝もどす。区切り時刻をまたいでいたら、daily のリストの済んだ印を外す */
export function dailyReset(d: AppData, now: number): AppData {
  const today = dayKey(now, d.resetHour);
  if (today === d.lastResetDay) return d;
  const lists = d.lists.map((l) => (l.daily ? { ...l, items: l.items.map((i) => (i.done && !i.deletedAt ? { ...i, done: false, doneAt: undefined } : i)) } : l));
  return { ...d, lists, lastResetDay: today };
}

// ---------- リスト(ツギメモ+) ----------

export function addList(d: AppData, name: string, now: number, id = newId(now)): AppData {
  const n = cleanText(name).slice(0, 12);
  if (!n || d.lists.length >= MAX_LISTS) return d;
  return { ...d, lists: [...d.lists, { id, name: n, items: [], daily: false }] };
}

export function renameList(d: AppData, listId: string, name: string): AppData {
  const n = cleanText(name).slice(0, 12);
  if (!n) return d;
  return mapList(d, listId, (l) => ({ ...l, name: n }));
}

export function removeList(d: AppData, listId: string): AppData {
  if (d.lists.length <= 1) return d;
  const lists = d.lists.filter((l) => l.id !== listId);
  return { ...d, lists, lockListId: d.lockListId === listId ? lists[0].id : d.lockListId };
}

export function setDaily(d: AppData, listId: string, daily: boolean): AppData {
  return mapList(d, listId, (l) => ({ ...l, daily }));
}

/** 課金が切れた・無い時に使える範囲へ戻す(データは消さない。出すリストと紙だけ無料の物へ) */
export function clampToFree(d: AppData): AppData {
  const paper = FREE_PAPERS.includes(d.paper) ? d.paper : 'kinari';
  const lockListId = d.lists[0].id;
  if (paper === d.paper && lockListId === d.lockListId) return d;
  return { ...d, paper, lockListId };
}

// ---------- ウィジェットとのやりとり ----------

/** ウィジェット・ライブアクティビティ・Android のお知らせに渡す物。App Group / SharedPreferences に JSON で置く */
export type Snapshot = {
  v: 1;
  list: string;
  /** 済んでいない行。先頭が「いま」。最大6行 */
  items: { id: string; text: string }[];
  left: number;
  doneToday: number;
  paper: { bg: string; ink: string; mark: string; dark: boolean };
  updatedAt: number;
};

export function snapshotOf(d: AppData, now: number): Snapshot {
  const l = getList(d, d.lockListId);
  const pend = pending(l);
  const today = dayKey(now, d.resetHour);
  const doneToday = l.items.filter((i) => alive(i) && i.done && i.doneAt && dayKey(i.doneAt, d.resetHour) === today).length;
  const p = PAPERS.find((x) => x.id === d.paper) ?? PAPERS[0];
  return {
    v: 1,
    list: l.name,
    items: pend.slice(0, 6).map((i) => ({ id: i.id, text: i.text })),
    left: pend.length,
    doneToday,
    paper: { bg: p.bg, ink: p.ink, mark: p.mark, dark: p.id === 'sumi' || p.id === 'ai' },
    updatedAt: now,
  };
}

/** ウィジェットやお知らせで押された「済んだ」。ネイティブ側が貯めておき、アプリが開いた時に受け取る */
export type WidgetEvent = { id: string; at: number };

/** 押された行を済んだにする。どのリストの行でも id で探す。既に済んだ・消した行は何もしない */
export function applyWidgetEvents(d: AppData, events: WidgetEvent[]): AppData {
  let out = d;
  for (const e of [...events].sort((a, b) => a.at - b.at)) {
    const l = out.lists.find((x) => x.items.some((i) => i.id === e.id));
    if (l) out = completeItem(out, l.id, e.id, e.at);
  }
  return out;
}

// ---------- 保存した物を読む ----------

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;

function normItem(x: unknown, now: number): Item | null {
  if (!isObj(x) || typeof x.id !== 'string' || typeof x.text !== 'string') return null;
  const text = cleanText(x.text);
  if (!text) return null;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
  return {
    id: x.id,
    text,
    done: x.done === true,
    doneAt: x.done === true ? num(x.doneAt) ?? now : undefined,
    deletedAt: num(x.deletedAt),
    createdAt: num(x.createdAt) ?? now,
    editedAt: num(x.editedAt) ?? now,
  };
}

/** 壊れた・古い保存物でも落ちずに読めるようにする */
export function normalize(raw: unknown, now = Date.now()): AppData {
  const base = emptyData(now);
  if (!isObj(raw)) return base;
  const lists: List[] = Array.isArray(raw.lists)
    ? raw.lists.flatMap((l): List[] => {
        if (!isObj(l) || typeof l.id !== 'string') return [];
        const items = Array.isArray(l.items) ? l.items.map((i) => normItem(i, now)).filter((i): i is Item => !!i) : [];
        const name = typeof l.name === 'string' && cleanText(l.name) ? cleanText(l.name).slice(0, 12) : 'いま';
        return [{ id: l.id, name, items, daily: l.daily === true }];
      }).slice(0, MAX_LISTS)
    : [];
  if (!lists.length) lists.push(base.lists[0]);
  const lockListId = typeof raw.lockListId === 'string' && lists.some((l) => l.id === raw.lockListId) ? raw.lockListId : lists[0].id;
  const resetHour = typeof raw.resetHour === 'number' && raw.resetHour >= 0 && raw.resetHour <= 23 ? Math.floor(raw.resetHour) : 4;
  const paper = PAPERS.some((p) => p.id === raw.paper) ? (raw.paper as PaperId) : 'kinari';
  return {
    v: 1,
    lists,
    lockListId,
    resetHour,
    lastResetDay: typeof raw.lastResetDay === 'string' ? raw.lastResetDay : base.lastResetDay,
    paper,
    onboarded: raw.onboarded === true,
    bigOnLock: raw.bigOnLock === true,
    doneCount: typeof raw.doneCount === 'number' && raw.doneCount >= 0 ? Math.floor(raw.doneCount) : 0,
    reviewAsked: raw.reviewAsked === true,
  };
}

/** 評価のお願いを出してよいか。済ませた数が10を超え、まだ聞いていない時だけ(1回きり) */
export const shouldAskReview = (d: AppData) => !d.reviewAsked && d.doneCount >= 10;
