#include "discord_presence_bridge.h"

#include <android/log.h>
#include <jni.h>

#include <atomic>
#include <chrono>
#include <cstdint>
#include <future>
#include <memory>
#include <mutex>
#include <sstream>
#include <string>
#include <thread>

#define DISCORDPP_IMPLEMENTATION
#include "discordpp.h"

namespace {
constexpr const char* kTag = "TunifyDiscordBridge";
constexpr auto kSdkTimeout = std::chrono::seconds(15);

std::mutex gMutex;
std::unique_ptr<discordpp::Client> gClient;
std::atomic<bool> gCallbacksRunning{false};
std::thread gCallbacksThread;
uint64_t gApplicationId = 0;
bool gHasToken = false;
std::string gStatus = "disconnected";
std::string gLastError;

void logInfo(const std::string& message) {
  __android_log_print(ANDROID_LOG_INFO, kTag, "%s", message.c_str());
}

void logError(const std::string& message) {
  gLastError = message;
  __android_log_print(ANDROID_LOG_ERROR, kTag, "%s", message.c_str());
}

std::string escapeJson(const std::string& value) {
  std::ostringstream output;
  for (char c : value) {
    switch (c) {
      case '\\':
        output << "\\\\";
        break;
      case '"':
        output << "\\\"";
        break;
      case '\n':
        output << "\\n";
        break;
      case '\r':
        output << "\\r";
        break;
      case '\t':
        output << "\\t";
        break;
      default:
        output << c;
        break;
    }
  }
  return output.str();
}

std::string statusToString(discordpp::Client::Status status) {
  switch (status) {
    case discordpp::Client::Status::Disconnected:
      return "disconnected";
    case discordpp::Client::Status::Connecting:
      return "connecting";
    case discordpp::Client::Status::Connected:
      return "connected";
    case discordpp::Client::Status::Ready:
      return "ready";
    case discordpp::Client::Status::Reconnecting:
      return "reconnecting";
    case discordpp::Client::Status::Disconnecting:
      return "disconnecting";
    case discordpp::Client::Status::HttpWait:
      return "http_wait";
  }
  return "unknown";
}

discordpp::AuthorizationTokenType tokenTypeFromString(const std::string& tokenType) {
  if (tokenType == "User" || tokenType == "user") {
    return discordpp::AuthorizationTokenType::User;
  }

  return discordpp::AuthorizationTokenType::Bearer;
}

std::string resultError(discordpp::ClientResult& result) {
  if (result.Successful()) {
    return "";
  }

  std::ostringstream output;
  output << result.Error();
  const auto responseBody = result.ResponseBody();
  if (!responseBody.empty()) {
    output << " " << responseBody;
  }
  return output.str();
}

void startCallbackThreadLocked() {
  if (gCallbacksRunning.load()) {
    return;
  }

  gCallbacksRunning = true;
  gCallbacksThread = std::thread([]() {
    while (gCallbacksRunning.load()) {
      Discord_RunCallbacks();
      std::this_thread::sleep_for(std::chrono::milliseconds(50));
    }
  });
}

discordpp::Client& ensureClientLocked() {
  if (!gClient) {
    gClient = std::make_unique<discordpp::Client>();
    gClient->AddLogCallback(
      [](std::string message, discordpp::LoggingSeverity) {
        logInfo(message);
      },
      discordpp::LoggingSeverity::Info);
    gClient->SetStatusChangedCallback(
      [](discordpp::Client::Status status,
         discordpp::Client::Error error,
         int32_t errorDetail) {
        gStatus = statusToString(status);
        if (error != discordpp::Client::Error::None) {
          std::ostringstream output;
          output << "status=" << gStatus << " error=" << static_cast<int>(error)
                 << " detail=" << errorDetail;
          logError(output.str());
        } else {
          logInfo("status=" + gStatus);
        }
      });
  }

  if (gApplicationId != 0) {
    gClient->SetApplicationId(gApplicationId);
  }
  startCallbackThreadLocked();
  return *gClient;
}

jstring toJString(JNIEnv* env, const std::string& value) {
  return env->NewStringUTF(value.c_str());
}

std::string fromJString(JNIEnv* env, jstring value) {
  if (value == nullptr) {
    return "";
  }

  const char* chars = env->GetStringUTFChars(value, nullptr);
  std::string result(chars ? chars : "");
  env->ReleaseStringUTFChars(value, chars);
  return result;
}

std::string tokenJson(
  bool success,
  const std::string& accessToken,
  const std::string& refreshToken,
  const std::string& tokenType,
  int32_t expiresIn,
  const std::string& scopes,
  const std::string& error = "") {
  std::ostringstream output;
  output << "{"
         << "\"success\":" << (success ? "true" : "false") << ","
         << "\"accessToken\":\"" << escapeJson(accessToken) << "\","
         << "\"refreshToken\":\"" << escapeJson(refreshToken) << "\","
         << "\"tokenType\":\"" << escapeJson(tokenType) << "\","
         << "\"expiresIn\":" << expiresIn << ","
         << "\"scopes\":\"" << escapeJson(scopes) << "\","
         << "\"status\":\"" << escapeJson(gStatus) << "\","
         << "\"error\":\"" << escapeJson(error) << "\""
         << "}";
  return output.str();
}
} // namespace

void tunify_discord_presence_bridge_placeholder() {}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_tunify_mobile_discord_DiscordPresenceModule_nativeInit(
  JNIEnv* env,
  jobject,
  jstring applicationId) {
  const auto idString = fromJString(env, applicationId);
  try {
    gApplicationId = std::stoull(idString);
    std::lock_guard<std::mutex> lock(gMutex);
    auto& client = ensureClientLocked();
    client.SetApplicationId(gApplicationId);
    gStatus = statusToString(client.GetStatus());
    return JNI_TRUE;
  } catch (const std::exception& error) {
    logError(std::string("init failed: ") + error.what());
    return JNI_FALSE;
  }
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_tunify_mobile_discord_DiscordPresenceModule_nativeCreateAuthorizationCodeVerifier(
  JNIEnv* env,
  jobject) {
  try {
    std::lock_guard<std::mutex> lock(gMutex);
    auto& client = ensureClientLocked();
    auto verifier = client.CreateAuthorizationCodeVerifier();
    auto challenge = verifier.Challenge();
    std::ostringstream output;
    output << "{"
           << "\"verifier\":\"" << escapeJson(verifier.Verifier()) << "\","
           << "\"challenge\":\"" << escapeJson(challenge.Challenge()) << "\","
           << "\"method\":\"S256\""
           << "}";
    return toJString(env, output.str());
  } catch (const std::exception& error) {
    logError(std::string("create verifier failed: ") + error.what());
    return toJString(env, "{\"verifier\":\"\",\"challenge\":\"\",\"method\":\"S256\"}");
  }
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_tunify_mobile_discord_DiscordPresenceModule_nativeExchangeTokenAndConnect(
  JNIEnv* env,
  jobject,
  jstring applicationId,
  jstring code,
  jstring verifier,
  jstring redirectUri) {
  const auto applicationIdString = fromJString(env, applicationId);
  const auto codeString = fromJString(env, code);
  const auto verifierString = fromJString(env, verifier);
  const auto redirectUriString = fromJString(env, redirectUri);

  try {
    const auto appId = std::stoull(applicationIdString);
    gApplicationId = appId;

    auto tokenPromise = std::make_shared<std::promise<std::string>>();
    {
      std::lock_guard<std::mutex> lock(gMutex);
      auto& client = ensureClientLocked();
      client.SetApplicationId(appId);
      client.GetToken(
        appId,
        codeString,
        verifierString,
        redirectUriString,
        [tokenPromise](discordpp::ClientResult result,
                       std::string accessToken,
                       std::string refreshToken,
                       discordpp::AuthorizationTokenType tokenType,
                       int32_t expiresIn,
                       std::string scopes) {
          if (!result.Successful()) {
            const auto error = resultError(result);
            logError("get token failed: " + error);
            tokenPromise->set_value(tokenJson(false, "", "", "Bearer", 0, "", error));
            return;
          }

          const auto tokenTypeString =
            tokenType == discordpp::AuthorizationTokenType::User ? "User" : "Bearer";
          tokenPromise->set_value(
            tokenJson(true, accessToken, refreshToken, tokenTypeString, expiresIn, scopes));
        });
    }

    auto tokenFuture = tokenPromise->get_future();
    if (tokenFuture.wait_for(kSdkTimeout) != std::future_status::ready) {
      const std::string error = "Token exchange timed out.";
      logError(error);
      return toJString(env, tokenJson(false, "", "", "Bearer", 0, "", error));
    }

    auto tokenResult = tokenFuture.get();
    if (tokenResult.find("\"success\":true") == std::string::npos) {
      return toJString(env, tokenResult);
    }

    // The JSON is intentionally simple; extract values without adding another dependency.
    const auto accessKey = std::string("\"accessToken\":\"");
    const auto typeKey = std::string("\"tokenType\":\"");
    const auto accessStart = tokenResult.find(accessKey) + accessKey.size();
    const auto accessEnd = tokenResult.find("\"", accessStart);
    const auto typeStart = tokenResult.find(typeKey) + typeKey.size();
    const auto typeEnd = tokenResult.find("\"", typeStart);
    const auto accessToken = tokenResult.substr(accessStart, accessEnd - accessStart);
    const auto tokenType = tokenResult.substr(typeStart, typeEnd - typeStart);

    auto updatePromise = std::make_shared<std::promise<std::string>>();
    {
      std::lock_guard<std::mutex> lock(gMutex);
      auto& client = ensureClientLocked();
      client.UpdateToken(
        tokenTypeFromString(tokenType),
        accessToken,
        [updatePromise](discordpp::ClientResult result) {
          if (!result.Successful()) {
            const auto error = resultError(result);
            logError("update token failed: " + error);
            updatePromise->set_value(error);
            return;
          }
          updatePromise->set_value("");
        });
    }

    auto updateFuture = updatePromise->get_future();
    if (updateFuture.wait_for(kSdkTimeout) != std::future_status::ready) {
      const std::string error = "Update token timed out.";
      logError(error);
      return toJString(env, tokenJson(false, "", "", "Bearer", 0, "", error));
    }

    const auto updateError = updateFuture.get();
    if (!updateError.empty()) {
      return toJString(env, tokenJson(false, "", "", "Bearer", 0, "", updateError));
    }

    {
      std::lock_guard<std::mutex> lock(gMutex);
      auto& client = ensureClientLocked();
      gHasToken = true;
      client.Connect();
      gStatus = statusToString(client.GetStatus());
    }

    return toJString(env, tokenResult);
  } catch (const std::exception& error) {
    const auto message = std::string("exchange token failed: ") + error.what();
    logError(message);
    return toJString(env, tokenJson(false, "", "", "Bearer", 0, "", message));
  }
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_tunify_mobile_discord_DiscordPresenceModule_nativeUpdateToken(
  JNIEnv* env,
  jobject,
  jstring tokenType,
  jstring accessToken) {
  const auto tokenTypeString = fromJString(env, tokenType);
  const auto accessTokenString = fromJString(env, accessToken);
  if (accessTokenString.empty()) {
    logError("update token skipped: empty token");
    return JNI_FALSE;
  }

  auto promise = std::make_shared<std::promise<bool>>();
  {
    std::lock_guard<std::mutex> lock(gMutex);
    auto& client = ensureClientLocked();
    client.UpdateToken(
      tokenTypeFromString(tokenTypeString),
      accessTokenString,
      [promise](discordpp::ClientResult result) {
        const auto success = result.Successful();
        if (!success) {
          logError("update token failed: " + resultError(result));
        }
        promise->set_value(success);
      });
  }

  auto future = promise->get_future();
  if (future.wait_for(kSdkTimeout) != std::future_status::ready) {
    logError("update token timed out");
    return JNI_FALSE;
  }

  gHasToken = future.get();
  return gHasToken ? JNI_TRUE : JNI_FALSE;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_tunify_mobile_discord_DiscordPresenceModule_nativeConnect(JNIEnv*, jobject) {
  try {
    std::lock_guard<std::mutex> lock(gMutex);
    auto& client = ensureClientLocked();
    if (!gHasToken) {
      logError("connect skipped: token missing");
      return JNI_FALSE;
    }
    client.Connect();
    gStatus = statusToString(client.GetStatus());
    return JNI_TRUE;
  } catch (const std::exception& error) {
    logError(std::string("connect failed: ") + error.what());
    return JNI_FALSE;
  }
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_tunify_mobile_discord_DiscordPresenceModule_nativeUpdatePresence(
  JNIEnv* env,
  jobject,
  jstring title,
  jstring artist,
  jstring album,
  jdouble startedAt,
  jstring largeImage,
  jstring largeText,
  jstring smallImage,
  jstring smallText) {
  if (!gHasToken) {
    logError("update presence skipped: token missing");
    return JNI_FALSE;
  }

  const auto titleString = fromJString(env, title);
  const auto artistString = fromJString(env, artist);
  const auto albumString = fromJString(env, album);
  const auto largeImageString = fromJString(env, largeImage);
  const auto largeTextString = fromJString(env, largeText);
  const auto smallImageString = fromJString(env, smallImage);
  const auto smallTextString = fromJString(env, smallText);

  auto promise = std::make_shared<std::promise<bool>>();
  {
    std::lock_guard<std::mutex> lock(gMutex);
    auto& client = ensureClientLocked();

    discordpp::Activity activity;
    activity.SetType(discordpp::ActivityTypes::Listening);
    activity.SetDetails(titleString);
    const auto state = albumString.empty() ? artistString : artistString + " • " + albumString;
    activity.SetState(state);

    discordpp::ActivityAssets assets;
    assets.SetLargeImage(largeImageString);
    assets.SetLargeText(largeTextString.empty() ? titleString : largeTextString);
    assets.SetSmallImage(smallImageString);
    assets.SetSmallText(smallTextString);
    activity.SetAssets(assets);

    if (startedAt > 0) {
      discordpp::ActivityTimestamps timestamps;
      timestamps.SetStart(static_cast<uint64_t>(startedAt));
      activity.SetTimestamps(timestamps);
    }

    client.UpdateRichPresence(
      std::move(activity),
      [promise](discordpp::ClientResult result) {
        const auto success = result.Successful();
        if (!success) {
          logError("update presence failed: " + resultError(result));
        }
        promise->set_value(success);
      });
  }

  auto future = promise->get_future();
  if (future.wait_for(std::chrono::seconds(5)) != std::future_status::ready) {
    logError("update presence timed out");
    return JNI_FALSE;
  }

  return future.get() ? JNI_TRUE : JNI_FALSE;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_tunify_mobile_discord_DiscordPresenceModule_nativeClearPresence(JNIEnv*, jobject) {
  try {
    std::lock_guard<std::mutex> lock(gMutex);
    auto& client = ensureClientLocked();
    client.ClearRichPresence();
    return JNI_TRUE;
  } catch (const std::exception& error) {
    logError(std::string("clear presence failed: ") + error.what());
    return JNI_FALSE;
  }
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_tunify_mobile_discord_DiscordPresenceModule_nativeDisconnect(JNIEnv*, jobject) {
  try {
    std::lock_guard<std::mutex> lock(gMutex);
    if (gClient) {
      gClient->ClearRichPresence();
      gClient->Disconnect();
      gStatus = statusToString(gClient->GetStatus());
    }
    gHasToken = false;
    return JNI_TRUE;
  } catch (const std::exception& error) {
    logError(std::string("disconnect failed: ") + error.what());
    return JNI_FALSE;
  }
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_tunify_mobile_discord_DiscordPresenceModule_nativeGetStatus(JNIEnv* env, jobject) {
  return toJString(env, gStatus);
}
