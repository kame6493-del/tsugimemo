import type { AppData } from '../domain/model';
import type { Billing } from '../platform/billing';

export type PaywallReason = 'lists' | 'daily' | 'paper' | 'lockList' | 'settings';

/** 見本のトースト: 保存(緑の丸)・失敗(赤の!)・お知らせ(灰の i)・元に戻した(黒地) */
export type Toast = { text: string; kind?: 'ok' | 'err' | 'info' | 'dark'; undo?: () => void };

export type Screen = 'list' | 'history' | 'settings' | 'display';

export type Ctx = {
  data: AppData;
  setData: (f: (d: AppData) => AppData) => void;
  plus: boolean;
  billing: Billing;
  openPaywall: (r: PaywallReason) => void;
  toast: (t: Toast) => void;
  go: (s: Screen) => void;
  openPapers: () => void;
};
