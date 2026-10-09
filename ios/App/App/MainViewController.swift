import Capacitor
import UIKit

/// Capacitor の画面に、アプリの中だけにある橋(TsugiWidgetPlugin)を登録する
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(TsugiWidgetPlugin())
    }
}
