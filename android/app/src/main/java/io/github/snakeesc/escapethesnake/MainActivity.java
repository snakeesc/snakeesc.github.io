package io.github.snakeesc.escapethesnake;

import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.DisplayCutout;
import android.os.Build;
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
    View decorView = getWindow().getDecorView();
    decorView.setSystemUiVisibility(
        View.SYSTEM_UI_FLAG_LAYOUT_STABLE
      | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
      | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
      | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
      | View.SYSTEM_UI_FLAG_FULLSCREEN
      | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
    );
  }
}
