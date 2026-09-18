package io.github.snakeesc.escapethesnake;

import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.DisplayCutout;
import android.os.Build;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    hideSystemBars();
    bridge.getWebView().getViewTreeObserver().addOnGlobalLayoutListener(this::publishCutout);
    bridge.getWebView().postDelayed(() -> { lastInsets = ""; publishCutout(); }, 1000);
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) hideSystemBars();
  }

  private String lastInsets = "";

  private void publishCutout() {
    if (Build.VERSION.SDK_INT < 28 || bridge == null) return;
    View web = bridge.getWebView();
    WindowInsets insets = web.getRootWindowInsets();
    if (insets == null) return;
    DisplayCutout cutout = insets.getDisplayCutout();
    int[] location = new int[2];
    web.getLocationOnScreen(location);
    float density = getResources().getDisplayMetrics().density;
    int screenWidth = getWindow().getDecorView().getRootView().getWidth();
    float top = cutout == null ? 0 : Math.max(0, cutout.getSafeInsetTop() - location[1]) / density;
    float left = cutout == null ? 0 : Math.max(0, cutout.getSafeInsetLeft() - location[0]) / density;
    float right = cutout == null ? 0 : Math.max(0, cutout.getSafeInsetRight() - (screenWidth - location[0] - web.getWidth())) / density;
    String json = "{\"top\":" + top + ",\"left\":" + left + ",\"right\":" + right + "}";
    if (json.equals(lastInsets)) return;
    lastInsets = json;
    bridge.getWebView().evaluateJavascript("window.escapeSnakeInsets=" + json + ";window.dispatchEvent(new Event('escape-snake-insets'));", null);
  }

  private void hideSystemBars() {
    // targetSdk 36 (Android 15+) enforces edge-to-edge and increasingly ignores the
    // legacy View.SYSTEM_UI_FLAG_* fullscreen flags, which left a status-bar-sized gap
    // at the top on newer devices. WindowInsetsControllerCompat is the modern
    // replacement and reliably hides the system bars across all supported versions.
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    WindowInsetsControllerCompat controller =
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
    controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    controller.hide(WindowInsetsCompat.Type.systemBars());
  }
}
