package ke.ac.umma.graduanttracer;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.graphics.Color;
import android.widget.Toast;

public class MainActivity extends Activity {
    // Replace with your live public HTTPS URL when deploying online (e.g., https://umma-graduant-tracer.onrender.com)
    private static final String PRODUCTION_URL = "https://umma-graduant-tracer.onrender.com";
    private static final String LOCAL_DEV_URL = "http://localhost:5173";
    
    // Set START_URL to PRODUCTION_URL for remote friends or PRODUCTION builds
    private static final String START_URL = PRODUCTION_URL;
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(16, 27, 61));
        getWindow().setNavigationBarColor(Color.rgb(16, 27, 61));
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(244, 246, 250));
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        setContentView(webView);
        webView.loadUrl(START_URL);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
}
