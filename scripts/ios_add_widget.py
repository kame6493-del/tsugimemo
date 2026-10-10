"""ios/App/App.xcodeproj にウィジェット拡張(TsugiWidget)を足す。python scripts/ios_add_widget.py
- npx cap add ios / cap sync の後に流す。もう入っていれば何もしない(何度流しても同じ)
- 足す物:
  App ターゲット: TsugiWidgetPlugin.swift / MainViewController.swift / Shared の2本、App.entitlements、拡張の埋め込み
  TsugiWidget ターゲット(app-extension, iOS 17): TsugiWidget.swift / TsugiLiveActivity.swift / Shared の2本
- ID は固定の24桁(7A5C で始まる)。Xcode が読める形(old-style plist)で、Capacitor の作った形をそのまま残して差し込む
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PBX = os.path.join(ROOT, "ios", "App", "App.xcodeproj", "project.pbxproj")

APP_TARGET = "504EC3031FED79650016851F"
APP_GROUP = "504EC3061FED79650016851F"
MAIN_GROUP = "504EC2FB1FED79650016851F"
PRODUCTS = "504EC3051FED79650016851F"
APP_SOURCES = "504EC3001FED79650016851F"
APP_CFG_DEBUG = "504EC3171FED79650016851F"
APP_CFG_RELEASE = "504EC3181FED79650016851F"
PROJECT = "504EC2FC1FED79650016851F"


def i(n):
    return f"7A5C0000000000000000{n:04X}"


# ファイル参照
F_PLUGIN, F_MAINVC, F_APPENT = i(1), i(2), i(3)
F_SHARED, F_DONE = i(4), i(5)
F_WIDGET, F_LIVE, F_WINFO, F_WENT = i(6), i(7), i(8), i(9)
F_APPEX = i(10)
# グループ
G_SHARED, G_WIDGET = i(20), i(21)
# ビルドファイル
B_PLUGIN, B_MAINVC, B_SHARED_APP, B_DONE_APP = i(30), i(31), i(32), i(33)
B_WIDGET, B_LIVE, B_SHARED_W, B_DONE_W = i(34), i(35), i(36), i(37)
B_APPEX = i(38)
# ターゲットと段
T_WIDGET = i(40)
P_W_SOURCES, P_W_FRAMEWORKS, P_W_RESOURCES = i(41), i(42), i(43)
P_EMBED = i(44)
CL_WIDGET, C_W_DEBUG, C_W_RELEASE = i(45), i(46), i(47)
PROXY, DEP = i(48), i(49)


def insert_section_items(s, section, text):
    """/* End <section> section */ の前に足す。節が無ければ作る"""
    end = f"/* End {section} section */"
    if end in s:
        return s.replace(end, text + end, 1)
    begin_anchor = "/* Begin PBXFrameworksBuildPhase section */"
    block = f"/* Begin {section} section */\n{text}/* End {section} section */\n\n"
    return s.replace(begin_anchor, block + begin_anchor, 1)


def add_to_list(s, owner_id, key, item):
    """owner_id のオブジェクトの key = ( ... ); に item を足す"""
    m = re.search(re.escape(owner_id) + r" (/\*.*?\*/ )?= \{", s)
    if not m:
        raise SystemExit(f"見つからない: {owner_id}")
    start = m.end()
    k = s.index(f"{key} = (", start)
    close = s.index(");", k)
    return s[:close] + f"\t{item},\n\t\t\t" + s[close:]


def set_setting(s, cfg_id, key, value):
    m = re.search(re.escape(cfg_id) + r" /\*.*?\*/ = \{", s)
    bs = s.index("buildSettings = {", m.end())
    end = s.index("\n\t\t\t};", bs)
    block = s[bs:end]
    line = f"\t\t\t\t{key} = {value};"
    pat = re.compile(r"\n\t\t\t\t" + re.escape(key) + r" = [^;]*;")
    if pat.search(block):
        block = pat.sub("\n" + line, block)
    else:
        block = block + "\n" + line
    return s[:bs] + block + s[end:]


def widget_settings(debug):
    return f"""				APPLICATION_EXTENSION_API_ONLY = YES;
				ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = "";
				CODE_SIGN_ENTITLEMENTS = TsugiWidget/TsugiWidget.entitlements;
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				INFOPLIST_FILE = TsugiWidget/Info.plist;
				IPHONEOS_DEPLOYMENT_TARGET = 17.0;
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/Frameworks",
					"@executable_path/../../Frameworks",
				);
				MARKETING_VERSION = 1.1.0;
				PRODUCT_BUNDLE_IDENTIFIER = jp.tsugimemo.app.widget;
				PRODUCT_NAME = "$(TARGET_NAME)";
				SKIP_INSTALL = YES;
				SWIFT_ACTIVE_COMPILATION_CONDITIONS = "{'DEBUG ' if debug else ''}WIDGET_EXTENSION";
				SWIFT_EMIT_LOC_STRINGS = YES;
				SWIFT_VERSION = 5.0;
				TARGETED_DEVICE_FAMILY = 1;
"""


def main():
    s = open(PBX, encoding="utf-8").read()
    if T_WIDGET in s:
        print("もう入っています")
        return

    s = insert_section_items(s, "PBXBuildFile", "".join([
        f"\t\t{B_PLUGIN} /* TsugiWidgetPlugin.swift in Sources */ = {{isa = PBXBuildFile; fileRef = {F_PLUGIN} /* TsugiWidgetPlugin.swift */; }};\n",
        f"\t\t{B_MAINVC} /* MainViewController.swift in Sources */ = {{isa = PBXBuildFile; fileRef = {F_MAINVC} /* MainViewController.swift */; }};\n",
        f"\t\t{B_SHARED_APP} /* TsugiShared.swift in Sources */ = {{isa = PBXBuildFile; fileRef = {F_SHARED} /* TsugiShared.swift */; }};\n",
        f"\t\t{B_DONE_APP} /* DoneIntent.swift in Sources */ = {{isa = PBXBuildFile; fileRef = {F_DONE} /* DoneIntent.swift */; }};\n",
        f"\t\t{B_WIDGET} /* TsugiWidget.swift in Sources */ = {{isa = PBXBuildFile; fileRef = {F_WIDGET} /* TsugiWidget.swift */; }};\n",
        f"\t\t{B_LIVE} /* TsugiLiveActivity.swift in Sources */ = {{isa = PBXBuildFile; fileRef = {F_LIVE} /* TsugiLiveActivity.swift */; }};\n",
        f"\t\t{B_SHARED_W} /* TsugiShared.swift in Sources */ = {{isa = PBXBuildFile; fileRef = {F_SHARED} /* TsugiShared.swift */; }};\n",
        f"\t\t{B_DONE_W} /* DoneIntent.swift in Sources */ = {{isa = PBXBuildFile; fileRef = {F_DONE} /* DoneIntent.swift */; }};\n",
        f"\t\t{B_APPEX} /* TsugiWidget.appex in Embed Foundation Extensions */ = {{isa = PBXBuildFile; fileRef = {F_APPEX} /* TsugiWidget.appex */; settings = {{ATTRIBUTES = (RemoveHeadersOnCopy, ); }}; }};\n",
    ]))

    s = insert_section_items(s, "PBXFileReference", "".join([
        f"\t\t{F_PLUGIN} /* TsugiWidgetPlugin.swift */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = TsugiWidgetPlugin.swift; sourceTree = \"<group>\"; }};\n",
        f"\t\t{F_MAINVC} /* MainViewController.swift */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = MainViewController.swift; sourceTree = \"<group>\"; }};\n",
        f"\t\t{F_APPENT} /* App.entitlements */ = {{isa = PBXFileReference; lastKnownFileType = text.plist.entitlements; path = App.entitlements; sourceTree = \"<group>\"; }};\n",
        f"\t\t{F_SHARED} /* TsugiShared.swift */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = TsugiShared.swift; sourceTree = \"<group>\"; }};\n",
        f"\t\t{F_DONE} /* DoneIntent.swift */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = DoneIntent.swift; sourceTree = \"<group>\"; }};\n",
        f"\t\t{F_WIDGET} /* TsugiWidget.swift */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = TsugiWidget.swift; sourceTree = \"<group>\"; }};\n",
        f"\t\t{F_LIVE} /* TsugiLiveActivity.swift */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = TsugiLiveActivity.swift; sourceTree = \"<group>\"; }};\n",
        f"\t\t{F_WINFO} /* Info.plist */ = {{isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = \"<group>\"; }};\n",
        f"\t\t{F_WENT} /* TsugiWidget.entitlements */ = {{isa = PBXFileReference; lastKnownFileType = text.plist.entitlements; path = TsugiWidget.entitlements; sourceTree = \"<group>\"; }};\n",
        f"\t\t{F_APPEX} /* TsugiWidget.appex */ = {{isa = PBXFileReference; explicitFileType = \"wrapper.app-extension\"; includeInIndex = 0; path = TsugiWidget.appex; sourceTree = BUILT_PRODUCTS_DIR; }};\n",
    ]))

    s = insert_section_items(s, "PBXFrameworksBuildPhase",
        f"\t\t{P_W_FRAMEWORKS} /* Frameworks */ = {{\n\t\t\tisa = PBXFrameworksBuildPhase;\n\t\t\tbuildActionMask = 2147483647;\n\t\t\tfiles = (\n\t\t\t);\n\t\t\trunOnlyForDeploymentPostprocessing = 0;\n\t\t}};\n")

    s = insert_section_items(s, "PBXCopyFilesBuildPhase",
        f"\t\t{P_EMBED} /* Embed Foundation Extensions */ = {{\n\t\t\tisa = PBXCopyFilesBuildPhase;\n\t\t\tbuildActionMask = 2147483647;\n\t\t\tdstPath = \"\";\n\t\t\tdstSubfolderSpec = 13;\n\t\t\tfiles = (\n\t\t\t\t{B_APPEX} /* TsugiWidget.appex in Embed Foundation Extensions */,\n\t\t\t);\n\t\t\tname = \"Embed Foundation Extensions\";\n\t\t\trunOnlyForDeploymentPostprocessing = 0;\n\t\t}};\n")

    s = insert_section_items(s, "PBXGroup", "".join([
        f"\t\t{G_SHARED} /* Shared */ = {{\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = (\n\t\t\t\t{F_SHARED} /* TsugiShared.swift */,\n\t\t\t\t{F_DONE} /* DoneIntent.swift */,\n\t\t\t);\n\t\t\tpath = Shared;\n\t\t\tsourceTree = \"<group>\";\n\t\t}};\n",
        f"\t\t{G_WIDGET} /* TsugiWidget */ = {{\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = (\n\t\t\t\t{F_WIDGET} /* TsugiWidget.swift */,\n\t\t\t\t{F_LIVE} /* TsugiLiveActivity.swift */,\n\t\t\t\t{F_WINFO} /* Info.plist */,\n\t\t\t\t{F_WENT} /* TsugiWidget.entitlements */,\n\t\t\t);\n\t\t\tpath = TsugiWidget;\n\t\t\tsourceTree = \"<group>\";\n\t\t}};\n",
    ]))
    s = add_to_list(s, MAIN_GROUP, "children", f"{G_SHARED} /* Shared */")
    s = add_to_list(s, MAIN_GROUP, "children", f"{G_WIDGET} /* TsugiWidget */")
    s = add_to_list(s, PRODUCTS, "children", f"{F_APPEX} /* TsugiWidget.appex */")
    s = add_to_list(s, APP_GROUP, "children", f"{F_PLUGIN} /* TsugiWidgetPlugin.swift */")
    s = add_to_list(s, APP_GROUP, "children", f"{F_MAINVC} /* MainViewController.swift */")
    s = add_to_list(s, APP_GROUP, "children", f"{F_APPENT} /* App.entitlements */")

    s = insert_section_items(s, "PBXNativeTarget",
        f"\t\t{T_WIDGET} /* TsugiWidget */ = {{\n\t\t\tisa = PBXNativeTarget;\n\t\t\tbuildConfigurationList = {CL_WIDGET} /* Build configuration list for PBXNativeTarget \"TsugiWidget\" */;\n\t\t\tbuildPhases = (\n\t\t\t\t{P_W_SOURCES} /* Sources */,\n\t\t\t\t{P_W_FRAMEWORKS} /* Frameworks */,\n\t\t\t\t{P_W_RESOURCES} /* Resources */,\n\t\t\t);\n\t\t\tbuildRules = (\n\t\t\t);\n\t\t\tdependencies = (\n\t\t\t);\n\t\t\tname = TsugiWidget;\n\t\t\tproductName = TsugiWidget;\n\t\t\tproductReference = {F_APPEX} /* TsugiWidget.appex */;\n\t\t\tproductType = \"com.apple.product-type.app-extension\";\n\t\t}};\n")
    s = add_to_list(s, APP_TARGET, "buildPhases", f"{P_EMBED} /* Embed Foundation Extensions */")
    s = add_to_list(s, APP_TARGET, "dependencies", f"{DEP} /* PBXTargetDependency */")
    s = add_to_list(s, PROJECT, "targets", f"{T_WIDGET} /* TsugiWidget */")
    s = s.replace(
        "\t\t\t\t\t504EC3031FED79650016851F = {\n",
        f"\t\t\t\t\t{T_WIDGET} = {{\n\t\t\t\t\t\tCreatedOnToolsVersion = 16.0;\n\t\t\t\t\t}};\n\t\t\t\t\t504EC3031FED79650016851F = {{\n", 1)

    s = insert_section_items(s, "PBXContainerItemProxy",
        f"\t\t{PROXY} /* PBXContainerItemProxy */ = {{\n\t\t\tisa = PBXContainerItemProxy;\n\t\t\tcontainerPortal = {PROJECT} /* Project object */;\n\t\t\tproxyType = 1;\n\t\t\tremoteGlobalIDString = {T_WIDGET};\n\t\t\tremoteInfo = TsugiWidget;\n\t\t}};\n")
    s = insert_section_items(s, "PBXTargetDependency",
        f"\t\t{DEP} /* PBXTargetDependency */ = {{\n\t\t\tisa = PBXTargetDependency;\n\t\t\ttarget = {T_WIDGET} /* TsugiWidget */;\n\t\t\ttargetProxy = {PROXY} /* PBXContainerItemProxy */;\n\t\t}};\n")

    s = insert_section_items(s, "PBXResourcesBuildPhase",
        f"\t\t{P_W_RESOURCES} /* Resources */ = {{\n\t\t\tisa = PBXResourcesBuildPhase;\n\t\t\tbuildActionMask = 2147483647;\n\t\t\tfiles = (\n\t\t\t);\n\t\t\trunOnlyForDeploymentPostprocessing = 0;\n\t\t}};\n")
    s = insert_section_items(s, "PBXSourcesBuildPhase",
        f"\t\t{P_W_SOURCES} /* Sources */ = {{\n\t\t\tisa = PBXSourcesBuildPhase;\n\t\t\tbuildActionMask = 2147483647;\n\t\t\tfiles = (\n"
        f"\t\t\t\t{B_WIDGET} /* TsugiWidget.swift in Sources */,\n\t\t\t\t{B_LIVE} /* TsugiLiveActivity.swift in Sources */,\n"
        f"\t\t\t\t{B_SHARED_W} /* TsugiShared.swift in Sources */,\n\t\t\t\t{B_DONE_W} /* DoneIntent.swift in Sources */,\n"
        f"\t\t\t);\n\t\t\trunOnlyForDeploymentPostprocessing = 0;\n\t\t}};\n")
    for b, name in [(B_PLUGIN, "TsugiWidgetPlugin.swift"), (B_MAINVC, "MainViewController.swift"), (B_SHARED_APP, "TsugiShared.swift"), (B_DONE_APP, "DoneIntent.swift")]:
        s = add_to_list(s, APP_SOURCES, "files", f"{b} /* {name} in Sources */")

    s = insert_section_items(s, "XCBuildConfiguration",
        f"\t\t{C_W_DEBUG} /* Debug */ = {{\n\t\t\tisa = XCBuildConfiguration;\n\t\t\tbuildSettings = {{\n{widget_settings(True)}\t\t\t}};\n\t\t\tname = Debug;\n\t\t}};\n"
        f"\t\t{C_W_RELEASE} /* Release */ = {{\n\t\t\tisa = XCBuildConfiguration;\n\t\t\tbuildSettings = {{\n{widget_settings(False)}\t\t\t}};\n\t\t\tname = Release;\n\t\t}};\n")
    s = insert_section_items(s, "XCConfigurationList",
        f"\t\t{CL_WIDGET} /* Build configuration list for PBXNativeTarget \"TsugiWidget\" */ = {{\n\t\t\tisa = XCConfigurationList;\n\t\t\tbuildConfigurations = (\n\t\t\t\t{C_W_DEBUG} /* Debug */,\n\t\t\t\t{C_W_RELEASE} /* Release */,\n\t\t\t);\n\t\t\tdefaultConfigurationIsVisible = 0;\n\t\t\tdefaultConfigurationName = Release;\n\t\t}};\n")

    # App ターゲット: App Group の権限、iOS 17 以降、iPhone だけ、版 1.1.0
    for cfg in (APP_CFG_DEBUG, APP_CFG_RELEASE):
        s = set_setting(s, cfg, "CODE_SIGN_ENTITLEMENTS", "App/App.entitlements")
        s = set_setting(s, cfg, "IPHONEOS_DEPLOYMENT_TARGET", "17.0")
        s = set_setting(s, cfg, "MARKETING_VERSION", "1.1.0")
        s = set_setting(s, cfg, "TARGETED_DEVICE_FAMILY", "1")
    for cfg in ("504EC3141FED79650016851F", "504EC3151FED79650016851F"):
        s = set_setting(s, cfg, "IPHONEOS_DEPLOYMENT_TARGET", "17.0")

    open(PBX, "w", encoding="utf-8", newline="\n").write(s)
    print("ウィジェット拡張を足しました")


if __name__ == "__main__":
    sys.exit(main())
