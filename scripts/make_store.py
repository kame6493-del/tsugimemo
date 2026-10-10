"""ストアの画面写真・フィーチャー画像を作る(1.1.0 の見た目)。python scripts/make_store.py [URL]
dist を vite preview で出しておく(npx vite preview --port 5207)。
1) アプリの画面(中身を入れた状態)と store/mock/screens.html(ロック画面・ホーム画面)を 430x932 の3倍で撮る(store/raw/)
2) 持ち主の見本の作り(左上にピンの紙・太い見出し・黄色い線・端末の枠)で組む:
   iPhone 1290x2796(store/iphone/)・Play 1080x1920(store/play/)・フィーチャー 1024x500
- 値段・「無料」は写さない(ツギメモ+ の案内の画面は使わない)
- Play 用は ?platform=android で撮り、iPhone だけの物(ロック画面のウィジェット・ライブアクティビティ・9:41・カスタマイズ)を写さない
元の版は store/_v1_backup2/ に残してある。
"""
import json
import os
import sys
import time

from PIL import Image, ImageDraw, ImageFilter, ImageFont
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5207/"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORE = os.path.join(ROOT, "store")
IMG = os.path.join(ROOT, "public", "img")
RAW = os.path.join(STORE, "raw")
for d in ("raw/ios", "raw/android", "iphone", "play"):
    os.makedirs(os.path.join(STORE, d), exist_ok=True)

BG = (250, 247, 240)
INK = (31, 41, 55)
INK2 = (107, 114, 128)
BLUE = (59, 132, 230)
PEN = (243, 215, 122)
BOLD = "C:/Windows/Fonts/YuGothB.ttc"
MED = "C:/Windows/Fonts/YuGothM.ttc"
H = 3600 * 1000


def item(i, text, now, done=False, deleted=False, ago=1):
    d = {"id": f"s{i}", "text": text, "done": done, "createdAt": now - 30 * H + i, "editedAt": now - 30 * H + i}
    if done:
        d["doneAt"] = now - H * ago
    if deleted:
        d["deletedAt"] = now - H * ago
    return d


def seed(multi=False, paper="milk"):
    now = int(time.time() * 1000)
    main = [item(1, "企画書の下書きを進める", now), item(2, "ジムに行く", now), item(3, "本を30分読む", now),
            item(4, "買い物(たまご・牛乳・野菜)", now), item(5, "友達に連絡する", now), item(6, "部屋の掃除をする", now),
            item(7, "資料をメールする", now, done=True, ago=2), item(8, "美容室を予約する", now, done=True, ago=3),
            item(9, "映画のチケットを買う", now, deleted=True, ago=1), item(10, "粗大ごみを申し込む", now, done=True, ago=26),
            item(11, "ゲームを売る", now, deleted=True, ago=28)]
    lists = [{"id": "main", "name": "やること", "items": main, "daily": False}]
    if multi:
        lists += [
            {"id": "work", "name": "仕事", "items": [item(21, "見積もりを送る", now), item(22, "会議室を取る", now)], "daily": False},
            {"id": "shop", "name": "買い物", "items": [item(31, "たまごと牛乳", now), item(32, "食器用の洗剤", now)], "daily": False},
            {"id": "read", "name": "読書", "items": [item(41, "図書館で本を借りる", now), item(42, "読書ノートを書く", now)], "daily": False},
            {"id": "morning", "name": "朝のやること", "items": [item(51, "水を飲む", now), item(52, "ストレッチをする", now)], "daily": True},
        ]
    return {"v": 1, "lists": lists, "lockListId": "main", "resetHour": 4, "lastResetDay": "2026-10-10", "paper": paper,
            "onboarded": True, "bigOnLock": True, "doneCount": 3, "reviewAsked": True}


def shoot():
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": 430, "height": 932}, device_scale_factor=3, locale="ja-JP", color_scheme="light")
        page = ctx.new_page()
        mock = "file:///" + os.path.join(STORE, "mock", "screens.html").replace("\\", "/")
        for h, out in (("lock-ios", "ios/lock.png"), ("done-ios", "ios/done.png"), ("home-ios", "ios/home.png"),
                       ("lock-android", "android/lock.png"), ("home-android", "android/home.png")):
            page.goto("about:blank")
            page.goto(mock + "#" + h)
            page.wait_for_timeout(400)
            page.screenshot(path=os.path.join(RAW, out))

        for plat in ("ios", "android"):
            q = "?mockbuy=1&theme=light" + ("&platform=android" if plat == "android" else "")

            def load(data, plus=False):
                page.goto("about:blank")
                page.goto(URL + q)
                page.wait_for_timeout(300)
                page.evaluate("([d, p]) => { localStorage.clear(); localStorage.setItem('CapacitorStorage.tsugimemo.data.v1', d); if (p) localStorage.setItem('tsugimemo.mockPlus', '1'); }",
                              [json.dumps(data, ensure_ascii=False), plus])
                page.goto(URL + q)

            load(seed())
            page.wait_for_selector(".listscreen")
            page.wait_for_timeout(500)
            page.screenshot(path=os.path.join(RAW, plat, "list.png"))
            page.click("[aria-label='履歴']")
            page.wait_for_selector(".history")
            page.wait_for_timeout(400)
            page.screenshot(path=os.path.join(RAW, plat, "history.png"))

            load(seed(multi=True, paper="sakura"), plus=True)
            page.wait_for_selector(".listscreen")
            page.click(".titlebtn")
            page.wait_for_selector(".sheet")
            page.wait_for_timeout(500)
            page.screenshot(path=os.path.join(RAW, plat, "lists.png"))
            page.click(".sheet-head .iconbtn")
            page.click("[aria-label='設定']")
            page.click("text=紙の色")
            page.wait_for_selector(".papers")
            page.wait_for_timeout(500)
            page.screenshot(path=os.path.join(RAW, plat, "paper.png"))

            d = seed()
            d["onboarded"] = False
            load(d)
            page.wait_for_selector(".welcome")
            page.wait_for_timeout(500)
            page.screenshot(path=os.path.join(RAW, plat, "welcome.png"))

            if plat == "android":
                # Android の写真に iPhone だけの物が入っていないか
                txt = page.evaluate("document.body.innerText")
                for w in ("iPhone", "カスタマイズ", "ライブアクティビティ", "9:41"):
                    assert w not in txt, w
        b.close()


def phone(shot, w, crop_h=None):
    """画面写真を端末の枠に入れる(黒い縁・角丸)"""
    im = Image.open(shot).convert("RGB")
    s = w / im.width
    im = im.resize((w, round(im.height * s)), Image.LANCZOS)
    if crop_h and crop_h < im.height:
        im = im.crop((0, 0, w, crop_h))
    r = round(w * 0.11)
    bw = round(w * 0.028)
    W, Hh = w + bw * 2, im.height + bw * 2
    out = Image.new("RGBA", (W, Hh), (0, 0, 0, 0))
    d = ImageDraw.Draw(out)
    full = crop_h is None or crop_h >= round(Image.open(shot).height * s)
    d.rounded_rectangle((0, 0, W - 1, Hh - 1 + (0 if full else r * 2)), radius=r + bw, fill=(28, 30, 34))
    m = Image.new("L", im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, im.width - 1, im.height - 1 + (0 if full else r * 2)), radius=r, fill=255)
    out.paste(im, (bw, bw), m)
    return out


def shadowed(canvas, img, xy, blur=30, alpha=70):
    sh = Image.new("RGBA", (img.width + blur * 4, img.height + blur * 4), (0, 0, 0, 0))
    a = img.split()[-1].point(lambda v: alpha if v > 0 else 0)
    sh.paste((60, 50, 30, 255), (blur * 2, blur * 2), a)
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    canvas.alpha_composite(sh, (xy[0] - blur * 2, xy[1] - blur * 2 + blur // 2))
    canvas.alpha_composite(img, xy)


def compose(shot, head, sub, W, Hh, out):
    k = W / 1290
    c = Image.new("RGBA", (W, Hh), BG + (255,))
    d = ImageDraw.Draw(c)
    # 左上にピンで留めた紙(見本のロゴ)
    logo = Image.open(os.path.join(IMG, "logo_paper.png")).convert("RGBA")
    lw = round(230 * k)
    logo = logo.resize((lw, round(logo.height * lw / logo.width)), Image.LANCZOS)
    c.alpha_composite(logo, (round(70 * k), round(90 * k)))
    # 見出し(黄色い線つき)と添え書き
    x = round(330 * k)
    fh = ImageFont.truetype(BOLD, round(92 * k))
    fs = ImageFont.truetype(MED, round(50 * k))
    lines = head.split("\n")
    y = round(118 * k)
    for ln in lines:
        bb = d.textbbox((x, y), ln, font=fh)
        d.rounded_rectangle((bb[0] - 6, bb[3] - round(26 * k), bb[2] + 10, bb[3] + round(8 * k)), radius=round(14 * k), fill=PEN)
        d.text((x, y), ln, font=fh, fill=INK)
        y += round(128 * k)
    d.text((x, y + round(14 * k)), sub, font=fs, fill=INK2)
    top = y + round(130 * k)
    pw = round(1000 * k)
    ph = phone(shot, pw - round(56 * k), crop_h=Hh - top - round(60 * k))
    shadowed(c, ph, ((W - ph.width) // 2, top))
    c.convert("RGB").save(out)


IOS = [
    ("lock.png", "見ないで忘れる、\nをなくす。", "ロック画面に、つぎにやる1行。"),
    ("done.png", "完了すると、\n次が上がる。", "ロックしたまま、丸を押すだけ。"),
    ("list.png", "シンプルな\n1行メモ。", "並べ替えも追加も、かんたん。"),
    ("home.png", "ホーム画面でも、\nつぎの1行。", "紙の色を選んで、壁紙になじませる。"),
    ("history.png", "うっかり消しても、\n7日間は戻せる。", "完了も削除も、履歴に残る。"),
    ("lists.png", "リストを分けて、\n紙の色も。", "8つまでのリスト・毎朝戻るリスト(ツギメモ+)"),
]
ANDROID = [
    ("lock.png", "見ないで忘れる、\nをなくす。", "ロック画面のお知らせに、つぎの1行。"),
    ("list.png", "シンプルな\n1行メモ。", "並べ替えも追加も、かんたん。"),
    ("home.png", "ホーム画面でも、\nつぎの1行。", "丸を押すと完了して、次が上がる。"),
    ("history.png", "うっかり消しても、\n7日間は戻せる。", "完了も削除も、履歴に残る。"),
    ("lists.png", "リストを分けて、\n紙の色も。", "8つまでのリスト・毎朝戻るリスト(ツギメモ+)"),
    ("welcome.png", "登録なし。\n広告なし。", "開いたその日から、すぐ使える。"),
]


def feature():
    W, Hh = 1024, 500
    c = Image.new("RGBA", (W, Hh), BG + (255,))
    d = ImageDraw.Draw(c)
    logo = Image.open(os.path.join(IMG, "logo_paper.png")).convert("RGBA").resize((150, 125), Image.LANCZOS)
    c.alpha_composite(logo, (60, 60))
    title = Image.open(os.path.join(IMG, "title.png")).convert("RGBA")
    title = title.resize((380, round(title.height * 380 / title.width)), Image.LANCZOS)
    c.alpha_composite(title, (56, 200))
    d.text((64, 380), "見ないで忘れる、をなくす。", font=ImageFont.truetype(BOLD, 34), fill=INK)
    d.text((64, 432), "ロック画面とホーム画面に、つぎにやる1行。", font=ImageFont.truetype(MED, 22), fill=INK2)
    shot = Image.open(os.path.join(RAW, "android", "lock.png")).convert("RGB").resize((430, 932), Image.LANCZOS).crop((0, 150, 430, 640))
    m = Image.new("L", shot.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, shot.width - 1, shot.height - 1), radius=34, fill=255)
    rgba = Image.new("RGBA", shot.size, (0, 0, 0, 0))
    rgba.paste(shot, (0, 0), m)
    shadowed(c, rgba, (548, 5), blur=14, alpha=60)
    c.convert("RGB").save(os.path.join(STORE, "play", "feature_1024x500.png"))


if __name__ == "__main__":
    shoot()
    for i, (raw, head, sub) in enumerate(IOS, 1):
        compose(os.path.join(RAW, "ios", raw), head, sub, 1290, 2796, os.path.join(STORE, "iphone", f"iphone_{i}.png"))
    for i, (raw, head, sub) in enumerate(ANDROID, 1):
        compose(os.path.join(RAW, "android", raw), head, sub, 1080, 1920, os.path.join(STORE, "play", f"play_{i}.png"))
    feature()
    print("ok")
