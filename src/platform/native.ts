import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { InAppReview } from '@capacitor-community/in-app-review';

export const isNative = Capacitor.isNativePlatform();
/** ブラウザで見る時だけ ?platform=android / ios でその端末向けの文と見本に切り替えられる(E2E とストアの画面写真用) */
const forced = !Capacitor.isNativePlatform() && typeof location !== 'undefined'
  ? new URLSearchParams(location.search).get('platform')
  : null;
export const platform = (forced === 'android' || forced === 'ios' ? forced : Capacitor.getPlatform()) as 'ios' | 'android' | 'web';
export const isAndroid = platform === 'android';

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
