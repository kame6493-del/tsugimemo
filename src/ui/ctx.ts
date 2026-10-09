import type { AppData } from '../domain/model';
import type { Billing } from '../platform/billing';

export type PaywallReason = 'lists' | 'daily' | 'paper' | 'lockList' | 'settings';

export type Toast = { text: string; undo?: () => void };

export type Ctx = {
  data: AppData;
  setData: (f: (d: AppData) => AppData) => void;
  plus: boolean;
  billing: Billing;
  openPaywall: (r: PaywallReason) => void;
  toast: (t: Toast) => void;
};
