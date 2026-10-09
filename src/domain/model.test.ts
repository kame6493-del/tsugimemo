import { describe, expect, it } from 'vitest';
import {
  addItems, addList, applyWidgetEvents, clampToFree, cleanText, clearDone, completeItem, dailyReset, dayKey, deleteItem,
  deletedItems, doneItems, editItem, emptyData, getList, MAX_LISTS, MAX_TEXT, moveItem, normalize, pending, purgeOld,
  removeList, reorderPending, restoreItem, setDaily, shouldAskReview, snapshotOf, splitLines, undoItem,
} from './model';

const T0 = new Date(2026, 9, 9, 12, 0, 0).getTime();
const H = 60 * 60 * 1000;
const D = 24 * H;
const texts = (d: ReturnType<typeof emptyData>, id = 'main') => pending(getList(d, id)).map((i) => i.text);

describe('文字の整え', () => {
  it('改行と空白をまとめ、60字で切る', () => {
    expect(cleanText('  牛乳\nを  買う ')).toBe('牛乳 を 買う');
    expect(Array.from(cleanText('あ'.repeat(80))).length).toBe(MAX_TEXT);
  });
  it('絵文字のような2つで1字の文字も途中で割らない', () => {
    const s = cleanText('😀'.repeat(70));
    expect(Array.from(s).length).toBe(MAX_TEXT);
    expect(s.endsWith('😀')).toBe(true);
  });
  it('貼り付けた複数行は行ごとに分け、空行は捨てる', () => {
    expect(splitLines('卵\n\n  パン \r\n牛乳')).toEqual(['卵', 'パン', '牛乳']);
  });
});

describe('行の出し入れ', () => {
  it('足した行は下へ、top=true なら先頭へ', () => {
    let d = addItems(emptyData(T0), 'main', '卵\nパン', T0);
    d = addItems(d, 'main', '急ぎの電話', T0 + 1, true);
    expect(texts(d)).toEqual(['急ぎの電話', '卵', 'パン']);
  });
  it('空の入力では何も変わらない', () => {
    const d = emptyData(T0);
    expect(addItems(d, 'main', '  \n ', T0)).toBe(d);
  });
  it('済ませると先頭から消え、次が上がる。済んだ数が増える', () => {
    let d = addItems(emptyData(T0), 'main', 'A\nB\nC', T0);
    const a = pending(getList(d, 'main'))[0];
    d = completeItem(d, 'main', a.id, T0 + 10);
    expect(texts(d)).toEqual(['B', 'C']);
    expect(doneItems(getList(d, 'main')).map((i) => i.text)).toEqual(['A']);
    expect(d.doneCount).toBe(1);
    // 同じ行をもう一度済ませても数えない
    expect(completeItem(d, 'main', a.id, T0 + 20).doneCount).toBe(1);
  });
  it('戻すと元の位置に戻る', () => {
    let d = addItems(emptyData(T0), 'main', 'A\nB\nC', T0);
    const b = pending(getList(d, 'main'))[1];
    d = completeItem(d, 'main', b.id, T0 + 1);
    d = undoItem(d, 'main', b.id, T0 + 2);
    expect(texts(d)).toEqual(['A', 'B', 'C']);
  });
  it('消した行は「消したもの」に残り、戻せる', () => {
    let d = addItems(emptyData(T0), 'main', 'A\nB', T0);
    const a = pending(getList(d, 'main'))[0];
    d = deleteItem(d, 'main', a.id, T0 + 1);
    expect(texts(d)).toEqual(['B']);
    expect(deletedItems(getList(d, 'main')).length).toBe(1);
    d = restoreItem(d, 'main', a.id, T0 + 2);
    expect(texts(d)).toEqual(['A', 'B']);
  });
  it('書き直し。空にはできない', () => {
    let d = addItems(emptyData(T0), 'main', 'A', T0);
    const a = pending(getList(d, 'main'))[0];
    d = editItem(d, 'main', a.id, 'A2', T0 + 1);
    expect(texts(d)).toEqual(['A2']);
    expect(editItem(d, 'main', a.id, '   ', T0 + 2)).toBe(d);
  });
  it('いちばん上へ・いちばん下へ・並べ替え', () => {
    let d = addItems(emptyData(T0), 'main', 'A\nB\nC', T0);
    const [a, b, c] = pending(getList(d, 'main'));
    d = moveItem(d, 'main', c.id, 'top');
    expect(texts(d)).toEqual(['C', 'A', 'B']);
    d = moveItem(d, 'main', c.id, 'bottom');
    expect(texts(d)).toEqual(['A', 'B', 'C']);
    d = reorderPending(d, 'main', [b.id, c.id, a.id]);
    expect(texts(d)).toEqual(['B', 'C', 'A']);
  });
  it('済んだ行をまとめて片づける', () => {
    let d = addItems(emptyData(T0), 'main', 'A\nB', T0);
    const a = pending(getList(d, 'main'))[0];
    d = completeItem(d, 'main', a.id, T0 + 1);
    d = clearDone(d, 'main', T0 + 2);
    expect(doneItems(getList(d, 'main')).length).toBe(0);
    expect(deletedItems(getList(d, 'main')).length).toBe(1);
  });
});

describe('7日で片づく', () => {
  it('7日より前に済んだ・消した行だけ捨てる', () => {
    let d = addItems(emptyData(T0), 'main', 'A\nB\nC', T0);
    const [a, b] = pending(getList(d, 'main'));
    d = completeItem(d, 'main', a.id, T0);
    d = deleteItem(d, 'main', b.id, T0 + 3 * D);
    const p = purgeOld(d, T0 + 7 * D + 1);
    expect(getList(p, 'main').items.map((i) => i.text)).toEqual(['B', 'C']);
    // 何も捨てない時は同じ物を返す
    expect(purgeOld(p, T0 + 7 * D + 2)).toBe(p);
  });
  it('毎朝もどすリストの済んだ行は捨てない', () => {
    let d = setDaily(addItems(emptyData(T0), 'main', 'A', T0), 'main', true);
    const a = pending(getList(d, 'main'))[0];
    d = completeItem(d, 'main', a.id, T0);
    expect(getList(purgeOld(d, T0 + 30 * D), 'main').items.length).toBe(1);
  });
});

describe('毎朝もどす', () => {
  it('4時区切りの日付', () => {
    expect(dayKey(new Date(2026, 9, 10, 3, 59).getTime(), 4)).toBe('2026-10-09');
    expect(dayKey(new Date(2026, 9, 10, 4, 0).getTime(), 4)).toBe('2026-10-10');
  });
  it('区切りをまたぐと daily のリストだけ済んだ印が外れる', () => {
    let d = addItems(emptyData(T0), 'main', '歯みがき\n水やり', T0);
    d = addList(d, '買い物', T0);
    const shop = d.lists[1].id;
    d = addItems(d, shop, '卵', T0);
    d = setDaily(d, 'main', true);
    const [x] = pending(getList(d, 'main'));
    const [egg] = pending(getList(d, shop));
    d = completeItem(d, 'main', x.id, T0 + H);
    d = completeItem(d, shop, egg.id, T0 + H);
    // 同じ日のうちは何もしない
    expect(dailyReset(d, T0 + 2 * H)).toBe(d);
    const next = dailyReset(d, new Date(2026, 9, 10, 4, 30).getTime());
    expect(texts(next)).toEqual(['歯みがき', '水やり']);
    expect(pending(getList(next, shop)).length).toBe(0);
    expect(next.lastResetDay).toBe('2026-10-10');
  });
});

describe('リスト', () => {
  it('最大8つまで。名前は12字まで', () => {
    let d = emptyData(T0);
    for (let i = 0; i < 12; i++) d = addList(d, `リスト${i}の長い長い名前です`, T0 + i);
    expect(d.lists.length).toBe(MAX_LISTS);
    expect(Array.from(d.lists[1].name).length).toBeLessThanOrEqual(12);
  });
  it('ロック画面に出しているリストを消すと、先頭のリストに戻る。最後の1つは消せない', () => {
    let d = addList(emptyData(T0), '仕事', T0);
    const work = d.lists[1].id;
    d = { ...d, lockListId: work };
    d = removeList(d, work);
    expect(d.lockListId).toBe('main');
    expect(removeList(d, 'main').lists.length).toBe(1);
  });
  it('無料に戻すと、紙は無料の色、出すリストは先頭へ。行は消さない', () => {
    let d = addList(emptyData(T0), '仕事', T0);
    d = addItems(d, d.lists[1].id, 'X', T0);
    d = { ...d, paper: 'ai', lockListId: d.lists[1].id };
    const f = clampToFree(d);
    expect(f.paper).toBe('kinari');
    expect(f.lockListId).toBe('main');
    expect(pending(f.lists[1]).length).toBe(1);
  });
});

describe('ウィジェット', () => {
  it('スナップショットは済んでいない行の先頭6行と残りの数', () => {
    let d = addItems(emptyData(T0), 'main', '1\n2\n3\n4\n5\n6\n7\n8', T0);
    const first = pending(getList(d, 'main'))[0];
    d = completeItem(d, 'main', first.id, T0 + 1);
    const s = snapshotOf(d, T0 + 2);
    expect(s.items.map((i) => i.text)).toEqual(['2', '3', '4', '5', '6', '7']);
    expect(s.left).toBe(7);
    expect(s.doneToday).toBe(1);
    expect(s.list).toBe('いま');
    expect(s.paper.dark).toBe(false);
  });
  it('ウィジェットで押された行を、押された順に済んだにする。知らない id は無視', () => {
    let d = addItems(emptyData(T0), 'main', 'A\nB\nC', T0);
    const [a, b] = pending(getList(d, 'main'));
    d = applyWidgetEvents(d, [{ id: b.id, at: T0 + 20 }, { id: 'nope', at: T0 + 5 }, { id: a.id, at: T0 + 10 }]);
    expect(texts(d)).toEqual(['C']);
    expect(doneItems(getList(d, 'main')).map((i) => i.text)).toEqual(['B', 'A']);
    expect(d.doneCount).toBe(2);
  });
  it('別のリストの行でも id で見つける', () => {
    let d = addList(emptyData(T0), '仕事', T0);
    const w = d.lists[1].id;
    d = addItems(d, w, '見積もり', T0);
    const it0 = pending(getList(d, w))[0];
    d = applyWidgetEvents(d, [{ id: it0.id, at: T0 + 1 }]);
    expect(pending(getList(d, w)).length).toBe(0);
  });
});

describe('保存した物を読む', () => {
  it('壊れた物・空でも落ちない', () => {
    expect(normalize(null).lists.length).toBe(1);
    expect(normalize('x').lists[0].name).toBe('いま');
    expect(normalize({ lists: [{ id: 5 }] }).lists.length).toBe(1);
  });
  it('書き出して読み直すと同じになる', () => {
    let d = addItems(emptyData(T0), 'main', 'A\nB', T0);
    d = completeItem(d, 'main', pending(getList(d, 'main'))[0].id, T0 + 1);
    d = { ...d, onboarded: true, paper: 'ai', resetHour: 6 };
    expect(normalize(JSON.parse(JSON.stringify(d)), T0)).toEqual(JSON.parse(JSON.stringify(d)));
  });
  it('おかしな値は直す', () => {
    const n = normalize({ lists: [{ id: 'a', name: '', items: [{ id: 'x', text: '  ' }, { id: 'y', text: 'ok', done: true }] }], lockListId: 'zzz', resetHour: 99, paper: 'gold' }, T0);
    expect(n.lists[0].name).toBe('いま');
    expect(n.lists[0].items.length).toBe(1);
    expect(n.lists[0].items[0].doneAt).toBe(T0);
    expect(n.lockListId).toBe('a');
    expect(n.resetHour).toBe(4);
    expect(n.paper).toBe('kinari');
  });
});

describe('評価のお願い', () => {
  it('10回済ませてから、1回だけ', () => {
    const d = emptyData(T0);
    expect(shouldAskReview({ ...d, doneCount: 9 })).toBe(false);
    expect(shouldAskReview({ ...d, doneCount: 10 })).toBe(true);
    expect(shouldAskReview({ ...d, doneCount: 30, reviewAsked: true })).toBe(false);
  });
});
