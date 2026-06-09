package com.tunify.mobile

import android.os.Bundle
import android.util.Log
import com.discord.socialsdk.DiscordSocialSdkInit
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {
  override fun getMainComponentName(): String = "Tunify"

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setDiscordEngineActivity()
  }

  override fun onResume() {
    super.onResume()
    setDiscordEngineActivity()
  }

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  private fun setDiscordEngineActivity() {
    try {
      DiscordSocialSdkInit.setEngineActivity(this)
    } catch (error: Throwable) {
      Log.e(TAG, "Failed to attach Discord SDK activity", error)
    }
  }

  companion object {
    private const val TAG = "TunifyMainActivity"
  }
}
