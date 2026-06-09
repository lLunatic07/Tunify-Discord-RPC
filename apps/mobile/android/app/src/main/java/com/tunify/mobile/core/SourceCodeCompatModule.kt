package com.tunify.mobile.core

import com.facebook.fbreact.specs.NativeSourceCodeSpec
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = NativeSourceCodeSpec.NAME, canOverrideExistingModule = true)
class SourceCodeCompatModule(
  reactContext: ReactApplicationContext,
) : NativeSourceCodeSpec(reactContext) {
  override fun getTypedExportedConstants(): Map<String, Any> =
      mapOf("scriptURL" to (reactApplicationContext.sourceURL ?: DEFAULT_SCRIPT_URL))

  companion object {
    private const val DEFAULT_SCRIPT_URL = "assets://index.android.bundle"
  }
}
