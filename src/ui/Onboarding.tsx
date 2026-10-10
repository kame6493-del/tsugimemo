import { useState } from 'react';
import { cleanText, MAX_TEXT } from '../domain/model';
import { isAndroid, tap } from '../platform/native';
import { IconBell, IconCheck, IconChevronLeft, IconChevronRight, IconHome, IconLock } from './Icons';
import { LockMock } from './LockMock';

/**
 * はじめての流れ(見本「はじめての流れ」): 1 まずは紹介 → 2 表示の許可 → 3 1行書いて表示場所を選ぶ → 4 すぐ使える
 * どこからでも飛ばせる。書いた1行はそのままリストのいちばん上に入る。
 */
export function Onboarding({ onDone }: { onDone: (r: { text: string; big: boolean; skipped: boolean }) => void }) {
  const [step, setStep] = useState(0);
  const [text, setText] = useState('');
  const [widget, setWidget] = useState(true);
  const [big, setBig] = useState(false);
  const first = cleanText(text);
  const next = () => { tap(); setStep((s) => s + 1); };
  const skip = () => { tap(); onDone({ text: '', big: false, skipped: true }); };

  const placeA = isAndroid
    ? { icon: <IconHome size={20} />, title: 'ホーム画面に置く', sub: 'ウィジェットを置くと、今やるべき1行がいつでも見える' }
    : { icon: <IconLock size={20} />, title: 'ロック画面に表示', sub: 'ウィジェットを置くと、今やるべき1行が目に入る' };
  const placeB = isAndroid
    ? { icon: <IconBell size={20} />, title: 'ロック画面のお知らせ', sub: '音なしのお知らせで、ロックしたまま完了できる' }
    : { icon: <IconBell size={20} />, title: 'ロック画面に大きく出す', sub: '紙の札にして大きく。ロックしたまま完了できる' };

  if (step === 0) {
    return (
      <div className="onb welcome">
        <img className="onb-sky" src="./img/sky.jpg" alt="" draggable={false} />
        <div className="onb-top"><span /><button type="button" className="btn text" onClick={skip}>とばす</button></div>
        <div className="welcome-body">
          <img className="welcome-logo" src="./img/logo_paper.png" alt="" draggable={false} />
          <h1>ツギメモ</h1>
          <p className="welcome-sub">見ないで忘れる、をなくす。</p>
          <ul className="checks">
            {[isAndroid ? 'ロック画面とホーム画面に表示' : 'ロック画面に表示', '1行で書ける', '登録なしで使える', '広告なしでずっと快適'].map((t) => (
              <li key={t}><span className="ck"><IconCheck size={14} /></span>{t}</li>
            ))}
          </ul>
        </div>
        <div className="onb-foot">
          <button type="button" className="btn primary wide big" onClick={next}><span>さっそくはじめる</span><IconChevronRight /></button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="onb">
        <Head onBack={() => setStep(0)} />
        <h2 className="onb-lead">メモを見逃さないために<br />次の設定をお願いします。</h2>
        <div className="onb-cards">
          <PlaceCard {...placeA} on={widget} onClick={() => { tap(); setWidget((v) => !v); }} />
          <PlaceCard {...placeB} title={`${placeB.title}(任意)`} on={big} onClick={() => { tap(); setBig((v) => !v); }} />
        </div>
        <p className="note center">あとから「設定」の「表示場所」でも変えられます。</p>
        <div className="onb-foot">
          <button type="button" className="btn primary wide big" onClick={next}><span>設定に進む</span><IconChevronRight /></button>
          <button type="button" className="btn text" onClick={() => { tap(); setWidget(false); setBig(false); setStep(2); }}>あとで設定する</button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    const len = Array.from(first).length;
    return (
      <div className="onb">
        <Head onBack={() => setStep(1)} />
        <ol className="stepper" aria-label="3つのうち1つめ">
          {['メモを書く', '表示場所', '完了'].map((t, i) => <li key={t} className={i === 0 ? 'on' : ''}><span className="num">{i + 1}</span>{t}</li>)}
        </ol>
        <h2 className="onb-h">最初のメモを書きましょう</h2>
        <p className="onb-p">今やるべきことを、1行で。あとからいつでも変更できます。</p>
        <input
          className="firstfield"
          value={text}
          maxLength={MAX_TEXT * 2}
          placeholder="例: 企画書の下書きを進める"
          aria-label="最初のメモ"
          enterKeyHint="done"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
        />
        <p className={`counter num${len >= MAX_TEXT ? ' full' : ''}`}>{len}/{MAX_TEXT}</p>
        <h2 className="onb-h">どこに表示しますか?</h2>
        <div className="onb-cards">
          <PlaceCard {...placeA} on={widget} onClick={() => { tap(); setWidget((v) => !v); }} small />
          <PlaceCard {...placeB} on={big} onClick={() => { tap(); setBig((v) => !v); }} small />
        </div>
        <div className="onb-foot">
          <button type="button" className="btn primary wide big" onClick={next}><span>これで始める</span><IconChevronRight /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="onb ready">
      <Head onBack={() => setStep(2)} />
      <h2 className="onb-h center">すぐ使えます</h2>
      <p className="onb-p center">{isAndroid ? 'ロック画面とホーム画面に、今やるべき1行が出ます。' : 'ロック画面に、今やるべき1行が出ます。'}丸を押すと完了して、次の1行が上がります。</p>
      <div className="onb-art"><LockMock items={[first || '企画書の下書きを進める', 'ジムに行く', '本を30分読む']} demo label="ロック画面の見本。丸を押すと次の行が上がる" /></div>
      {widget && (
        <p className="note center">
          {isAndroid ? 'ホーム画面の何もない所を長押し →「ウィジェット」→「ツギメモ」で置けます。' : 'ロック画面を長押し →「カスタマイズ」→ 時計の下の枠 →「ツギメモ」で置けます。'}
        </p>
      )}
      <div className="onb-foot">
        <button type="button" className="btn primary wide big" onClick={() => { tap(); onDone({ text: first, big, skipped: false }); }}><span>{first ? 'はじめる' : '書きはじめる'}</span><IconChevronRight /></button>
      </div>
    </div>
  );
}

function Head({ onBack }: { onBack: () => void }) {
  return (
    <div className="onb-head">
      <button type="button" className="iconbtn" aria-label="もどる" onClick={() => { tap(); onBack(); }}><IconChevronLeft /></button>
      <p>ツギメモ</p>
      <span className="iconbtn-space" />
    </div>
  );
}

function PlaceCard({ icon, title, sub, on, onClick, small }: { icon: React.ReactNode; title: string; sub: string; on: boolean; onClick: () => void; small?: boolean }) {
  return (
    <button type="button" className={`placecard${on ? ' on' : ''}${small ? ' small' : ''}`} aria-pressed={on} onClick={onClick}>
      <span className="pc-icon">{icon}</span>
      <span className="pc-main"><b>{title}</b><small>{sub}</small></span>
      <span className="pc-check">{on ? <IconCheck size={14} /> : null}</span>
    </button>
  );
}
