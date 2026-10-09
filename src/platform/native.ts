import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { InAppReview } from '@capacitor-community/in-app-review';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';

/** 触った時の小さな振動。済ませた時は少し強め */
export function tap(strong = false) {
  if (!isNative) return;
  Haptics.impact({ style: strong ? ImpactStyle.Medium : ImpactStyle.Light }).catch(() => {});
}

/** ストアの評価の画面(出すかどうかは OS が決める) */
export async function askReview() {
  if (!isNative) return;
  try { await InAppReview.requestReview(); } catch { /* 出なくても困らない */ }
}
