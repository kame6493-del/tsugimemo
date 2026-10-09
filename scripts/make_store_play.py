"""Google Play の画面写真を作る(Android 版で実際に出る物だけ)。python scripts/make_store_play.py [URL]
dist を vite preview で出しておく(npx vite preview --port 5207)。
- store/mock/android.html … ロック画面のお知らせ(#lock・#done)とホーム画面のウィジェット(#home)
- アプリの画面は ?platform=android で Android 向けの文と見本にして撮る
iPhone のロック画面ウィジェット・9:41・「カスタマイズ」は使わない。値段・「無料」は入れない。
iPhone 用は scripts/make_store.py(こちらは触らない)。
"""
import json
import os
import sys
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_store import BOLD, MED, INK, INK2, PAPER, RULE, STORE, compose, rounded, seed  # noqa: E402

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5207/"
RAW = os.path.join(STORE, "raw", "play")
PLAY = os.path.join(STORE, "play")
os.makedirs(RAW, exist_ok=True)


def shoot():
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": 430, "height": 932}, device_scale_factor=3, locale="ja-JP", color_scheme="light")
        page = ctx.new_page()

        mock = "file:///" + os.path.join(STORE, "mock", "android.html").replace("\\", "/")
        for h, name in (("#lock", "1_notif.png"), ("#done", "2_done.png"), ("#home", "3_home.png")):
            page.goto("about:blank")
            page.goto(mock + h)
            page.wait_for_timeout(300)
            page.screenshot(path=os.path.join(RAW, name))

        q = "?mockbuy=1&theme=light&platform=android"
        page.goto(URL + q)
        page.evaluate("(d) => { localStorage.clear(); localStorage.setItem('CapacitorStorage.tsugimemo.data.v1', d); localStorage.setItem('tsugimemo.mockPlus', '1'); }", json.dumps(seed(), ensure_ascii=False))
        page.goto(URL + q)
        page.wait_for_selector(".toptext")

        page.click(".tabbar >> text=ロック画面")
        page.wait_for_selector(".locktab .lm-notif")
        page.wait_for_timeout(400)
        page.screenshot(path=os.path.join(RAW, "4_locktab.png"))

        page.click(".tabbar >> text=いま")
        page.click(".listname")
        page.wait_for_selector(".sheet")
        page.wait_for_timeout(400)
        page.screenshot(path=os.path.join(RAW, "5_lists.png"))

        # 写真に iPhone だけの物が入っていないか、文で確かめる
        txt = page.evaluate("document.body.innerText")
        for w in ("iPhone", "カスタマイズ", "ライブアクティビティ", "9:41"):
            assert w not in txt, w
        b.close()


SHOTS = [
    ("1_notif.png", "ロック画面のお知らせに", "メモしたのに\n見ない、をなくす。"),
    ("2_done.png", "お知らせの「済んだ」を", "押すと消えて、\n次が上がってくる。"),
    ("3_home.png", "ホーム画面に小と中", "紙の色を選んで\n壁紙になじませる。"),
    ("4_locktab.png", "置き方は3つの手順", "長押しして\nウィジェットを置く。"),
    ("5_lists.png", "リストを分けて", "買い物・仕事・\n朝の支度。"),
]


def feature():
    W, Hh = 1024, 500
    c = Image.new("RGB", (W, Hh), PAPER)
    d = ImageDraw.Draw(c)
    icon = Image.open(os.path.join(STORE, "icon_1024.png")).resize((120, 120), Image.LANCZOS)
    c.paste(icon, (64, 70))
    d.text((64, 222), "ツギメモ", font=ImageFont.truetype(BOLD, 64), fill=INK)
    d.multiline_text((66, 316), "済んだら消えて、\n次がロック画面に上がってくる。", font=ImageFont.truetype(MED, 28), fill=INK2, spacing=12)
    lock = Image.open(os.path.join(RAW, "1_notif.png")).convert("RGB")
    lock = lock.resize((430, 932), Image.LANCZOS).crop((0, 40, 430, 540))
    lock = rounded(lock, 36, RULE)
    c.paste(lock, (560, 40), lock)
    c.save(os.path.join(PLAY, "feature_1024x500.png"))


if __name__ == "__main__":
    shoot()
    for i, (raw, eb, hd) in enumerate(SHOTS, 1):
        compose(os.path.join("play", raw), eb, hd, 1080, 1920, 110, 40, 76, 780, 470, os.path.join(PLAY, f"play_{i}.png"))
    feature()
    print("ok")
