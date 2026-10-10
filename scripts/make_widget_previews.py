"""ウィジェットの見え方を書き出す。python scripts/make_widget_previews.py
store/mock/widgets.html(端末のコードと同じ寸法・色・文で描いた物)を撮り、
docs/widgets_ios.png・docs/widgets_android.png と、Android のウィジェット選びの見本 drawable-nodpi/widget_preview.png を作る。"""
import os
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = "file:///" + os.path.join(ROOT, "store", "mock", "widgets.html").replace("\\", "/")
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1280, "height": 900}, device_scale_factor=1)
    pg.goto(URL)
    pg.wait_for_timeout(500)
    pg.locator("#ios").screenshot(path=os.path.join(ROOT, "docs", "widgets_ios.png"))
    pg.locator("#android").screenshot(path=os.path.join(ROOT, "docs", "widgets_android.png"))
    pg.evaluate("document.body.style.background = 'transparent'")
    pg.locator("#android-preview").screenshot(path=os.path.join(ROOT, "android", "app", "src", "main", "res", "drawable-nodpi", "widget_preview.png"), omit_background=True)
    b.close()
print("ok")
