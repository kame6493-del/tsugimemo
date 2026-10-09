package jp.tsugimemo.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // ウィジェットとの橋(TsugiWidgetPlugin.kt)は、ブリッジができる前に登録する
        registerPlugin(TsugiWidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
