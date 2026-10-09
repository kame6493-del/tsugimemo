import { useEffect, useState } from 'react';
import { tap } from '../platform/native';
import { LockMock } from './LockMock';

/** 最初の説明は3枚まで。いつでも飛ばせる。最後の1枚から、そのまま書きはじめる */
export function Onboarding({ onDone }: { onDone: (write: boolean) => void }) {
  const [step, setStep] = useState(0);
  const [pressed, setPressed] = useState(false);

  // 2枚目は「丸を押す → 次が上がる」をくり返して見せる
  useEffect(() => {
    if (step !== 1) return;
    setPressed(false);
    const id = window.setInterval(() => setPressed((p) => !p), 1400);
    return () => window.clearInterval(id);
  }, [step]);

  const pages = [
    {
      title: 'メモしたのに\n見ない、をなくす。',
      body: '書いた1行が、ロック画面のいちばん上に出ます。スマホを手に取るたび、目に入ります。',
      art: <LockMock items={['牛乳を買って帰る', '歯医者に電話', '図書館の本を返す']} left={3} label="ロック画面の見本。いちばん上に「牛乳を買って帰る」" />,
    },
    {
      title: '済んだら、\n丸を押すだけ。',
      body: 'ロックしたまま押せます。済んだ行は消えて、次の行が上がってきます。',
      art: pressed
        ? <LockMock items={['歯医者に電話', '図書館の本を返す']} left={2} label="押した後。いちばん上が「歯医者に電話」に変わった見本" />
        : <LockMock items={['牛乳を買って帰る', '歯医者に電話', '図書館の本を返す']} left={3} pressed={false} label="押す前の見本" />,
    },
    {
      title: 'まず1行、\n書いてみましょう。',
      body: '買い物、電話、持ち物。思いついた順で大丈夫です。登録もいりません。',
      art: null,
    },
  ];
  const p = pages[step];
  const last = step === pages.length - 1;

  return (
    <div className="onb" aria-live="polite">
      <div className="onb-top">
        <span className="onb-count num" aria-label={`${pages.length}枚中${step + 1}枚目`}>{step + 1} / {pages.length}</span>
        {!last && <button type="button" className="btn text" onClick={() => { tap(); onDone(false); }}>とばす</button>}
      </div>
      <div className="onb-art">{p.art ?? <WriteArt />}</div>
      <div className="onb-text">
        <h1>{p.title}</h1>
        <p>{p.body}</p>
      </div>
      <div className="onb-foot">
        <div className="dots" aria-hidden="true">
          {pages.map((_, i) => <span key={i} className={i === step ? 'on' : ''} />)}
        </div>
        <button type="button" className="btn primary wide" onClick={() => { tap(); if (last) onDone(true); else setStep(step + 1); }}>
          {last ? '書きはじめる' : 'つぎへ'}
        </button>
      </div>
    </div>
  );
}

/** 3枚目の絵: 罫線の紙に1行目だけ朱の丸 */
function WriteArt() {
  return (
    <div className="writeart" aria-hidden="true">
      <div className="wa-line first"><span className="wa-ring" /><span className="wa-caret" /></div>
      <div className="wa-line" />
      <div className="wa-line" />
      <div className="wa-line" />
    </div>
  );
}
