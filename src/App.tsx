import { useCallback, useEffect, useRef, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import {
  applyWidgetEvents, clampToFree, dailyReset, emptyData, purgeOld, shouldAskReview, snapshotOf, type AppData,
} from './domain/model';
import { loadData, saveData } from './platform/storage';
import { pullEvents, pushSnapshot } from './platform/widget';
import { buyPlus, loadBilling, restorePlus, type Billing } from './platform/billing';
import { askReview, isNative, tap } from './platform/native';
import { NowScreen } from './ui/NowScreen';
import { LockTab } from './ui/LockTab';
import { SettingsScreen } from './ui/SettingsScreen';
import { Onboarding } from './ui/Onboarding';
import { Paywall } from './ui/Paywall';
import { IconLock, IconNow, IconSettings } from './ui/Icons';
import type { Ctx, PaywallReason, Toast } from './ui/ctx';

type Tab = 'now' | 'lock' | 'settings';

export default function App() {
  const [data, setDataRaw] = useState<AppData | null>(null);
  const [billing, setBilling] = useState<Billing>({ status: 'unavailable', reason: '', plus: false });
  const [tab, setTab] = useState<Tab>('now');
  const [paywall, setPaywall] = useState<PaywallReason | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [focusInput, setFocusInput] = useState(0);
  /** 前に来るたびに増やす。中身が同じでもウィジェットとライブアクティビティを書き直すため */
  const [wake, setWake] = useState(0);
  const toastTimer = useRef<number | undefined>(undefined);
  const plus = billing.plus;

  const setData = useCallback((f: (d: AppData) => AppData) => {
    setDataRaw((d) => (d ? f(d) : d));
  }, []);

  /** 前に来た時: ウィジェットで押された分を取り込み、毎朝もどす・7日を過ぎた物を片づける */
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

  // 10回済ませたら1回だけ、評価のお願い(OS の物)
  useEffect(() => {
    if (data && shouldAskReview(data)) {
      setData((d) => ({ ...d, reviewAsked: true }));
      window.setTimeout(askReview, 1200);
    }
  }, [data, setData]);

  const showToast = useCallback((t: Toast) => {
    window.clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = window.setTimeout(() => setToast(null), t.undo ? 5000 : 2600);
  }, []);

  const ctx: Ctx = {
    data: data ?? emptyData(),
    setData,
    plus,
    billing,
    openPaywall: (r) => { tap(); setPaywall(r); },
    toast: showToast,
  };

  if (!data) return <div className="boot" aria-busy="true" />;

  if (!data.onboarded) {
    return (
      <Onboarding
        onDone={(write) => {
          setData((d) => ({ ...d, onboarded: true }));
          setTab('now');
          if (write) setFocusInput((n) => n + 1);
        }}
      />
    );
  }

  return (
    <div className="app">
      <main className="screen" key={tab}>
        {tab === 'now' && <NowScreen ctx={ctx} focusSignal={focusInput} />}
        {tab === 'lock' && <LockTab ctx={ctx} />}
        {tab === 'settings' && (
          <SettingsScreen
            ctx={ctx}
            onReplayIntro={() => setData((d) => ({ ...d, onboarded: false }))}
            onRestore={async () => {
              try {
                const ok = await restorePlus();
                if (ok) { setBilling((b) => ({ ...b, plus: true })); showToast({ text: 'ツギメモ+ を戻しました' }); }
                else showToast({ text: '戻せる購入は見つかりませんでした' });
              } catch {
                showToast({ text: 'ストアにつながりませんでした' });
              }
            }}
          />
        )}
      </main>

      <nav className="tabbar" aria-label="画面の切り替え">
        <TabButton active={tab === 'now'} onClick={() => setTab('now')} label="いま" icon={<IconNow />} />
        <TabButton active={tab === 'lock'} onClick={() => setTab('lock')} label="ロック画面" icon={<IconLock />} />
        <TabButton active={tab === 'settings'} onClick={() => setTab('settings')} label="設定" icon={<IconSettings />} />
      </nav>

      {toast && (
        <div className="toast" role="status">
          <span>{toast.text}</span>
          {toast.undo && (
            <button type="button" className="toast-undo" onClick={() => { toast.undo?.(); setToast(null); tap(); }}>戻す</button>
          )}
        </div>
      )}

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
                showToast({ text: 'ツギメモ+ が開きました' });
              }
            } catch {
              showToast({ text: '購入できませんでした。時間をおいてもう一度どうぞ' });
            }
          }}
          onRestore={async () => {
            try {
              const ok = await restorePlus();
              if (ok) { setBilling((b) => ({ ...b, plus: true })); setPaywall(null); showToast({ text: 'ツギメモ+ を戻しました' }); }
              else showToast({ text: '戻せる購入は見つかりませんでした' });
            } catch {
              showToast({ text: 'ストアにつながりませんでした' });
            }
          }}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button type="button" className={`tab${active ? ' on' : ''}`} aria-current={active ? 'page' : undefined} onClick={() => { if (!active) tap(); onClick(); }}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
