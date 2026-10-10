"""持ち主の見本(ChatGPT で作った絵)から、アプリで使う絵を切り出す。python scripts/cut_assets.py
持ち主の方針: 見本の絵は切り出してそのまま使ってよい。新しく描くのは見本に無い物だけ。
- 見本: Downloads/tsugimemo_ref_A1_1122x1402.png と Downloads/ChatGPT 画像 2026年10月10日 12_10_*.png(8枚)
- 出す物: public/img/ の下(アプリの中で使う)
文字が焼き込まれた所(時刻・札の文)は OpenCV の inpaint で消し、上にアプリの文字を重ねる。
"""
import glob
import os

import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DL = os.path.dirname(os.path.dirname(ROOT))
OUT = os.path.join(ROOT, "public", "img")
os.makedirs(OUT, exist_ok=True)

A1 = Image.open(os.path.join(DL, "tsugimemo_ref_A1_1122x1402.png")).convert("RGB")
REFS = [Image.open(f).convert("RGB") for f in sorted(glob.glob(os.path.join(DL, "ChatGPT 画像 2026年10月10日 12_10_*.png")))]
assert len(REFS) == 8, len(REFS)


def inpaint(img: Image.Image, boxes, r=7):
    """boxes の四角(img の座標)を周りの色で埋める"""
    a = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    m = np.zeros(a.shape[:2], np.uint8)
    for (x0, y0, x1, y1) in boxes:
        m[y0:y1, x0:x1] = 255
    b = cv2.inpaint(a, m, r, cv2.INPAINT_TELEA)
    # 埋めた所の筋を消す: ぼかした物を、ふちをぼかした型で重ねる(もやのように見える)
    soft = cv2.GaussianBlur(b, (0, 0), 14)
    mf = cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), 6)[..., None]
    b = (b * (1 - mf) + soft * mf).astype(np.uint8)
    return Image.fromarray(cv2.cvtColor(b, cv2.COLOR_BGR2RGB))


def up(img: Image.Image, k: float):
    w, h = img.size
    out = img.resize((round(w * k), round(h * k)), Image.LANCZOS)
    return out.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))


def cutout(img: Image.Image, tol=9, feather=1.2):
    """縁につながった地の色を透明にする(紙の札・色見本・葉を地から抜く)。紙の中は地と近い色でも残る"""
    a = np.array(img).astype(np.int16)
    edge = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bg = np.median(edge, axis=0)
    d = np.abs(a - bg).max(axis=2)
    near = (d < tol).astype(np.uint8)
    n, lab = cv2.connectedComponents(near, connectivity=4)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bgmask = np.isin(lab, list(border))
    al = np.where(bgmask, np.clip((d - 3) / 14, 0, 1), 1).astype(np.float32)
    al = cv2.GaussianBlur(al, (0, 0), feather)
    rgba = np.dstack([np.array(img), (np.clip(al, 0, 1) * 255).astype(np.uint8)])
    return Image.fromarray(rgba)


def matte(img: Image.Image, bg=None, lo=6, hi=26):
    """地の色との差で透明にする(紙の札・色見本を地から抜く)。差が lo 以下は透明、hi 以上は不透明"""
    a = np.array(img).astype(np.int16)
    if bg is None:
        edge = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
        bg = np.median(edge, axis=0)
    d = np.abs(a - np.array(bg)).max(axis=2).astype(np.float32)
    al = np.clip((d - lo) / (hi - lo), 0, 1)
    # 影の弱い所も少し残す
    al = cv2.GaussianBlur(al, (3, 3), 0)
    rgba = np.dstack([np.array(img), (al * 255).astype(np.uint8)])
    return Image.fromarray(rgba)


# 1. iPhone のロック画面(見本 A1 ②)。時刻・日付・懐中電灯とカメラは見本のまま、札の所はアプリが重ねるので消しておく
lock = A1.crop((440, 282, 742, 836))  # 302 x 554
card = (2, 194, 300, 352)            # 札(lock の座標)
lock_ios = inpaint(lock, [card])
up(lock_ios, 2).save(os.path.join(OUT, "lock_ios.jpg"), quality=88)

# 2. 文字の無い空(Android のロック画面・最初の説明・ウィジェットの置き場)。時刻・札・書き込み・ボタンも消す
#    見本7(はじめての流れ)の1枚目は中ほどが白いもやなので、文字を消してもきれいに埋まる
welcome = REFS[6].crop((40, 353, 272, 800))  # 232 x 447
sky = inpaint(welcome, [(58, 40, 182, 148), (58, 150, 178, 184), (22, 193, 225, 218), (18, 243, 222, 382)], r=11)
up(sky, 2.6).save(os.path.join(OUT, "sky.jpg"), quality=86)

# 3. 「ここをタップで完了!」の書き込み(札の右下)。iPhone の見本に、そのまま見本の位置で残っている


# 5. 紙の色見本6枚(見本 A1 デザインシステム)
SW = {
    "milk": (224, 1128, 296, 1196),
    "lemon": (301, 1128, 374, 1196),
    "soda": (379, 1126, 452, 1196),
    "sakura": (224, 1232, 296, 1302),
    "mint": (301, 1232, 374, 1302),
    "gray": (379, 1232, 452, 1302),
}
for k, box in SW.items():
    up(cutout(A1.crop(box)), 2).save(os.path.join(OUT, f"paper_{k}.png"))

# 6. ピンで留めた紙の札(見本の左上のロゴ)。最初の説明・空の時・設定で使う
logo = A1.crop((26, 14, 196, 156))
up(cutout(logo), 2).save(os.path.join(OUT, "logo_paper.png"))

# 7. 「ツギメモ」の手書き風の題字(黄色い下線つき)。最初の説明で使う
title = A1.crop((208, 22, 492, 146))
up(matte(title, lo=6, hi=30), 2).save(os.path.join(OUT, "title.png"))

# 8. 葉っぱ(見本5 のちがいの表の右)。飾り
leaf = REFS[4].crop((535, 1125, 607, 1228))
up(cutout(leaf, tol=24), 2).save(os.path.join(OUT, "leaf.png"))

# 確認用に並べる
print("ok", os.listdir(OUT))
