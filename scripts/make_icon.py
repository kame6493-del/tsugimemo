"""ツギメモのアイコン(1.1.0〜)。python scripts/make_icon.py
元の絵は持ち主が ChatGPT で作った物(Downloads/tsugimemo_ref_A2_1254x1254.png)。余白を切った正方形
store/src/icon_source_1024.png(ピンで留めた生成りの紙に線3本と青い丸)を使う。
- 元の絵には角の丸い板と、その縁がある。OS が自分で角を丸めるので、縁は消して地の色で四隅まで埋める(全面)
- Android の適応アイコン: 前景はこの絵(紙と影だけを残し外は透明)、背景は地の色1色。紙とピンの端が
  安全域(直径 66dp/108dp の円)に収まる大きさにする。丸アイコンも作る
出す物: store/icon_1024.png・store/play/icon_512.png・iOS AppIcon・Android mipmap 一式と背景色・favicon・
public/img/app_icon.png(アプリの中で出すアイコン)・docs/icon_check.png(安全域の確かめ)
"""
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "store", "src", "icon_source_1024.png")
src = Image.open(SRC).convert("RGB")
assert src.size == (1024, 1024)

BG = (241, 238, 231)  # 元の絵の板の色(中心から600〜640px の輪の中央値)
BG_HEX = "#F1EEE7"
PAPER_R = 520  # 紙とピンが入る半径(元の絵で、地との差が30を超える点の最も遠い所は 511px)


def soft_mask(size, fn):
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    return np.clip(fn(xx, yy), 0, 1)


def rounded_rect_alpha(size, inset, radius, feather):
    """内側に inset 下がった角丸四角の中を1、ふち feather でなめらかに0"""
    lo, hi = inset + radius, size - 1 - inset - radius

    def f(x, y):
        dx = np.maximum(np.maximum(lo - x, x - hi), 0)
        dy = np.maximum(np.maximum(lo - y, y - hi), 0)
        dist = np.hypot(dx, dy) - radius  # 角丸四角のふちからの距離(内側が負)
        return 0.5 - dist / feather
    return soft_mask(size, f)


def full_bleed():
    """縁の板を消し、四隅まで地の色の正方形(iOS・ストア用)"""
    a = rounded_rect_alpha(1024, 46, 150, 40)[..., None]
    out = np.array(src).astype(np.float32) * a + np.array(BG, np.float32) * (1 - a)
    return Image.fromarray(out.astype(np.uint8))


def foreground_layer(px):
    """適応アイコンの前景(108dp 四方を px ピクセルで)。紙と影を残して外は透明"""
    scale = (px * 0.30) / PAPER_R          # 紙の半径を層の30%に(安全域は30.6%)
    w = round(1024 * scale)
    a = soft_mask(1024, lambda x, y: (640 - np.hypot(x - 511.5, y - 511.5)) / 80)
    rgba = np.dstack([np.array(src), (a * 255).astype(np.uint8)])
    art = Image.fromarray(rgba).resize((w, w), Image.LANCZOS)
    layer = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    layer.alpha_composite(art, ((px - w) // 2, (px - w) // 2))
    return layer


def adaptive_preview(px, shape):
    """端末が切り抜いた時の見え方(確かめ用)。shape: circle / squircle"""
    layer = Image.new("RGBA", (px, px), BG + (255,))
    layer.alpha_composite(foreground_layer(px))
    # 見える所は層の中央 72/108
    v = round(px * 72 / 108)
    o = (px - v) // 2
    vis = layer.crop((o, o, o + v, o + v))
    m = Image.new("L", (v, v), 0)
    d = ImageDraw.Draw(m)
    if shape == "circle":
        d.ellipse((0, 0, v - 1, v - 1), fill=255)
    else:
        d.rounded_rectangle((0, 0, v - 1, v - 1), radius=round(v * 0.3), fill=255)
    out = Image.new("RGBA", (v, v), (0, 0, 0, 0))
    out.paste(vis, (0, 0), m)
    return out


def legacy(px, round_):
    """API 25 以前の四角・丸アイコン"""
    big = 432
    layer = Image.new("RGBA", (big, big), BG + (255,))
    fg = foreground_layer(round(big * 108 / 72))
    o = (fg.width - big) // 2
    layer.alpha_composite(fg.crop((o, o, o + big, o + big)))
    m = Image.new("L", (big, big), 0)
    d = ImageDraw.Draw(m)
    if round_:
        d.ellipse((0, 0, big - 1, big - 1), fill=255)
    else:
        d.rounded_rectangle((0, 0, big - 1, big - 1), radius=60, fill=255)
    out = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    out.paste(layer, (0, 0), m)
    return out.resize((px, px), Image.LANCZOS)


def save(img, *parts):
    p = os.path.join(ROOT, *parts)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    img.save(p)
    return p


full = full_bleed()
save(full, "store", "icon_1024.png")
save(full.resize((512, 512), Image.LANCZOS), "store", "play", "icon_512.png")
save(full, "ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset", "AppIcon-512@2x.png")

# アプリの中のアイコン(角丸・外は透明)
app = full.resize((256, 256), Image.LANCZOS).convert("RGBA")
m = Image.new("L", (256, 256), 0)
ImageDraw.Draw(m).rounded_rectangle((0, 0, 255, 255), radius=58, fill=255)
app.putalpha(m)
save(app, "public", "img", "app_icon.png")
save(app.resize((64, 64), Image.LANCZOS), "public", "favicon.png")

RES = os.path.join("android", "app", "src", "main", "res")
for dpi, k in [("mdpi", 1), ("hdpi", 1.5), ("xhdpi", 2), ("xxhdpi", 3), ("xxxhdpi", 4)]:
    save(foreground_layer(round(108 * k)), RES, f"mipmap-{dpi}", "ic_launcher_foreground.png")
    save(legacy(round(48 * k), False), RES, f"mipmap-{dpi}", "ic_launcher.png")
    save(legacy(round(48 * k), True), RES, f"mipmap-{dpi}", "ic_launcher_round.png")

with open(os.path.join(ROOT, RES, "values", "ic_launcher_background.xml"), "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">%s</color>\n</resources>\n' % BG_HEX)

# 確かめ用: 前景に安全域の円を重ねた物と、丸・角丸で切り抜いた見え方
px = 432
chk = Image.new("RGBA", (px * 4 + 60, px + 40), (40, 40, 44, 255))
lay = Image.new("RGBA", (px, px), BG + (255,))
lay.alpha_composite(foreground_layer(px))
d = ImageDraw.Draw(lay)
r = px * 33 / 108
d.ellipse((px / 2 - r, px / 2 - r, px / 2 + r, px / 2 + r), outline=(220, 40, 40, 255), width=3)
chk.alpha_composite(lay, (10, 20))
chk.alpha_composite(adaptive_preview(px, "circle").resize((px, px)), (px + 25, 20))
chk.alpha_composite(adaptive_preview(px, "squircle").resize((px, px)), (2 * px + 40, 20))
chk.alpha_composite(full.resize((px, px)).convert("RGBA"), (3 * px + 55, 20))
save(chk, "docs", "icon_check.png")
print("ok")

# 起動画面(Capacitor の既定の絵を替える): 生成りの地のまん中に、アイコンの紙の札
SPLASH_BG = BG  # アイコンの板の色と同じにして、継ぎ目を出さない
def splash(w, h):
    img = Image.new("RGB", (w, h), SPLASH_BG)
    side = round(min(w, h) * 0.34)
    fg = foreground_layer(round(side * 1733 / 1024 * 0.95))
    # 前景の層は紙のまわりに余白がある。紙の大きさが side 程度になるよう層ごと置く
    img.paste(Image.new("RGB", fg.size, SPLASH_BG), ((w - fg.width) // 2, (h - fg.height) // 2))
    base = img.convert("RGBA")
    base.alpha_composite(fg, ((w - fg.width) // 2, (h - fg.height) // 2))
    # 前景の外側は板の色で縁取られているので、地の色に戻す(ふちは柔らかく)
    return base.convert("RGB")

RESD = os.path.join(ROOT, RES)
for d in os.listdir(RESD):
    p = os.path.join(RESD, d, "splash.png")
    if d.startswith("drawable") and os.path.exists(p):
        w, h = Image.open(p).size
        splash(w, h).save(p)
SP = os.path.join(ROOT, "ios", "App", "App", "Assets.xcassets", "Splash.imageset")
for f in os.listdir(SP):
    if f.endswith(".png"):
        splash(2732, 2732).save(os.path.join(SP, f))
print("splash ok")
