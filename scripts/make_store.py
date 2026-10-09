"""ストアの画面写真を作る。python scripts/make_store.py [URL]
dist を vite preview で出しておく(npx vite preview --port 5207)。
1) 中身を入れたアプリの画面と、store/mock/lock.html(ロック画面・ホーム画面の見本)を 430x932 の3倍で撮る(store/raw/)
2) 見出しを付けて組む: iPhone 1290x2796(store/iphone/)・Play 1080x1920(store/play/)・フィーチャー 1024x500
値段・「無料」は入れない。
"""
import json
import os
import sys
import time
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5207/"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORE = os.path.join(ROOT, "store")
RAW = os.path.join(STORE, "raw")
for d in ("raw", "iphone", "play"):
    os.makedirs(os.path.join(STORE, d), exist_ok=True)

PAPER = (245, 241, 232)
INK = (31, 29, 26)
INK2 = (93, 88, 80)
SHU = (196, 63, 40)
RULE = (222, 215, 200)
BOLD = "C:/Windows/Fonts/YuGothB.ttc"
MED = "C:/Windows/Fonts/YuGothM.ttc"

H = 3600 * 1000


def item(i, text, now, done=False):
    d = {"id": f"s{i}", "text": text, "done": done, "createdAt": now - 9 * H + i, "editedAt": now - 9 * H + i}
    if done:
        d["doneAt"] = now - H * (i % 3 + 1)
    return d


def seed():
    now = int(time.time() * 1000)
    main = [item(1, "牛乳を買って帰る", now), item(2, "歯医者に電話する", now), item(3, "図書館の本を返す", now),
            item(4, "クリーニングを受け取る", now), item(5, "母の誕生日のカードを書く", now),
            item(6, "10時に会議の資料を送る", now, True), item(7, "傘を持って出る", now, True)]
    shop = [item(11, "卵とバターを買う", now), item(12, "食器用の洗剤", now), item(13, "トイレットペーパー", now)]
    work = [item(21, "見積もりを送る", now), item(22, "会議室を取る", now), item(23, "経費の精算", now)]
    morning = [item(31, "植木に水をやる", now), item(32, "ゴミを出す", now)]
    return {
        "v": 1,
        "lists": [
            {"id": "main", "name": "いま", "items": main, "daily": False},
            {"id": "shop", "name": "買い物", "items": shop, "daily": False},
            {"id": "work", "name": "仕事", "items": work, "daily": False},
            {"id": "morning", "name": "朝の支度", "items": morning, "daily": True},
        ],
        "lockListId": "main", "resetHour": 4, "lastResetDay": "2026-10-09", "paper": "kinari",
        "onboarded": True, "bigOnLock": True, "doneCount": 3, "reviewAsked": True,
    }


def shoot():
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": 430, "height": 932}, device_scale_factor=3, locale="ja-JP", color_scheme="light")
        page = ctx.new_page()

        lock = "file:///" + os.path.join(STORE, "mock", "lock.html").replace("\\", "/")
        page.goto(lock)
        page.wait_for_timeout(300)
        page.screenshot(path=os.path.join(RAW, "1_lock.png"))
        page.goto(lock + "#home")
        page.reload()
        page.wait_for_timeout(300)
        page.screenshot(path=os.path.join(RAW, "4_home.png"))

        page.goto(URL + "?mockbuy=1&theme=light")
        page.evaluate("(d) => { localStorage.clear(); localStorage.setItem('CapacitorStorage.tsugimemo.data.v1', d); localStorage.setItem('tsugimemo.mockPlus', '1'); }", json.dumps(seed(), ensure_ascii=False))
        page.goto(URL + "?mockbuy=1&theme=light")
        page.wait_for_selector(".toptext")
        page.click(".donehead")
        page.wait_for_timeout(400)
        page.screenshot(path=os.path.join(RAW, "2_now.png"))

        page.click(".tabbar >> text=ロック画面")
        page.wait_for_selector(".locktab")
        page.wait_for_timeout(400)
        page.screenshot(path=os.path.join(RAW, "3_locktab.png"))

        page.click(".tabbar >> text=いま")
        page.click(".listname")
        page.wait_for_selector(".sheet")
        page.wait_for_timeout(400)
        page.screenshot(path=os.path.join(RAW, "5_lists.png"))
        b.close()


SHOTS = [
    ("1_lock.png", "ロック画面のいちばん上に", "メモしたのに\n見ない、をなくす。"),
    ("2_now.png", "ロックしたまま押せる", "済んだら丸を押す。\n次が上がってくる。"),
    ("3_locktab.png", "置き方は3つの手順", "ロック画面に\n大きくも出せる。"),
    ("4_home.png", "ホーム画面にも", "紙の色を選んで\n壁紙になじませる。"),
    ("5_lists.png", "リストを分けて", "買い物・仕事・\n朝の支度。"),
]


def rounded(img, r, border):
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h + r), radius=r, fill=255)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    ImageDraw.Draw(out).rounded_rectangle((0, 0, w - 1, h + r), radius=r, outline=border, width=4)
    return out


def compose(raw, eyebrow, head, W, Hh, top, eb_size, hd_size, shot_w, shot_y, name):
    c = Image.new("RGB", (W, Hh), PAPER)
    d = ImageDraw.Draw(c)
    x = int(W * 0.09)
    d.text((x, top), eyebrow, font=ImageFont.truetype(BOLD, eb_size), fill=SHU)
    d.multiline_text((x, top + int(eb_size * 1.7)), head, font=ImageFont.truetype(BOLD, hd_size), fill=INK, spacing=int(hd_size * 0.32))
    im = Image.open(os.path.join(RAW, raw)).convert("RGB")
    s = shot_w / im.width
    im = im.resize((shot_w, int(im.height * s)), Image.LANCZOS)
    im = im.crop((0, 0, shot_w, min(im.height, Hh - shot_y)))
    c.paste(rounded(im, int(shot_w * 0.06), RULE), ((W - shot_w) // 2, shot_y), rounded(im, int(shot_w * 0.06), RULE))
    c.save(name)


def feature():
    W, Hh = 1024, 500
    c = Image.new("RGB", (W, Hh), PAPER)
    d = ImageDraw.Draw(c)
    icon = Image.open(os.path.join(STORE, "icon_1024.png")).resize((120, 120), Image.LANCZOS)
    c.paste(icon, (64, 70))
    d.text((64, 222), "ツギメモ", font=ImageFont.truetype(BOLD, 64), fill=INK)
    d.multiline_text((66, 316), "済んだら消えて、\n次がロック画面に上がってくる。", font=ImageFont.truetype(MED, 28), fill=INK2, spacing=12)
    lock = Image.open(os.path.join(RAW, "1_lock.png")).convert("RGB")
    lock = lock.resize((430, 932), Image.LANCZOS).crop((0, 40, 430, 540))
    lock = rounded(lock, 36, RULE)
    c.paste(lock, (560, 40), lock)
    d.line((560, 0, 560, 0), fill=RULE)
    c.save(os.path.join(STORE, "play", "feature_1024x500.png"))


if __name__ == "__main__":
    shoot()
    for i, (raw, eb, hd) in enumerate(SHOTS, 1):
        compose(raw, eb, hd, 1290, 2796, 190, 52, 104, 1030, 700, os.path.join(STORE, "iphone", f"iphone_{i}.png"))
        compose(raw, eb, hd, 1080, 1920, 110, 40, 76, 780, 470, os.path.join(STORE, "play", f"play_{i}.png"))
    feature()
    print("ok")
