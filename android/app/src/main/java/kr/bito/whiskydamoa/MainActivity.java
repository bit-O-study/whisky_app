package kr.bito.whiskydamoa;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.ProgressBar;
import android.widget.Toast;

public final class MainActivity extends Activity {
    private static final String ORIGIN = "https://whisky-app-vert.vercel.app";
    private WebView web;
    private LinearLayout startupLoading;
    private final Runnable showBuffering = () -> startupLoading.setVisibility(View.VISIBLE);
    private AlertDialog connectionError;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(android.graphics.Color.WHITE);
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            if (android.os.Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets edges = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.ime() | WindowInsets.Type.displayCutout());
                view.setPadding(edges.left, edges.top, edges.right, edges.bottom);
            } else view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets;
        });
        setContentView(root);
        web = new WebView(this);
        FrameLayout content = new FrameLayout(this);
        root.addView(content, new LinearLayout.LayoutParams(-1, 0, 1));
        content.addView(web, new FrameLayout.LayoutParams(-1, -1));
        startupLoading = new LinearLayout(this);
        startupLoading.setOrientation(LinearLayout.VERTICAL);
        startupLoading.setGravity(android.view.Gravity.CENTER);
        startupLoading.setBackgroundColor(android.graphics.Color.argb(230, 255, 255, 255));
        startupLoading.setPadding(dp(24), dp(24), dp(24), dp(24));
        startupLoading.setClickable(true);
        startupLoading.setVisibility(View.GONE);
        ProgressBar spinner = new ProgressBar(this);
        spinner.setIndeterminateTintList(android.content.res.ColorStateList.valueOf(android.graphics.Color.rgb(7, 85, 245)));
        startupLoading.addView(spinner, new LinearLayout.LayoutParams(dp(36), dp(36)));
        TextView message = new TextView(this);
        message.setText(R.string.startup_loading);
        message.setTextSize(14);
        message.setTextColor(android.graphics.Color.rgb(91, 105, 131));
        message.setPadding(0, dp(16), 0, 0);
        message.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE);
        startupLoading.addView(message);
        content.addView(startupLoading, new FrameLayout.LayoutParams(-1, -1));
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        // target=_blank links use this WebView's navigation policy, which opens external HTTPS URLs in the browser.
        settings.setSupportMultipleWindows(false);
        web.setWebViewClient(new WebViewClient() {
            @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                startupLoading.removeCallbacks(showBuffering);
                startupLoading.postDelayed(showBuffering, 180);
            }
            @Override public void onPageCommitVisible(WebView view, String url) { finishStartupLoading(); }
            @Override public void onPageFinished(WebView view, String url) { finishStartupLoading(); }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) return false;
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && Uri.parse(ORIGIN).getHost().equals(uri.getHost()) && (uri.getPort() == -1 || uri.getPort() == 443)) return false;
                if ("https".equals(uri.getScheme()) || "http".equals(uri.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                    catch (android.content.ActivityNotFoundException ignored) { Toast.makeText(MainActivity.this, "링크를 열 브라우저가 없습니다.", Toast.LENGTH_SHORT).show(); }
                }
                return true;
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) showConnectionError();
            }
            @Override public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
                if (request.isForMainFrame() && response.getStatusCode() >= 500) showConnectionError();
            }
        });
        if (android.os.Build.VERSION.SDK_INT >= 33) getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::goBack);
        if (state == null || web.restoreState(state) == null) web.loadUrl(ORIGIN);
    }
    private void showConnectionError() {
        if (isFinishing() || isDestroyed() || (connectionError != null && connectionError.isShowing())) return;
        finishStartupLoading();
        connectionError = new AlertDialog.Builder(this).setTitle("연결을 확인해주세요")
            .setMessage("위스키다모아에 연결하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해주세요.")
            .setPositiveButton("다시 시도", (dialog, which) -> web.loadUrl(ORIGIN)).setNegativeButton("닫기", null).show();
    }
    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    private void finishStartupLoading() {
        startupLoading.removeCallbacks(showBuffering);
        startupLoading.setVisibility(View.GONE);
    }
    private void goBack() { if (web != null && web.canGoBack()) web.goBack(); else finish(); }
    // API 33+ uses the platform OnBackInvokedDispatcher registered in onCreate.
    // This override only serves older Android versions.
    @android.annotation.SuppressLint("GestureBackNavigation")
    @Override public void onBackPressed() { goBack(); }
    @Override protected void onSaveInstanceState(Bundle state) { web.saveState(state); super.onSaveInstanceState(state); }
    @Override protected void onPause() { web.onPause(); CookieManager.getInstance().flush(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
    @Override protected void onDestroy() { if (startupLoading != null) startupLoading.removeCallbacks(showBuffering); if (connectionError != null) connectionError.dismiss(); if (web != null) web.destroy(); super.onDestroy(); }
}
