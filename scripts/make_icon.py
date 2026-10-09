"""ツギメモのアイコン(ドット絵 24x24 を手で配色)。python scripts/make_icon.py
朱の地に生成りの付箋。いちばん上の行だけ朱の丸と太い墨の線(=いまの1行)、下に細い2行(=つぎ)。
出す物: store/icon_1024.png(App Store)・store/play/icon_512.png・Android の mipmap 一式・favicon・ウィジェットの見本画像。
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 1文字 = 1マス。手で並べた。
#  . 朱の地   s 朱の影   P 生成りの紙   p 紙の影(下と右の縁)   R 朱の丸   I 墨(いま)   i 薄い墨(つぎ)
GRID = [
    "........................",
    "........................",
    "........................",
    "....PPPPPPPPPPPPPPPP....",
    "...PPPPPPPPPPPPPPPPPP...",
    "...PPPPRRRRPPPPPPPPPP...",
    "...PPPRRRRRRPPPPPPPPP...",
    "...PPRRRPPRRRPPPPPPPP...",
    "...PPRRPPPPRRPIIIIIPP...",
    "...PPRRPPPPRRPIIIIIPP...",
    "...PPRRRPPRRRPPPPPPPP...",
    "...PPPRRRRRRPPPPPPPPP...",
    "...PPPPRRRRPPPPPPPPPP...",
    "...PPPPPPPPPPPPPPPPPP...",
    "...PPPPPPPPPPPPPPPPPP...",
    "...PPiiiiiiiiiiiiiPPP...",
    "...PPPPPPPPPPPPPPPPPP...",
    "...PPPPPPPPPPPPPPPPPP...",
    "...PPiiiiiiiiiPPPPPPP...",
    "...PPPPPPPPPPPPPPPPPP...",
    "....pppppppppppppppp....",
    ".....ssssssssssssss.....",
    "........................",
    "........................",
]

COL = {
    ".": (196, 63, 40),
    "s": (163, 49, 31),
    "P": (247, 241, 228),
    "p": (226, 214, 192),
    "R": (196, 63, 40),
    "I": (31, 29, 26),
    "i": (140, 132, 120),
}


def render(px, transparent_bg=False, pad=0):
    n = len(GRID)
    assert all(len(r) == n for r in GRID), "マスの数がそろっていない"
    cell = px // (n + pad * 2)
    size = cell * (n + pad * 2)
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0) if transparent_bg else COL["."] + (255,))
    for y, row in enumerate(GRID):
        for x, ch in enumerate(row):
            if transparent_bg and ch in ".s":
                continue
            c = COL[ch] + (255,)
            for dy in range(cell):
                for dx in range(cell):
                    img.putpixel(((x + pad) * cell + dx, (y + pad) * cell + dy), c)
    return img.resize((px, px), Image.NEAREST)


def save(img, path, rgb=False):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    (img.convert("RGB") if rgb else img).save(path)


def main():
    big = render(1200).resize((1024, 1024), Image.NEAREST)
    save(big, os.path.join(ROOT, "store", "icon_1024.png"), rgb=True)
    save(big.resize((512, 512), Image.NEAREST), os.path.join(ROOT, "store", "play", "icon_512.png"), rgb=True)
    save(big.resize((64, 64), Image.LANCZOS), os.path.join(ROOT, "public", "favicon.png"))
    # 確認用: 小さく表示した時(ホーム画面 60px・設定 29px 相当)
    prev = Image.new("RGB", (60 + 29 + 40 + 20, 80), (240, 240, 240))
    prev.paste(big.resize((60, 60), Image.LANCZOS), (10, 10))
    prev.paste(big.resize((40, 40), Image.LANCZOS), (80, 20))
    prev.paste(big.resize((29, 29), Image.LANCZOS), (130, 25))
    save(prev.resize((prev.width * 4, prev.height * 4), Image.NEAREST), os.path.join(ROOT, "scripts", "e2e_out", "icon_small_check.png"))

    # Android: 普通のアイコンと丸いアイコン、アダプティブ(前景は透明地+余白、地は朱)
    res = os.path.join(ROOT, "android", "app", "src", "main", "res")
    sizes = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
    fg_sizes = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}
    for k, s in sizes.items():
        d = os.path.join(res, f"mipmap-{k}")
        save(big.resize((s, s), Image.LANCZOS), os.path.join(d, "ic_launcher.png"))
        save(big.resize((s, s), Image.LANCZOS), os.path.join(d, "ic_launcher_round.png"))
        # アダプティブの前景: 108dp のうち中の 72dp に絵(マスの余白 6 = 24マスを36マスの中央へ)
        fg = render(fg_sizes[k] * 4, transparent_bg=True, pad=6).resize((fg_sizes[k], fg_sizes[k]), Image.NEAREST)
        save(fg, os.path.join(d, "ic_launcher_foreground.png"))
    with open(os.path.join(res, "values", "ic_launcher_background.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#C43F28</color>\n</resources>\n')

    # iOS の AppIcon(1024 1枚。透明なし)
    ios = os.path.join(ROOT, "ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset")
    if os.path.isdir(ios):
        for f in os.listdir(ios):
            if f.endswith(".png"):
                os.remove(os.path.join(ios, f))
        save(big, os.path.join(ios, "AppIcon-512@2x.png"), rgb=True)
    print("ok")


if __name__ == "__main__":
    main()


def widget_preview():
    """Android のウィジェットを選ぶ画面の見本(古い Android 用の画像)"""
    from PIL import ImageDraw, ImageFont
    W, H = 720, 400
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, W - 1, H - 1), radius=40, fill=(244, 239, 228, 255))
    bold = ImageFont.truetype("C:/Windows/Fonts/YuGothB.ttc", 40)
    reg = ImageFont.truetype("C:/Windows/Fonts/YuGothM.ttc", 28)
    ink = (34, 32, 28, 255)
    sub = (34, 32, 28, 170)
    d.text((32, 26), "いま", font=reg, fill=sub)
    d.text((W - 32, 26), "のこり 3", font=reg, fill=sub, anchor="ra")
    d.ellipse((36, 110, 84, 158), outline=(200, 64, 42, 255), width=6)
    d.text((104, 108), "牛乳を買って帰る", font=bold, fill=ink)
    d.text((104, 200), "つぎ  歯医者に電話", font=reg, fill=sub)
    d.text((104, 250), "つぎ  図書館の本を返す", font=reg, fill=sub)
    out = os.path.join(ROOT, "android", "app", "src", "main", "res", "drawable-nodpi", "widget_preview.png")
    save(img, out)


widget_preview()
