"""e2e_out の画面写真を、目で見る用に4枚ずつ並べる"""
import glob, os
from PIL import Image
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "e2e_out")
for d in ["375_light", "375_dark", "430_light", "430_dark"]:
    fs = sorted(glob.glob(os.path.join(OUT, d, "*.png")))
    ims = [Image.open(f) for f in fs]
    w, h = ims[0].size
    tw, th = w // 2, h // 2
    for part in range(0, len(ims), 8):
        sub = ims[part:part + 8]
        sheet = Image.new("RGB", (tw * 4 + 30, th * 2 + 10), (128, 128, 128))
        for i, im in enumerate(sub):
            sheet.paste(im.resize((tw, th)), ((i % 4) * (tw + 10), (i // 4) * (th + 10)))
        sheet.save(os.path.join(OUT, f"sheet_{d}_{part // 8}.png"))
