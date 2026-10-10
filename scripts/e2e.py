"""ブラウザで実際に押して回る確認(1.1.0 の見た目)。python scripts/e2e.py [URL]
dist を vite preview で出しておく(npx vite preview --port 5207)。
375 幅と 430 幅 × ライト・ダークの4通りと、Android 向け(?platform=android、412 幅 × ライト・ダーク)の2通り。
はじめての流れ → 足す → 完了(次がスッと上がる)→ 戻す → ウィジェットで完了 → 編集 → スワイプ → 並べ替え(取っ手・長押し)
→ タブ → 履歴から戻す → 表示場所 → 紙の色 → ツギメモ+ → リスト → 毎朝戻す → 大きい文字 → 開き直し を回す。
画面写真は scripts/e2e_out/<幅>_<色>[_android]/ に置く。"""
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
                        color_scheme="dark" if theme == "dark" else "light")
    page = ctx.new_page()
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))

    def shot(name, wait=450):
        page.wait_for_timeout(wait)
        page.screenshot(path=os.path.join(out, name + ".png"))

    def no_overflow(where):
        w = page.evaluate("document.documentElement.scrollWidth")
        check(w <= width, tag + f"横にはみ出さない({where}: {w})")

    def no_english(where):
        txt = page.evaluate("document.body.innerText")
        words = [w for w in re.findall(r"[A-Za-z]{2,}", txt) if w not in ("iPhone", "Android")]
        check(not words, tag + f"英語の取り残しが無い({where}: {words[:5]})")

    def no_ios_only(where):
        # Android では iPhone だけの物(ロック画面ウィジェット・カスタマイズ・ライブアクティビティ・9:41・ダイナミックアイランド)を出さない
        if plat != "android":
            return
        txt = page.evaluate("document.body.innerText")
        bad = [w for w in ("iPhone", "カスタマイズ", "ライブアクティビティ", "9:41", "四角・1行・丸", "黒い枠") if w in txt]
        imgs = page.evaluate("[...document.images].map(i => i.src).filter(s => s.includes('lock_ios'))")
        check(not bad and not imgs, tag + f"iPhone だけの物が出ていない({where}: {bad} {imgs})")

    def checks(where):
        no_overflow(where)
        no_english(where)
        no_ios_only(where)

    def open_texts():
        return [t.strip() for t in page.locator("ol[aria-label='進行中'] .rowtext").all_inner_texts()]

    def done_texts():
        return [t.strip() for t in page.locator("ul[aria-label='完了'] .rowtext").all_inner_texts()]

    def top_text():
        t = page.locator(".row.top .rowtext")
        return t.inner_text().strip() if t.count() else None

    def snap():
        return json.loads(page.evaluate("localStorage.getItem('tsugimemo.web.snapshot')"))

    def close_toast():
        if page.locator(".toast-x").count():
            page.click(".toast-x")

    page.goto(URL + q)
    page.evaluate("localStorage.clear()")
    page.goto(URL + q)

    # 1. はじめての流れ(4枚・どこからでも飛ばせる)
    page.wait_for_selector(".onb")
    check(page.locator("text=とばす").count() == 1, tag + "はじめての流れは飛ばせる")
    check(page.locator("text=見ないで忘れる、をなくす。").count() == 1, tag + "1枚目に見本の言葉")
    shot("01_welcome")
    checks("はじめて1")
    page.click("text=さっそくはじめる")
    check(page.locator(".placecard").count() == 2, tag + "2枚目: 表示の設定が2つ")
    shot("02_permission")
    checks("はじめて2")
    page.click("text=設定に進む")
    page.fill(".firstfield", "企画書の下書きを進める")
    check(page.locator(".counter").inner_text().strip() == "11/60", tag + "最初のメモの字数が出る")
    shot("03_first_memo")
    checks("はじめて3")
    page.click("text=これで始める")
    check(page.locator(".lockmock .lm-text").first.inner_text().strip() == "企画書の下書きを進める", tag + "4枚目: 書いた1行がロック画面の見本に出る")
    if plat == "android":
        check(page.locator(".lockmock.android .lm-notif").count() == 1 and page.locator(".lm-card").count() == 0, tag + "Android の見本はお知らせ(紙の札・時計なし)")
    else:
        check(page.locator(".lockmock.ios .lm-card").count() == 1, tag + "iPhone の見本は紙の札")
    shot("04_ready", 300)
    page.wait_for_timeout(2600)
    shot("04b_ready_moving", 0)
    checks("はじめて4")
    page.click(".onb-foot .btn.primary")
    page.wait_for_selector(".listscreen")
    check(top_text() == "企画書の下書きを進める", tag + "書いた1行がいちばん上(黄色)に入る")
    snap0 = snap()
    check(snap0["items"][0]["text"] == "企画書の下書きを進める" and snap0["list"] == "ツギメモ", tag + "ウィジェットに渡す中身と名前")
    check(snap0["paper"]["bg"] == "#FEFBF3" and snap0["paper"]["mark"].upper() == "#3B84E6", tag + "紙はミルク、丸は青")

    # 2. 足す(Enter で1行ずつ・貼り付けた複数行は分かれる)
    for t in ["ジムに行く", "本を30分読む"]:
        page.fill(".field", t)
        page.keyboard.press("Enter")
    page.fill(".field", "買い物(たまご・牛乳・野菜)\n友達に連絡する\n部屋の掃除をする")
    check(page.locator(".clearbtn").count() == 1, tag + "入力中は × が出る")
    page.click(".send")
    page.fill(".field", "資料をメールする")
    page.keyboard.press("Enter")
    page.fill(".field", "美容室を予約する")
    page.keyboard.press("Enter")
    check(len(open_texts()) == 8, tag + f"8行並ぶ {open_texts()}")
    check(snap()["left"] == 8, tag + "ウィジェットの残りの数が書き変わる")
    check(page.locator(".send").is_disabled(), tag + "空の時は送るボタンが押せない")
    shot("05_list")
    checks("一覧")

    # 3. 完了 → 次がスッと上がる → 戻す
    page.locator(".row.top .ring").click()
    page.wait_for_timeout(150)
    check(page.locator(".ring.checked.pop").count() == 1, tag + "押すと青いチェックに変わる")
    shot("06_checking", 0)
    page.wait_for_timeout(700)
    check(top_text() == "ジムに行く", tag + "完了すると次の行がいちばん上に上がる")
    check(done_texts() == ["企画書の下書きを進める"], tag + "完了した行は下に、取り消し線で残る")
    check(page.locator(".toast-undo").count() == 1, tag + "完了の後に「戻す」が出る")
    shot("07_after_done")
    page.click(".toast-undo")
    check(top_text() == "企画書の下書きを進める", tag + "戻すと元に戻る")
    # 2つ完了しておく(見本と同じ「資料をメールする」「美容室を予約する」)
    for name in ["資料をメールする", "美容室を予約する"]:
        page.locator("ol[aria-label='進行中'] .row", has_text=name).locator(".ring").click()
        page.wait_for_timeout(700)
    close_toast()
    shot("08_list_with_done")

    # 4. ウィジェットで完了(ネイティブが貯める events を真似る)→ アプリに戻ると反映
    top_id = snap()["items"][0]["id"]
    page.evaluate(f"localStorage.setItem('tsugimemo.web.events', JSON.stringify([{{id: '{top_id}', at: Date.now()}}]))")
    page.evaluate("document.dispatchEvent(new Event('visibilitychange'))")
    page.wait_for_timeout(500)
    check(top_text() == "ジムに行く", tag + "ウィジェットで完了した行が、アプリにも完了として入る")

    # 5. 行を押す → メモの編集
    page.locator("ol[aria-label='進行中'] .rowtext", has_text="本を30分読む").click()
    page.wait_for_selector(".sheet")
    check(page.locator(".sheet h2").inner_text() == "メモの編集", tag + "行を押すと「メモの編集」")
    shot("09_edit")
    checks("編集")
    page.fill(".editfield", "本を30分読む(小説)")
    page.click(".sheet .btn.primary")
    check("本を30分読む(小説)" in open_texts(), tag + "書き直して保存できる")
    close_toast()
    page.locator("ol[aria-label='進行中'] .rowtext", has_text="友達に連絡する").click()
    page.click("text=いちばん上にする")
    check(top_text() == "友達に連絡する", tag + "いちばん上にできる")
    close_toast()

    # 6. 左にスワイプ → 編集・削除
    row = page.locator("ol[aria-label='進行中'] .row", has_text="部屋の掃除をする")
    bb = row.bounding_box()
    y = bb["y"] + bb["height"] / 2
    page.mouse.move(bb["x"] + bb["width"] - 60, y)
    page.mouse.down()
    for i in range(1, 9):
        page.mouse.move(bb["x"] + bb["width"] - 60 - i * 22, y)
    page.mouse.up()
    page.wait_for_timeout(300)
    check(row.locator(".sa.del").is_visible() and row.locator(".row-in").evaluate("e => getComputedStyle(e).transform") != "none", tag + "左にスワイプすると編集・削除が出る")
    shot("10_swipe")
    row.locator(".sa.del").click()
    check("部屋の掃除をする" not in open_texts(), tag + "削除できる")
    check(page.locator(".toast", has_text="削除しました").count() == 1, tag + f"削除の後に「戻す」が出る {page.locator('.toast').all_inner_texts()}")
    shot("11_deleted_toast")
    page.click(".toast-undo")
    check("部屋の掃除をする" in open_texts(), tag + "削除を戻せる")

    # 7. 並べ替え: 右の取っ手をつかんで動かす
    before = open_texts()
    h = page.locator("ol[aria-label='進行中'] .row").nth(0).bounding_box()["height"]
    handle = page.locator("ol[aria-label='進行中'] .row").nth(3).locator(".handle")
    hb = handle.bounding_box()
    page.mouse.move(hb["x"] + hb["width"] / 2, hb["y"] + hb["height"] / 2)
    page.mouse.down()
    for i in range(1, 11):
        page.mouse.move(hb["x"] + hb["width"] / 2, hb["y"] + hb["height"] / 2 - h * 3 * i / 10)
    shot("12_dragging", 100)
    page.mouse.up()
    page.wait_for_timeout(400)
    after = open_texts()
    check(after[0] == before[3] and len(after) == len(before), tag + f"取っ手で並べ替えられる {before[:4]} → {after[:4]}")
    check(snap()["items"][0]["text"] == before[3], tag + "並べ替えた先頭がウィジェットに渡る")
    # 長押しで並べ替え
    before = open_texts()
    rb = page.locator("ol[aria-label='進行中'] .row").nth(0).locator(".rowtext").bounding_box()
    page.mouse.move(rb["x"] + 30, rb["y"] + rb["height"] / 2)
    page.mouse.down()
    page.wait_for_timeout(650)
    for i in range(1, 11):
        page.mouse.move(rb["x"] + 30, rb["y"] + rb["height"] / 2 + h * 2 * i / 10)
    page.mouse.up()
    page.wait_for_timeout(400)
    after = open_texts()
    check(after[2] == before[0] and page.locator(".sheet").count() == 0, tag + f"長押しで並べ替えられる(編集は開かない) {before[:3]} → {after[:3]}")

    # 8. タブ
    page.click(".tab >> text=進行中")
    check(page.locator("ul[aria-label='完了']").count() == 0 and len(open_texts()) > 0, tag + "進行中のタブは未完了だけ")
    page.click(".tab >> text=完了")
    check(page.locator("ol[aria-label='進行中']").count() == 0 and len(done_texts()) == 3, tag + "完了のタブは完了だけ")
    shot("13_tab_done")
    page.click(".tab >> text=すべて")

    # 9. 履歴(完了・削除を日ごとに)→ 詳しく → 元に戻す
    page.locator("ol[aria-label='進行中'] .rowtext", has_text="部屋の掃除をする").click()
    page.click(".sheet .danger-text")
    close_toast()
    page.click("[aria-label='履歴']")
    page.wait_for_selector(".history")
    check(page.locator(".hday").first.inner_text().startswith("今日"), tag + "履歴は日ごと(今日)")
    check(page.locator(".hicon.deleted").count() == 1 and page.locator(".hicon.done").count() == 3, tag + "完了(青)と削除(赤)が並ぶ")
    check(page.locator(".hsub em", has_text="あと6日").count() == 1, tag + "削除は残りの日数が出る")
    shot("14_history")
    checks("履歴")
    page.locator(".hrow", has_text="部屋の掃除をする").click()
    page.wait_for_selector(".hdetail.deleted")
    shot("15_history_detail")
    page.click(".sheet .btn.primary")
    page.wait_for_selector(".dialog")
    check(page.locator("text=このメモを元に戻しますか?").count() == 1, tag + "元に戻す前に確かめる")
    shot("16_restore_confirm")
    page.click(".dialog .btn.primary")
    check(page.locator(".toast.dark", has_text="元に戻しました").count() == 1, tag + "元に戻すと黒いお知らせ")
    check(page.locator(".hicon.deleted").count() == 0, tag + "戻した行は履歴から消える")
    shot("17_restored")
    close_toast()

    # 10. 設定 → 表示場所(ロック画面・ウィジェット・大きく出す)
    page.click(".seg-btn >> text=設定")
    page.wait_for_selector(".settings")
    shot("18_settings")
    checks("設定")
    page.click("text=表示場所")
    page.wait_for_selector(".display")
    top_now = snap()["items"][0]["text"]
    check(page.locator(".lockmock .lm-text").first.inner_text().strip() == top_now, tag + "見本のロック画面に、いまの1行が出る")
    check(page.locator(".wmock").count() == 2, tag + "ホーム画面ウィジェットの見本が2つ")
    shot("19_display")
    checks("表示場所")
    if plat == "android":
        check(page.locator(".lockmock .lm-action", has_text="完了").count() == 1, tag + "見本のお知らせに「完了」ボタンがある")
        check(page.locator("text=ホーム画面の何もない所を長押し").count() == 1, tag + "置き方が Android の手順")
    else:
        check(page.locator("text=ロック画面を長押しして「カスタマイズ」").count() == 1, tag + "iPhone はロック画面ウィジェットの置き方も出る")
    page.click(".switchrow .switch")
    page.wait_for_selector(".sheet")
    check(page.locator(".sheet-text").count() == 1, tag + "許可の前に理由の一文が出る")
    shot("20_big_ask")
    no_ios_only("許可の前の説明")
    page.click(".sheet .btn.primary")
    page.wait_for_timeout(250)
    check(page.locator(".switchrow .switch").is_checked(), tag + "大きく出すがオンになる")
    check(page.evaluate("localStorage.getItem('tsugimemo.web.big')") == "1", tag + "ネイティブ側へ big=true が渡る")
    if plat != "android":
        check(page.locator(".island").count() == 1, tag + "iPhone はダイナミックアイランドの見本も出る")
    close_toast()
    page.evaluate("window.scrollTo(0, 0)")
    shot("21_big_on")
    page.click(".switchrow .switch")
    page.evaluate("localStorage.setItem('tsugimemo.web.denyBig','1')")
    page.click(".switchrow .switch")
    page.click(".sheet .btn.primary")
    page.wait_for_selector(".warn")
    check(not page.locator(".switchrow .switch").is_checked(), tag + "断られたらオフのまま")
    check(page.locator("text=もう一度ためす").count() == 1, tag + "断られた時の次の一手が出る")
    page.evaluate("localStorage.removeItem('tsugimemo.web.denyBig')")
    page.locator(".widgetstage").scroll_into_view_if_needed()
    shot("22_display_widgets")
    no_overflow("表示場所(下)")

    # 11. 紙の色(無料はミルクだけ)→ ツギメモ+ の案内
    page.click(".display .navrow")
    page.wait_for_selector(".papers")
    check(page.locator(".paper-lock").count() == 5, tag + "無料はミルクだけ(ほかの5色に + の印)")
    shot("23_papers_free")
    checks("紙の色")
    page.locator(".paper").nth(2).click()
    page.wait_for_selector(".paywall")
    check(page.locator("text=この紙の色は、ツギメモ+ で使えます。").count() == 1, tag + "押した物に合わせた案内が出る")
    check(page.locator(".pw-table").count() == 1, tag + "無料版とのちがいの表がある")
    shot("24_paywall")
    checks("ツギメモ+")
    page.locator(".paywall-sheet .sheet-head .iconbtn").click()
    page.locator(".sheet-head .iconbtn").first.click()

    # 12. 設定 → ツギメモ+ を開く(疑似購入)
    page.click(".backbtn")
    page.click(".plusbanner")
    page.wait_for_selector(".paywall")
    page.click(".paywall .btn.primary")
    page.wait_for_selector(".plusrow")
    check(page.locator(".plusrow").count() == 1, tag + "買うと設定に「使っています」が出る")
    close_toast()

    # 13. リストを作る → そのリストに足す → ロック画面に出すリストを替える → 紙の色
    page.click(".seg-btn >> text=リスト")
    page.click(".titlebtn")
    shot("25_lists_sheet")
    page.click("text=新しいリストを作成")
    page.fill(".addlist .field", "買い物")
    page.click(".addlist .btn.primary")
    check(page.locator(".titlebtn h1").inner_text().strip() == "買い物", tag + "作ったリストがすぐ開く")
    check(page.locator("text=このリストはロック画面に出ていません").count() == 1, tag + "出ていないリストではそう書く")
    shot("26_new_list_empty")
    page.fill(".field", "卵")
    page.keyboard.press("Enter")
    page.click("[aria-label='設定']")
    page.click("text=表示場所")
    page.locator(".display .list-row", has_text="買い物").click()
    check(page.locator(".lockmock .lm-text").first.inner_text().strip() == "卵", tag + "出すリストを替えると見本も替わる")
    page.click(".display .navrow")
    page.locator(".paper").nth(2).click()
    check(page.locator(".paper.on .paper-name").inner_text() == "ソーダ", tag + "買った後は紙の色を選べる")
    shot("27_paper_soda")
    page.locator(".sheet-head .iconbtn").first.click()
    s = snap()
    check(s["list"] == "買い物" and s["paper"]["bg"] == "#E3F2FF", tag + "ウィジェットに出すリストと紙の色が渡る")
    page.click(".backbtn")

    # 14. 毎朝戻す・時刻
    page.locator(".setrow", has_text="買い物").locator(".switch").check()
    page.select_option(".selectrow select", "6")
    check(page.locator(".setrow", has_text="買い物").locator(".switch").is_checked(), tag + "毎朝戻すをオンにできる")
    shot("28_settings_plus")

    # 15. 大きい文字(文字を1.35倍)でも崩れない
    page.click(".seg-btn >> text=リスト")
    page.evaluate("document.documentElement.style.fontSize='21.6px'")
    page.click(".titlebtn")
    page.locator(".sheet .list-row", has_text="いま").click()
    shot("29_large_text")
    no_overflow("大きい文字")
    page.evaluate("document.documentElement.style.fontSize=''")

    # 16. 保存されていて、開き直しても同じ
    page.reload()
    page.wait_for_selector(".listscreen")
    check(page.locator(".titlebtn h1").inner_text().strip() == "買い物" and top_text() == "卵", tag + "開き直すと、ロック画面に出しているリスト(買い物)が開き、行が残っている")
    check(page.evaluate("getComputedStyle(document.querySelector('.app')).backgroundColor") in ("rgb(227, 242, 255)", "rgb(23, 24, 27)"), tag + "紙の色がリストの地になる(ダークでは使わない)")
    shot("30_reload_soda")

    # 17. 空の状態(はじめての説明をもう一度 → とばす → 全部消した時)
    page.click(".row.top .rowtext")
    page.click(".sheet .danger-text")
    check(page.locator("text=まだメモがありません").count() == 1, tag + "空の時は次の一手が出る")
    shot("31_empty")
    page.click(".empty .btn.primary")
    check(page.evaluate("document.activeElement && document.activeElement.classList.contains('field')"), tag + "空の時のボタンで、すぐ入力欄に打てる")

    check(not errors, tag + f"コンソールにエラーが無い {errors[:3]}")
    b.close()


with sync_playwright() as p:
    only = os.environ.get("E2E_ONLY")
    for (w, h) in [(375, 667), (430, 932)]:
        for theme in ["light", "dark"]:
            if not only or only == f"{w}_{theme}":
                run(p, w, h, theme)
    for theme in ["light", "dark"]:
        if not only or only == f"412_{theme}_android":
            run(p, 412, 915, theme, "android")

print()
print("ALL PASS" if not fails else f"{len(fails)} NG")
sys.exit(1 if fails else 0)
