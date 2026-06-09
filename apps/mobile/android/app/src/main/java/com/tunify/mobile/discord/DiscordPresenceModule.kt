package com.tunify.mobile.discord

import android.net.Uri
import android.util.Log
import com.discord.socialsdk.AuthenticationClientCallback
import com.discord.socialsdk.DiscordSocialSdkInit
import com.discord.socialsdk.NativeCalls
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import org.json.JSONObject

class DiscordPresenceModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  private var applicationId: String? = null
  private var pendingLoginPromise: Promise? = null
  private var pendingCodeVerifier: String? = null
  private var pendingRedirectUri: String? = null

  override fun getName(): String = "DiscordPresenceNative"

  @ReactMethod
  fun `init`(applicationId: String, promise: Promise) {
    if (!ensureNativeAvailable(promise)) {
      return
    }

    try {
      this.applicationId = applicationId
      setDiscordEngineActivity()
      promise.resolve(nativeInit(applicationId))
    } catch (error: Throwable) {
      Log.e(TAG, "init failed", error)
      promise.reject("DISCORD_INIT_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun login(applicationId: String, redirectUri: String, scopes: String, promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("DISCORD_ACTIVITY_MISSING", "Discord login requires a foreground Android activity.")
      return
    }

    if (pendingLoginPromise != null) {
      promise.reject("DISCORD_LOGIN_PENDING", "Discord login is already in progress.")
      return
    }

    if (!ensureNativeAvailable(promise)) {
      return
    }

    try {
      this.applicationId = applicationId
      setDiscordEngineActivity()

      val verifierJson = JSONObject(nativeCreateAuthorizationCodeVerifier())
      val verifier = verifierJson.optString("verifier")
      val challenge = verifierJson.optString("challenge")
      val method = verifierJson.optString("method", "S256")

      if (verifier.isBlank() || challenge.isBlank()) {
        promise.reject("DISCORD_PKCE_FAILED", "Failed to create Discord authorization verifier.")
        return
      }

      pendingLoginPromise = promise
      pendingCodeVerifier = verifier
      pendingRedirectUri = redirectUri

      val authorizeUrl = Uri.parse("https://discord.com/oauth2/authorize")
        .buildUpon()
        .appendQueryParameter("client_id", applicationId)
        .appendQueryParameter("response_type", "code")
        .appendQueryParameter("redirect_uri", redirectUri)
        .appendQueryParameter("scope", scopes)
        .appendQueryParameter("code_challenge", challenge)
        .appendQueryParameter("code_challenge_method", method)
        .build()
        .toString()

      val started = NativeCalls.authorize(
        authorizeUrl,
        object : AuthenticationClientCallback(0L) {
          override fun onAuthorizationComplete(error: String, code: String, state: String) {
            handleAuthorizationComplete(error, code)
          }
        },
      )

      if (!started) {
        clearPendingLogin()
        promise.reject("DISCORD_LOGIN_FAILED", "Discord authorization did not start.")
      }
    } catch (error: Throwable) {
      clearPendingLogin()
      Log.e(TAG, "login failed", error)
      promise.reject("DISCORD_LOGIN_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun updateToken(tokenType: String, accessToken: String, promise: Promise) {
    if (!ensureNativeAvailable(promise)) {
      return
    }

    try {
      promise.resolve(nativeUpdateToken(tokenType, accessToken))
    } catch (error: Throwable) {
      promise.reject("DISCORD_TOKEN_UPDATE_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun connect(promise: Promise) {
    if (!ensureNativeAvailable(promise)) {
      return
    }

    try {
      setDiscordEngineActivity()
      promise.resolve(nativeConnect())
    } catch (error: Throwable) {
      promise.reject("DISCORD_CONNECT_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun updatePresence(
    title: String,
    artist: String,
    album: String,
    startedAt: Double,
    largeImage: String,
    largeText: String,
    smallImage: String,
    smallText: String,
    promise: Promise,
  ) {
    if (!ensureNativeAvailable(promise)) {
      return
    }

    try {
      promise.resolve(
        nativeUpdatePresence(
          title,
          artist,
          album,
          startedAt,
          largeImage,
          largeText,
          smallImage,
          smallText,
        ),
      )
    } catch (error: Throwable) {
      promise.reject("DISCORD_PRESENCE_UPDATE_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun clearPresence(promise: Promise) {
    if (!ensureNativeAvailable(promise)) {
      return
    }

    try {
      promise.resolve(nativeClearPresence())
    } catch (error: Throwable) {
      promise.reject("DISCORD_PRESENCE_CLEAR_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun logout(promise: Promise) {
    if (!ensureNativeAvailable(promise)) {
      return
    }

    try {
      promise.resolve(nativeDisconnect())
    } catch (error: Throwable) {
      promise.reject("DISCORD_LOGOUT_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun getStatus(promise: Promise) {
    if (!ensureNativeAvailable(promise)) {
      return
    }

    try {
      promise.resolve(nativeGetStatus())
    } catch (error: Throwable) {
      promise.reject("DISCORD_STATUS_FAILED", error.message, error)
    }
  }

  private fun handleAuthorizationComplete(error: String, code: String) {
    val promise = pendingLoginPromise ?: return
    val appId = applicationId
    val verifier = pendingCodeVerifier
    val redirectUri = pendingRedirectUri

    if (error.isNotBlank()) {
      clearPendingLogin()
      promise.reject("DISCORD_AUTH_FAILED", error)
      return
    }

    if (code.isBlank() || appId.isNullOrBlank() || verifier.isNullOrBlank() || redirectUri.isNullOrBlank()) {
      clearPendingLogin()
      promise.reject("DISCORD_AUTH_FAILED", "Discord authorization did not return a usable code.")
      return
    }

    try {
      val resultJson = nativeExchangeTokenAndConnect(appId, code, verifier, redirectUri)
      val result = mapFromJson(resultJson)
      clearPendingLogin()

      if (!result.getBoolean("success")) {
        promise.reject(
          "DISCORD_TOKEN_EXCHANGE_FAILED",
          result.getString("error"),
        )
        return
      }

      promise.resolve(result)
    } catch (exchangeError: Throwable) {
      clearPendingLogin()
      promise.reject("DISCORD_TOKEN_EXCHANGE_FAILED", exchangeError.message, exchangeError)
    }
  }

  private fun ensureNativeAvailable(promise: Promise): Boolean {
    if (nativeLibrariesLoaded) {
      return true
    }

    promise.reject(
      "DISCORD_NATIVE_UNAVAILABLE",
      "Discord native libraries are unavailable on this device.",
    )
    return false
  }

  private fun setDiscordEngineActivity() {
    try {
      reactApplicationContext.currentActivity?.let { DiscordSocialSdkInit.setEngineActivity(it) }
    } catch (error: Throwable) {
      Log.e(TAG, "Failed to attach Discord SDK activity", error)
    }
  }

  private fun clearPendingLogin() {
    pendingLoginPromise = null
    pendingCodeVerifier = null
    pendingRedirectUri = null
  }

  private fun mapFromJson(rawJson: String): WritableMap {
    val json = JSONObject(rawJson)
    return Arguments.createMap().apply {
      putBoolean("success", json.optBoolean("success"))
      putString("accessToken", json.optString("accessToken"))
      putString("refreshToken", json.optString("refreshToken"))
      putString("tokenType", json.optString("tokenType", "Bearer"))
      putInt("expiresIn", json.optInt("expiresIn"))
      putDouble("expiresAt", System.currentTimeMillis() + json.optInt("expiresIn") * 1000.0)
      putString("scope", json.optString("scopes"))
      putString("status", json.optString("status"))
      putString("error", json.optString("error"))
    }
  }

  companion object {
    private const val TAG = "TunifyDiscordPresence"
    private var nativeLibrariesLoaded = false

    init {
      try {
        System.loadLibrary("discord_partner_sdk")
        System.loadLibrary("tunify_discord_presence_bridge")
        nativeLibrariesLoaded = true
      } catch (error: Throwable) {
        nativeLibrariesLoaded = false
        Log.e(TAG, "Failed to load Discord native libraries", error)
      }
    }
  }

  private external fun nativeInit(applicationId: String): Boolean
  private external fun nativeCreateAuthorizationCodeVerifier(): String
  private external fun nativeExchangeTokenAndConnect(
    applicationId: String,
    code: String,
    verifier: String,
    redirectUri: String,
  ): String
  private external fun nativeUpdateToken(tokenType: String, accessToken: String): Boolean
  private external fun nativeConnect(): Boolean
  private external fun nativeUpdatePresence(
    title: String,
    artist: String,
    album: String,
    startedAt: Double,
    largeImage: String,
    largeText: String,
    smallImage: String,
    smallText: String,
  ): Boolean
  private external fun nativeClearPresence(): Boolean
  private external fun nativeDisconnect(): Boolean
  private external fun nativeGetStatus(): String
}
