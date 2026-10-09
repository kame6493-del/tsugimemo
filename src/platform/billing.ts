import { Capacitor } from '@capacitor/core';
import { Purchases, type CustomerInfo, type PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { APP_CONFIG } from '../config';

/**
 * ツギメモ+ は買い切り1つ(非消耗型 tsugimemo_plus → entitlement "plus")。
 * RevenueCat の公開キーが空なら「購入は準備中です」で止まり、課金は走らない。
 * ブラウザの開発中と E2E(?mockbuy=1)だけ、画面確認用の疑似購入を使う。
 */
export type Billing =
  | { status: 'unavailable'; reason: string; plus: boolean }
  | { status: 'ready'; plus: boolean; price: string; pkg?: PurchasesPackage };

const platform = Capacitor.getPlatform();
const key = platform === 'ios' ? APP_CONFIG.revenuecat.ios : platform === 'android' ? APP_CONFIG.revenuecat.android : '';
const mock = !Capacitor.isNativePlatform() && (import.meta.env.DEV || new URLSearchParams(location.search).has('mockbuy'));
const MOCK_KEY = 'tsugimemo.mockPlus';

const plusOf = (info: CustomerInfo) => !!info.entitlements.active[APP_CONFIG.entitlement];

let configured = false;
async function ensure() {
  if (configured) return;
  await Purchases.configure({ apiKey: key });
  configured = true;
}

export async function loadBilling(): Promise<Billing> {
  if (mock) return { status: 'ready', plus: localStorage.getItem(MOCK_KEY) === '1', price: APP_CONFIG.fallbackPrice };
  if (!key) return { status: 'unavailable', reason: '購入は準備中です。もう少しお待ちを。', plus: false };
  try {
    await ensure();
    const [{ customerInfo }, offerings] = await Promise.all([Purchases.getCustomerInfo(), Purchases.getOfferings()]);
    const pkg = offerings.current?.availablePackages.find((p) => p.product.identifier === APP_CONFIG.productId) ?? offerings.current?.availablePackages[0];
    return { status: 'ready', plus: plusOf(customerInfo), price: pkg?.product.priceString ?? APP_CONFIG.fallbackPrice, pkg };
  } catch (e) {
    console.error('[tsugimemo] billing', e);
    return { status: 'unavailable', reason: 'ストアにつながりませんでした。電波のある所で、もう一度開いてみて。', plus: false };
  }
}

/** true=開いた / false=やめた。失敗は例外 */
export async function buyPlus(b: Billing): Promise<boolean> {
  if (mock) { localStorage.setItem(MOCK_KEY, '1'); return true; }
  if (b.status !== 'ready' || !b.pkg) throw new Error('今は買えません');
  await ensure();
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: b.pkg });
    return plusOf(customerInfo);
  } catch (e) {
    if ((e as { userCancelled?: boolean })?.userCancelled) return false;
    throw e;
  }
}

/** 復元。開いたら true */
export async function restorePlus(): Promise<boolean> {
  if (mock) return localStorage.getItem(MOCK_KEY) === '1';
  if (!key) return false;
  await ensure();
  const { customerInfo } = await Purchases.restorePurchases();
  return plusOf(customerInfo);
}
