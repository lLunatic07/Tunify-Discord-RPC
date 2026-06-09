package com.tunify.mobile.media

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class MediaStorePackage : ReactPackage {
  override fun createNativeModules(
    reactContext: ReactApplicationContext,
  ): MutableList<NativeModule> = mutableListOf(MediaStoreModule(reactContext))

  override fun createViewManagers(
    reactContext: ReactApplicationContext,
  ): MutableList<ViewManager<*, *>> = mutableListOf()
}
