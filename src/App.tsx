import { useCallback, useEffect, useRef, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import {
  addItems, applyWidgetEvents, clampToFree, dailyReset, emptyData, PAPERS, purgeOld, shouldAskReview, snapshotOf, type AppData,
} from './domain/model';
import { loadData, saveData } from './platform/storage';
import { pullEvents, pushSnapshot, TsugiWidget } from './platform/widget';
import { buyPlus, loadBilling, restorePlus, type Billing } from './platform/billing';
import { askReview, isNative, tap } from './platform/native';
import { ListScreen } from './ui/ListScreen';
import { HistoryScreen } from './ui/HistoryScreen';
import { SettingsScreen } from './ui/SettingsScreen';
import { DisplayScreen } from './ui/DisplayScreen';
import { Onboarding } from './ui/Onboarding';
import { Paywall } from './ui/Paywall';
import { PaperSheet } from './ui/Sheets';
import { IconAlert, IconCheck, IconClose, IconInfo, IconOk } from './ui/Icons';
import type { Ctx, PaywallReason, Screen, Toast } from './ui/ctx';

export default function App() {
  const [data, setDataRaw] = useState<AppData | null>(null);
  const [billing, setBilling] = useState<Billing>({ status: 'unavailable', reason: '', plus: false });
  const [screen, setScreen] = useState<Screen>('list');
  const [paywall, setPaywall] = useState<PaywallReason | null>(null);
  const [papersOpen, setPapersOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [focusInput, setFocusInput] = useState(0);
  /** 前に来るたびに増やす。中身が同じでもウィジェットとライブアクティビティを書き直すため */
  const [wake, setWake] = useState(0);
  const toastTimer = useRef<number | undefined>(undefined);
  const plus = billing.plus;

  const setData = useCallback((f: (d: AppData) => AppData) => {
    setDataRaw((d) => (d ? f(d) : d));
  }, []);

  /** 前に来た時: ウィジェットで押された分を取り込み、毎朝戻す・7日を過ぎた物を片づける */
  const refresh = useCallback(async () => {
    const events = await pullEvents();
    const now = Date.now();
    setDataRaw((d) => (d ? purgeOld(dailyReset(applyWidgetEvents(d, events), now), now) : d));
    setWake((n) => n + 1);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const d = await loadData();
      const events = await pullEvents();
      const now = Date.now();
      if (alive) setDataRaw(purgeOld(dailyReset(applyWidgetEvents(d, events), now), now));
      const b = await loadBilling();
      if (alive) setBilling(b);
    })();
    const onVis = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVis);
    let remove: (() => void) | undefined;
    if (isNative) {
      CapApp.addListener('appStateChange', ({ isActive }) => { if (isActive) refresh(); }).then((h) => { remove = () => h.remove(); });
    }
    return () => { alive = false; document.removeEventListener('visibilitychange', onVis); remove?.(); };
  }, [refresh]);

  // 無料に戻った時(返金など)は、出すリストと紙の色を無料の範囲へ。行は消さない
  useEffect(() => {
    if (!plus && billing.status !== 'unavailable') setData((d) => clampToFree(d));
  }, [plus, billing.status, setData]);

  // 変わるたびに保存して、ウィジェットも書き直す
  useEffect(() => {
    if (!data) return;
    saveData(data);
  }, [data]);
  useEffect(() => {
    if (!data) return;
    pushSnapshot(snapshotOf(data, Date.now()), data.bigOnLock);
  }, [data, wake]);

  // 10回完了したら1回だけ、評価のお願い(OS の物)
  useEffect(() => {
    if (data && shouldAskReview(data)) {
      setData((d) => ({ ...d, reviewAsked: true }));
      window.setTimeout(askReview, 1200);
    }
  }, [data, setData]);

  // 紙の色: リストの地の色にする(ダークでは使わない。index.css)
  useEffect(() => {
    const p = PAPERS.find((x) => x.id === data?.paper) ?? PAPERS[0];
    document.documentElement.style.setProperty('--paper-pick', p.bg);
    document.documentElement.dataset.paper = p.id;
  }, [data?.paper]);

  const showToast = useCallback((t: Toast) => {
    window.clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = window.setTimeout(() => setToast(null), t.undo ? 5000 : 2600);
  }, []);

  const go = useCallback((s: Screen) => { setScreen(s); window.scrollTo(0, 0); }, []);

  const ctx: Ctx = {
    data: data ?? emptyData(),
    setData,
    plus,
    billing,
    openPaywall: (r) => { tap(); setPaywall(r); },
    toast: showToast,
    go,
    openPapers: () => setPapersOpen(true),
  };

  const restore = async (closePaywall: boolean) => {
    try {
      const ok = await restorePlus();
      if (ok) { setBilling((b) => ({ ...b, plus: true })); if (closePaywall) setPaywall(null); showToast({ text: 'ツギメモ+ を戻しました', kind: 'ok' }); }
      else showToast({ text: '戻せる購入は見つかりませんでした', kind: 'info' });
    } catch {
      showToast({ text: 'ストアにつながりませんでした', kind: 'err' });
    }
  };

  if (!data) return <div className="boot" aria-busy="true" />;

  if (!data.onboarded) {
    return (
      <Onboarding
        onDone={async ({ text, big, skipped }) => {
          setData((d) => {
            let n = { ...d, onboarded: true };
            if (text) n = addItems(n, n.lockListId, text, Date.now(), true);
            return n;
          });
          go('list');
          if (!text) setFocusInput((n) => n + 1);
          if (skipped) return;
          if (big) {
            const r = await TsugiWidget.requestBig().catch(() => ({ allowed: false }));
            setData((d) => ({ ...d, bigOnLock: r.allowed }));
            if (!r.allowed) showToast({ text: '許可されなかったので、ロック画面には出していません。「設定」の「表示場所」から出せます', kind: 'info' });
          }
        }}
      />
    );
  }

  return (
    <div className={`app screen-${screen}`}>
      <main className="screen" key={screen}>
        {screen === 'list' && <ListScreen ctx={ctx} focusSignal={focusInput} />}
        {screen === 'history' && <HistoryScreen ctx={ctx} />}
        {screen === 'display' && <DisplayScreen ctx={ctx} />}
        {screen === 'settings' && (
          <SettingsScreen
            ctx={ctx}
            onReplayIntro={() => setData((d) => ({ ...d, onboarded: false }))}
            onRestore={() => restore(false)}
          />
        )}
      </main>

      {toast && (
        <div className={`toast ${toast.kind ?? 'info'}`} role="status">
          <span className="toast-icon" aria-hidden="true">
            {toast.kind === 'ok' ? <IconOk /> : toast.kind === 'err' ? <IconAlert /> : toast.kind === 'dark' ? <span className="toast-ring"><IconCheck size={13} /></span> : <IconInfo />}
          </span>
          <span className="toast-text">{toast.text}</span>
          {toast.undo && (
            <button type="button" className="toast-undo" onClick={() => { toast.undo?.(); setToast(null); tap(); }}>戻す</button>
          )}
          <button type="button" className="toast-x" aria-label="閉じる" onClick={() => setToast(null)}><IconClose size={16} /></button>
        </div>
      )}

      {papersOpen && <PaperSheet ctx={ctx} onClose={() => setPapersOpen(false)} />}

      {paywall && (
        <Paywall
          reason={paywall}
          billing={billing}
          onClose={() => setPaywall(null)}
          onBuy={async () => {
            try {
              const ok = await buyPlus(billing);
              if (ok) {
                setBilling((b) => ({ ...b, plus: true }));
                setPaywall(null);
                tap(true);
                showToast({ text: 'ツギメモ+ が開きました', kind: 'ok' });
              }
            } catch {
              showToast({ text: '購入できませんでした。時間をおいてもう一度どうぞ', kind: 'err' });
            }
          }}
          onRestore={() => restore(true)}
        />
      )}
    </div>
  );
}
