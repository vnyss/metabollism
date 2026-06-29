package com.toogood.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.net.http.SslError
import android.os.Build
import android.os.Bundle
import android.webkit.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    // ── Local dev: emulator uses 10.0.2.2 to reach your PC's localhost ──────────
    // For a real phone on the same Wi-Fi, replace with your PC's local IP, e.g.:
    //   private val APP_URL = "http://192.168.1.x:5000"
    // When you deploy to Railway later, replace with the Railway URL.
    private val APP_URL = "http://10.0.2.2:5000"
    // ──────────────────────────────────────────────────────────────────────────

    companion object {
        private const val FILE_CHOOSER_REQUEST = 1001
        private const val PERMISSIONS_REQUEST  = 1002
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true           // localStorage (calendar, coach history, settings)
            databaseEnabled   = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess   = true
            allowContentAccess = true
            setSupportMultipleWindows(true)
            mixedContentMode  = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            setGeolocationEnabled(true)        // weather on home page
        }

        webView.webChromeClient = object : WebChromeClient() {

            // Microphone (coach voice) + Camera (food AI photo)
            override fun onPermissionRequest(request: PermissionRequest?) {
                val toRequest = mutableListOf<String>()
                request?.resources?.forEach { res ->
                    when (res) {
                        PermissionRequest.RESOURCE_AUDIO_CAPTURE ->
                            if (!hasPermission(Manifest.permission.RECORD_AUDIO))
                                toRequest += Manifest.permission.RECORD_AUDIO

                        PermissionRequest.RESOURCE_VIDEO_CAPTURE ->
                            if (!hasPermission(Manifest.permission.CAMERA))
                                toRequest += Manifest.permission.CAMERA
                    }
                }
                if (toRequest.isEmpty()) {
                    request?.grant(request.resources)
                } else {
                    ActivityCompat.requestPermissions(
                        this@MainActivity, toRequest.toTypedArray(), PERMISSIONS_REQUEST
                    )
                    request?.deny()
                }
            }

            // Geolocation (weather feature on home page)
            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                if (hasPermission(Manifest.permission.ACCESS_FINE_LOCATION)) {
                    callback?.invoke(origin, true, false)
                } else {
                    ActivityCompat.requestPermissions(
                        this@MainActivity,
                        arrayOf(
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                        ),
                        PERMISSIONS_REQUEST
                    )
                    callback?.invoke(origin, false, false)
                }
            }

            // File chooser (food photo upload / camera capture for AI)
            override fun onShowFileChooser(
                webView: WebView?,
                callback: ValueCallback<Array<Uri>>?,
                params: FileChooserParams?
            ): Boolean {
                filePathCallback?.onReceiveValue(null)
                filePathCallback = callback

                val chooser = Intent(Intent.ACTION_CHOOSER).apply {
                    val gallery = params?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                        type = "image/*"
                    }
                    putExtra(Intent.EXTRA_INTENT, gallery)
                    putExtra(Intent.EXTRA_TITLE, "Choose Image")
                }

                return try {
                    @Suppress("DEPRECATION")
                    startActivityForResult(chooser, FILE_CHOOSER_REQUEST)
                    true
                } catch (e: Exception) {
                    filePathCallback = null
                    false
                }
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onReceivedSslError(
                view: WebView?, handler: SslErrorHandler?, error: SslError?
            ) {
                handler?.proceed()
            }

            // Show branded offline page if the server can't be reached
            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                if (request?.isForMainFrame == true) {
                    view?.loadData(offlinePage(), "text/html", "UTF-8")
                }
            }
        }

        webView.loadUrl(APP_URL)
    }

    // Handle file chooser result
    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == FILE_CHOOSER_REQUEST) {
            val result = if (resultCode == Activity.RESULT_OK && data != null) {
                data.dataString?.let { arrayOf(Uri.parse(it)) }
                    ?: FileChooserParams.parseResult(resultCode, data)
            } else null
            filePathCallback?.onReceiveValue(result)
            filePathCallback = null
        } else {
            @Suppress("DEPRECATION")
            super.onActivityResult(requestCode, resultCode, data)
        }
    }

    // After user grants location/mic/camera, reload the page to re-trigger the web request
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSIONS_REQUEST) {
            webView.reload()
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    private fun hasPermission(p: String) =
        ContextCompat.checkSelfPermission(this, p) == PackageManager.PERMISSION_GRANTED

    private fun offlinePage() = """
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              background: #0A0A0A; color: #C9A84C;
              font-family: -apple-system, sans-serif;
              display: flex; flex-direction: column;
              align-items: center; justify-content: center;
              height: 100vh; text-align: center; padding: 2rem;
            }
            svg { width: 64px; height: 64px; opacity: 0.5; margin-bottom: 1.5rem; }
            h2  { font-size: 1.3rem; margin-bottom: 0.5rem; }
            p   { color: #666; font-size: 0.9rem; line-height: 1.5; }
            button {
              margin-top: 2rem; padding: 0.75rem 2.5rem;
              background: #C9A84C; color: #0A0A0A;
              border: none; border-radius: 10px;
              font-size: 1rem; font-weight: 700; cursor: pointer;
            }
          </style>
        </head>
        <body>
          <svg viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1.5">
            <path d="M3 12a9 9 0 1 0 18 0A9 9 0 0 0 3 12z"/>
            <path d="M12 8v4m0 4h.01"/>
          </svg>
          <h2>No Connection</h2>
          <p>Connect to the internet and try again.</p>
          <button onclick="window.location.reload()">Retry</button>
        </body>
        </html>
    """.trimIndent()
}
