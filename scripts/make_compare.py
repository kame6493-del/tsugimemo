"""持ち主の見本と、作り直した画面を並べる。python scripts/make_compare.py
先に scripts/e2e.py と scripts/make_widget_previews.py を流しておく(画面写真はその出力を使う)。
出す物: docs/compare_1〜8.png(見本1枚ずつ)・docs/compare_icon.png・docs/compare_all.png(全部の縮小一覧)"""
import glob
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DL = os.path.dirname(os.path.dirname(ROOT))
E2E = os.path.join(ROOT, "scripts", "e2e_out")
DOCS = os.path.join(ROOT, "docs")
REFS = sorted(glob.glob(os.path.join(DL, "ChatGPT 画像 2026年10月10日 12_10_*.png")))
FONT = "C:/Windows/Fonts/meiryo.ttc"
f_h = ImageFont.truetype(FONT, 34)
f_s = ImageFont.truetype(FONT, 22)

TITLES = ["見本1 デザインの全体", "見本2 使い方フロー", "見本3 いつでも見える表示", "見本4 アプリ画面の詳細",
          "見本5 ツギメモ+", "見本6 履歴と戻す", "見本7 はじめての流れ", "見本8 ギミックUI集"]


def shot(name, cfg="375_light"):
    return (os.path.join(E2E, cfg, name + ".png"), f"{name}" + ("" if cfg == "375_light" else f"({cfg})"))


def doc(name, label):
    return (os.path.join(DOCS, name), label)


# 見本ごとに、対応するアプリの画面(375幅ライト。Android は 412 幅)
PICK = {
    0: [shot("08_list_with_done"), shot("06_checking"), shot("19_display"), doc("widgets_ios.png", "ウィジェット(iOS)"), shot("23_papers_free"), shot("10_swipe"), shot("09_edit"), shot("01_welcome")],
    1: [shot("04_ready"), shot("06_checking"), shot("04b_ready_moving"), shot("14_history"), shot("10_swipe"), shot("12_dragging"), shot("07_after_done"), doc("widgets_ios.png", "ウィジェット(iOS)")],
    2: [shot("19_display"), doc("widgets_ios.png", "iPhone のウィジェット"), doc("widgets_android.png", "Android のウィジェットとお知らせ"), shot("19_display", "412_light_android"), shot("22_display_widgets", "412_light_android"), shot("21_big_on")],
    3: [shot("08_list_with_done"), shot("09_edit"), shot("25_lists_sheet"), shot("12_dragging"), shot("13_tab_done"), shot("15_history_detail"), shot("22_display_widgets"), shot("28_settings_plus")],
    4: [shot("24_paywall"), shot("28_settings_plus"), shot("27_paper_soda"), shot("30_reload_soda"), shot("25_lists_sheet"), shot("23_papers_free")],
    5: [shot("14_history"), shot("15_history_detail"), shot("16_restore_confirm"), shot("17_restored"), shot("11_deleted_toast"), shot("13_tab_done")],
    6: [shot("01_welcome"), shot("02_permission"), shot("03_first_memo"), shot("04_ready"), shot("31_empty"), shot("01_welcome", "412_light_android"), shot("02_permission", "412_light_android"), shot("04_ready", "412_light_android")],
    7: [shot("06_checking"), shot("08_list_with_done"), shot("10_swipe"), shot("12_dragging"), shot("13_tab_done"), shot("23_papers_free"), shot("11_deleted_toast"), shot("31_empty")],
}


def small(img):
    """ファイルを軽くする(256色。比べて見るには十分)"""
    return img.convert("RGB").quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)


def fit(img, w, h):
    img = img.convert("RGB")
    k = min(w / img.width, h / img.height)
    return img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))), Image.LANCZOS)


def board(ref_path, title, picks, out):
    ref = Image.open(ref_path).convert("RGB")
    RH = 1402
    ref = fit(ref, 1122, RH)
    cols, cw, chh = 4, 340, 640
    rows = (len(picks) + cols - 1) // cols
    W = ref.width + 40 + cols * (cw + 16) + 30
    H = 90 + max(RH, rows * (chh + 50)) + 30
    img = Image.new("RGB", (W, H), (241, 238, 231))
    d = ImageDraw.Draw(img)
    d.text((24, 22), f"{title}(左: 持ち主の見本 / 右: 作り直したアプリ)", fill=(31, 41, 55), font=f_h)
    img.paste(ref, (20, 80))
    x0 = ref.width + 50
    for i, (p, label) in enumerate(picks):
        if not os.path.exists(p):
            continue
        r, c = divmod(i, cols)
        x = x0 + c * (cw + 16)
        y = 80 + r * (chh + 50)
        t = fit(Image.open(p), cw, chh)
        d.rectangle((x - 1, y - 1, x + t.width, y + t.height), outline=(200, 195, 185))
        img.paste(t, (x, y))
        d.text((x, y + t.height + 6), label, fill=(80, 85, 95), font=f_s)
    small(img).save(out, optimize=True)
    return out


outs = []
for i, rp in enumerate(REFS):
    outs.append(board(rp, TITLES[i], PICK[i], os.path.join(DOCS, f"compare_{i + 1}.png")))

# アイコン: 見本の正方形 → ストア・iOS(全面)/ Android 適応アイコン(安全域の確かめ)
src = Image.open(os.path.join(ROOT, "store", "src", "icon_source_1024.png"))
store = Image.open(os.path.join(ROOT, "store", "icon_1024.png"))
chk = Image.open(os.path.join(DOCS, "icon_check.png"))
img = Image.new("RGB", (40 + 520 * 2 + 40 + 900, 700), (241, 238, 231))
d = ImageDraw.Draw(img)
d.text((24, 20), "アイコン(左: 持ち主の見本の正方形 / 中: ストア・iOS 用 1024 / 右: Android 適応アイコン。赤い円が安全域、丸・角丸で切った見え方)", fill=(31, 41, 55), font=f_s)
img.paste(fit(src, 500, 500), (20, 80))
img.paste(fit(store, 500, 500), (540, 80))
img.paste(fit(chk, 900, 300), (1080, 180))
p = os.path.join(DOCS, "compare_icon.png")
small(img).save(p, optimize=True)
outs.append(p)

# 全部の一覧
th = [fit(Image.open(o), 1100, 700) for o in outs]
W = 2 * 1120 + 20
H = sum(max(t.height for t in th[i:i + 2]) + 20 for i in range(0, len(th), 2)) + 20
allimg = Image.new("RGB", (W, H), (255, 255, 255))
y = 20
for i in range(0, len(th), 2):
    for j, t in enumerate(th[i:i + 2]):
        allimg.paste(t, (20 + j * 1120, y))
    y += max(t.height for t in th[i:i + 2]) + 20
small(allimg).save(os.path.join(DOCS, "compare_all.png"), optimize=True)
print("ok", len(outs))
