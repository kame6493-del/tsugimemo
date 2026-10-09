import { registerPlugin, WebPlugin } from '@capacitor/core';
import type { Snapshot, WidgetEvent } from '../domain/model';

/**
 * ネイティブのウィジェットとの橋。中身は
 * - iOS: ios/App/App/TsugiWidgetPlugin.swift(App Group group.jp.tsugimemo.app の UserDefaults に JSON を置き、WidgetKit を更新。big=true でライブアクティビティ)
 * - Android: android/app/src/main/java/jp/tsugimemo/app/TsugiWidgetPlugin.kt(SharedPreferences に置き、AppWidget を更新。big=true でロック画面のお知らせ)
 * ウィジェットで押された「済んだ」は events に貯まり、アプリが前に来た時に takeEvents で受け取る。
 */
export interface TsugiWidgetPlugin {
  setSnapshot(o: { json: string; big: boolean }): Promise<void>;
  takeEvents(): Promise<{ events: WidgetEvent[] }>;
  /** 大きく出す(iOS ライブアクティビティ / Android お知らせ)が使えるか・許されているか */
  bigStatus(): Promise<{ supported: boolean; allowed: boolean }>;
  /** 許可を聞く(Android 13 以降のお知らせの許可)。iOS は設定の状態を返すだけ */
  requestBig(): Promise<{ allowed: boolean }>;
}

/** ブラウザ(開発と E2E)用。localStorage をウィジェットの代わりにする */
class WebTsugiWidget extends WebPlugin implements TsugiWidgetPlugin {
  async setSnapshot(o: { json: string; big: boolean }) {
    try {
      localStorage.setItem('tsugimemo.web.snapshot', o.json);
      localStorage.setItem('tsugimemo.web.big', o.big ? '1' : '0');
    } catch { /* 無くても困らない */ }
  }
  async takeEvents() {
    try {
      const raw = localStorage.getItem('tsugimemo.web.events');
      localStorage.removeItem('tsugimemo.web.events');
      const events = raw ? (JSON.parse(raw) as WidgetEvent[]) : [];
      return { events: Array.isArray(events) ? events : [] };
    } catch {
      return { events: [] };
    }
  }
  async bigStatus() {
    return { supported: true, allowed: localStorage.getItem('tsugimemo.web.denyBig') !== '1' };
  }
  async requestBig() {
    return { allowed: localStorage.getItem('tsugimemo.web.denyBig') !== '1' };
  }
}

export const TsugiWidget = registerPlugin<TsugiWidgetPlugin>('TsugiWidget', { web: () => new WebTsugiWidget() });

export async function pushSnapshot(s: Snapshot, big: boolean) {
  try { await TsugiWidget.setSnapshot({ json: JSON.stringify(s), big }); } catch (e) { console.error('[tsugimemo] widget', e); }
}

export async function pullEvents(): Promise<WidgetEvent[]> {
  try {
    const { events } = await TsugiWidget.takeEvents();
    return (events ?? []).filter((e) => e && typeof e.id === 'string' && typeof e.at === 'number');
  } catch {
    return [];
  }
}
