/** 課金と問い合わせの設定。キーは空のまま出荷し、空なら「購入は準備中です」と出す */
export const APP_CONFIG = {
  revenuecat: { ios: '', android: '' },
  productId: 'tsugimemo_plus',
  entitlement: 'plus',
  /** ストアに値段が来る前に出す仮の値段(ストアが返した値段があればそちらを出す) */
  fallbackPrice: '600円',
  /** サポートページ(不具合・要望の窓口)。公開は残りの作業。RELEASE.md 参照 */
  supportUrl: 'https://kame6493-del.github.io/tsugimemo/',
  privacyUrl: 'https://kame6493-del.github.io/tsugimemo/privacy.html',
  version: '1.1.0',
};
