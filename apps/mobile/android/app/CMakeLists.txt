cmake_minimum_required(VERSION 3.13)

project(appmodules)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

find_package(discord_partner_sdk REQUIRED CONFIG)

add_library(
  tunify_discord_presence_bridge
  SHARED
  src/main/cpp/discord_presence_bridge.cpp
)

target_include_directories(
  tunify_discord_presence_bridge
  PRIVATE
  ../../../../discord_social_sdk/include
)

target_link_libraries(
  tunify_discord_presence_bridge
  discord_partner_sdk::discord_partner_sdk
  android
  log
)
