import { Preferences } from '@capacitor/preferences';
import { emptyData, normalize, type AppData } from '../domain/model';

/**
 * 端末の中だけに保存する(アカウントもサーバーも無し)。
 * Preferences はネイティブでは UserDefaults / SharedPreferences。上書きの前に1つ前を控えに残す。
 */
const KEY = 'tsugimemo.data.v1';
const BACKUP = `${KEY}.prev`;

export async function loadData(): Promise<AppData> {
  try {
    const { value } = await Preferences.get({ key: KEY });
    if (!value) return emptyData();
    return normalize(JSON.parse(value));
  } catch {
    try {
      const prev = await Preferences.get({ key: BACKUP });
      return prev.value ? normalize(JSON.parse(prev.value)) : emptyData();
    } catch {
      return emptyData();
    }
  }
}

let chain: Promise<void> = Promise.resolve();

export function saveData(d: AppData): Promise<void> {
  const json = JSON.stringify(d);
  chain = chain
    .then(async () => {
      const cur = await Preferences.get({ key: KEY });
      if (cur.value && cur.value !== json) await Preferences.set({ key: BACKUP, value: cur.value });
      await Preferences.set({ key: KEY, value: json });
    })
    .catch((e) => console.error('[tsugimemo] save failed', e));
  return chain;
}

export async function clearAll(): Promise<void> {
  await Preferences.remove({ key: KEY });
  await Preferences.remove({ key: BACKUP });
}
