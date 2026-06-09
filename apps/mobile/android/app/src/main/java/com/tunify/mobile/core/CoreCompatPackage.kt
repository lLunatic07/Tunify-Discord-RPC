package com.tunify.mobile.core

import com.facebook.fbreact.specs.NativePlatformConstantsAndroidSpec
import com.facebook.fbreact.specs.NativeSourceCodeSpec
import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class CoreCompatPackage : BaseReactPackage() {
  override fun getModule(
    name: String,
    reactContext: ReactApplicationContext,
  ): NativeModule? =
      when (name) {
        NativePlatformConstantsAndroidSpec.NAME -> PlatformConstantsCompatModule(reactContext)
        NativeSourceCodeSpec.NAME -> SourceCodeCompatModule(reactContext)
        else -> null
      }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider =
      ReactModuleInfoProvider {
        mapOf(
          NativePlatformConstantsAndroidSpec.NAME to
              ReactModuleInfo(
                NativePlatformConstantsAndroidSpec.NAME,
                PlatformConstantsCompatModule::class.java.name,
                true,
                false,
                false,
                true,
              ),
          NativeSourceCodeSpec.NAME to
              ReactModuleInfo(
                NativeSourceCodeSpec.NAME,
                SourceCodeCompatModule::class.java.name,
                true,
                false,
                false,
                true,
              ),
        )
      }
}
