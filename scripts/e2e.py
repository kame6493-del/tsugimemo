"""ブラウザで実際に押して回る確認。python scripts/e2e.py [URL]
dist を vite preview で出しておく(npx vite preview --port 5207)。
375 幅と 430 幅、ライトとダークの4通りで、初回 → 足す → 済ませる → ウィジェットで済ませる → 並べ替え → ロック画面 → 課金 → リスト → 消したもの を回す。
画面写真は scripts/e2e_out/<幅>_<色>/ に置く。"""
import json
import os
import re
import sys
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5207/"
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "e2e_out")
fails = []


def check(cond, msg):
    print(("OK  " if cond else "NG  ") + msg)
    if not cond:
        fails.append(msg)


def run(p, width, height, theme, plat=""):
    out = os.path.join(ROOT, f"{width}_{theme}" + (f"_{plat}" if plat else ""))
    os.makedirs(out, exist_ok=True)
    tag = f"[{width} {theme}{(' ' + plat) if plat else ''}] "
    q = f"?mockbuy=1&theme={theme}" + (f"&platform={plat}" if plat else "")
    errors = []
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": width, "height": height}, device_scale_factor=2, locale="ja-JP",
                        color_scheme="dark" if theme == "dark" else "light", has_touch=True)
    page = ctx.new_page()
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))

    def shot(name):
        page.wait_for_timeout(350)
        page.screenshot(path=os.path.join(out, name + ".png"))

    def no_overflow(where):
        w = page.evaluate("document.documentElement.scrollWidth")
        check(w <= width, tag + f"横にはみ出さない({where}: {w})")

    def no_english(where):
        txt = page.evaluate("document.body.innerText")
        words = [w for w in re.findall(r"[A-Za-z]{2,}", txt) if w not in ("iPhone", "Android")]
        check(not words, tag + f"英語の取り残しが無い({where}: {words[:5]})")

    def no_ios_only(where):
        # Android では iPhone だけの物(ロック画面ウィジェット・カスタマイズ・ライブアクティビティ・9:41)を出さない
        if plat != "android":
            return
        txt = page.evaluate("document.body.innerText")
        bad = [w for w in ("iPhone", "カスタマイズ", "ライブアクティビティ", "9:41", "四角・1行・丸") if w in txt]
        check(not bad, tag + f"iPhone だけの物が出ていない({where}: {bad})")

    def top_text():
        return page.locator(".toptext").inner_text() if page.locator(".toptext").count() else None

    def pending_rows():
        return [t.strip() for t in page.locator("section[aria-label='つぎ'] .rowtext").all_inner_texts()]

    page.goto(URL + q)
    page.evaluate("localStorage.clear()")
    page.goto(URL + q)

    # 1. 最初の説明(3枚・飛ばせる)
    page.wait_for_selector(".onb")
    check(page.locator("text=とばす").count() == 1, tag + "最初の説明は飛ばせる")
    shot("01_intro1")
    no_english("説明1")
    no_ios_only("説明1")
    if plat == "android":
        check(page.locator(".lockmock.android .lm-notif").count() == 1 and page.locator(".lm-time").count() == 0, tag + "説明の見本がロック画面のお知らせになる(時計なし)")
    page.click("text=つぎへ")
    shot("02_intro2")
    no_ios_only("説明2")
    page.click("text=つぎへ")
    check(page.locator("text=とばす").count() == 0, tag + "3枚目で終わる(とばすが消える)")
    shot("03_intro3")
    page.click("text=書きはじめる")
    page.wait_for_selector(".now")
    focused = page.evaluate("document.activeElement && document.activeElement.classList.contains('field')")
    check(focused, tag + "書きはじめると、すぐ入力欄に文字を打てる")
    check(page.locator("text=まだ何もありません").count() == 1, tag + "空の時は次の一手の説明が出る")
    shot("04_empty")
    no_english("空")

    # 2. 足す(改行で1行ずつ・貼り付けた複数行は分かれる)
    page.fill(".field", "牛乳を買って帰る")
    page.keyboard.press("Enter")
    page.fill(".field", "歯医者に電話する\n図書館の本を返す\nクリーニングを受け取る")
    page.click(".send")
    check(top_text() == "牛乳を買って帰る", tag + "最初の1行が「いま」に出る")
    check(pending_rows() == ["2牛乳"] or len(pending_rows()) == 3, tag + f"次の行が3つ並ぶ {pending_rows()}")
    snap = json.loads(page.evaluate("localStorage.getItem('tsugimemo.web.snapshot')"))
    check(snap["items"][0]["text"] == "牛乳を買って帰る" and snap["left"] == 4, tag + "ウィジェットに渡す中身が書き変わる")
    # いちばん上に足す
    page.click(".pin")
    page.fill(".field", "10時に会議の資料を送る")
    page.keyboard.press("Enter")
    check(top_text() == "10時に会議の資料を送る", tag + "ピンを押して足すと、いちばん上に入る")
    shot("05_list")
    no_overflow("いま")
    no_english("いま")

    # 3. 済ませる → 次が上がる → 戻す
    page.click(".ring.big")
    page.wait_for_timeout(400)
    check(top_text() == "牛乳を買って帰る", tag + "済ませると次の行が上がる")
    check(page.locator(".toast-undo").count() == 1, tag + "済ませた後に「戻す」が出る")
    shot("06_after_done")
    page.click(".toast-undo")
    check(top_text() == "10時に会議の資料を送る", tag + "戻すと元に戻る")
    page.click(".ring.big")
    page.wait_for_timeout(400)

    # 4. ロック画面のウィジェットで済ませた(ネイティブが貯める events を真似る)→ アプリに戻ると反映
    top_id = json.loads(page.evaluate("localStorage.getItem('tsugimemo.web.snapshot')"))["items"][0]["id"]
    page.evaluate(f"localStorage.setItem('tsugimemo.web.events', JSON.stringify([{{id: '{top_id}', at: Date.now()}}]))")
    page.evaluate("document.dispatchEvent(new Event('visibilitychange'))")
    page.wait_for_timeout(300)
    check(top_text() == "歯医者に電話する", tag + "ウィジェットで済ませた行が、アプリにも済みとして入る")

    # 5. 行を押す → 書き直す・いちばん上にする
    page.locator("section[aria-label='つぎ'] .rowtext").nth(1).click()
    page.wait_for_selector(".sheet")
    shot("07_item_sheet")
    page.fill(".editfield", "クリーニングを受け取る(駅前)")
    page.click("text=書き直す")
    page.locator("section[aria-label='つぎ'] .rowtext").nth(1).click()
    page.click("text=いちばん上にする")
    check(top_text() == "クリーニングを受け取る(駅前)", tag + "書き直して、いちばん上にできる")

    # 済んだの一覧
    page.click(".donehead")
    check(page.locator(".row.done").count() == 2, tag + "済んだ行が2つ見える")
    shot("08_done_open")

    # 6. ロック画面タブ
    page.click("text=ロック画面 >> nth=-1")
    page.wait_for_selector(".locktab")
    check(page.locator(".lm-top .lm-text").inner_text() == "クリーニングを受け取る(駅前)", tag + "見本のロック画面に、いまの1行が出る")
    shot("09_lock")
    no_overflow("ロック画面")
    no_english("ロック画面")
    no_ios_only("ロック画面")
    if plat == "android":
        check(page.locator(".locktab .lm-action", has_text="済んだ").count() == 1, tag + "見本のお知らせに「済んだ」ボタンがある")
        check(page.locator("text=ホーム画面の何もない所を長押し").count() == 1, tag + "置き方が Android の手順になっている")
    else:
        check(page.locator(".lm-time").count() == 1, tag + "iPhone の見本はロック画面のウィジェット")
    # 大きく出す: 理由を一文添えてから聞く
    page.click(".switchrow .switch")
    page.wait_for_selector(".sheet")
    check(page.locator(".sheet-text").count() == 1, tag + "許可の前に理由の一文が出る")
    shot("10_big_ask")
    no_ios_only("許可の前の説明")
    page.click(".sheet .btn.primary")
    page.wait_for_timeout(200)
    check(page.locator(".switchrow .switch").is_checked(), tag + "大きく出すがオンになる")
    check(page.evaluate("localStorage.getItem('tsugimemo.web.big')") == "1", tag + "ネイティブ側へ big=true が渡る")
    # 断られた時
    page.click(".switchrow .switch")
    page.evaluate("localStorage.setItem('tsugimemo.web.denyBig','1')")
    page.click(".switchrow .switch")
    page.click(".sheet .btn.primary")
    page.wait_for_selector(".warn")
    check(not page.locator(".switchrow .switch").is_checked(), tag + "断られたらオフのまま")
    check(page.locator("text=もう一度ためす").count() == 1, tag + "断られた時の次の一手が出る")
    shot("11_big_denied")
    page.evaluate("localStorage.removeItem('tsugimemo.web.denyBig')")

    # 7. 無料では使えない紙の色 → ツギメモ+ の案内
    page.locator(".paper").nth(4).click()
    page.wait_for_selector(".paywall")
    check(page.locator("text=この紙の色は、ツギメモ+ で使えます。").count() == 1, tag + "押した物に合わせた案内が出る")
    shot("12_paywall")
    no_english("課金")
    page.click(".sheet-head .iconbtn")

    # 8. 設定 → ツギメモ+ を開く(疑似購入)
    page.click(".tabbar >> text=設定")
    page.wait_for_selector(".settings")
    shot("13_settings")
    no_overflow("設定")
    page.click("text=ツギメモ+ >> nth=0")
    page.wait_for_selector(".paywall")
    page.click(".paywall .btn.primary")
    page.wait_for_selector(".plusrow")
    check(page.locator(".plusrow").count() == 1, tag + "買うと設定に「使っています」が出る")

    # 9. リストを足す → そのリストに行を足す → ロック画面に出すリストを替える
    page.click(".tabbar >> text=いま")
    page.click(".listname")
    page.click("text=リストを足す")
    page.fill(".addlist .field", "買い物")
    page.click(".addlist .btn.primary")
    check(page.locator(".listname").inner_text().strip() == "買い物", tag + "足したリストがすぐ開く")
    check(page.locator("text=このリストはロック画面に出ていません").count() == 1, tag + "出ていないリストではそう書く")
    page.fill(".field", "卵")
    page.keyboard.press("Enter")
    page.click(".tabbar >> text=ロック画面")
    page.locator(".locktab .pick", has_text="買い物").click()
    check(page.locator(".lm-top .lm-text").inner_text() == "卵", tag + "出すリストを替えると見本も替わる")
    page.locator(".paper").nth(5).click()
    shot("14_lock_plus")
    snap = json.loads(page.evaluate("localStorage.getItem('tsugimemo.web.snapshot')"))
    check(snap["list"] == "買い物" and snap["paper"]["dark"] is True, tag + "ウィジェットに出すリストと紙の色が渡る")

    # 10. 消す → 消したもの から戻す
    page.click(".tabbar >> text=いま")
    page.click(".toptext")
    page.click(".action.danger")
    check(page.locator("text=消しました").count() == 1, tag + "消した後に「戻す」が出る")
    page.click(".tabbar >> text=設定")
    page.click("text=消したもの")
    check(page.locator(".trash .row").count() == 1, tag + "消したものに1行ある")
    shot("15_trash")
    page.click(".trash .btn")
    check(page.locator(".trash .row").count() == 0, tag + "戻すと消したものから消える")
    page.click(".sheet-head .iconbtn")

    # 11. 大きい文字(文字を1.35倍)でも崩れない
    page.click(".tabbar >> text=いま")
    page.evaluate("document.documentElement.style.fontSize='21.6px'")
    page.click(".listname")
    page.locator(".sheet .pick", has_text="いま").click()
    shot("16_large_text")
    no_overflow("大きい文字")
    page.evaluate("document.documentElement.style.fontSize=''")

    # 12. 保存されていて、開き直しても同じ
    page.reload()
    page.wait_for_selector(".now")
    check(top_text() == "卵", tag + "開き直すと、ロック画面に出しているリスト(買い物)が開き、行が残っている")

    check(not errors, tag + f"コンソールにエラーが無い {errors[:3]}")
    b.close()


with sync_playwright() as p:
    for (w, h) in [(375, 667), (430, 932)]:
        for theme in ["light", "dark"]:
            run(p, w, h, theme)
    for theme in ["light", "dark"]:
        run(p, 412, 915, theme, "android")

print()
print("ALL PASS" if not fails else f"{len(fails)} NG")
sys.exit(1 if fails else 0)
