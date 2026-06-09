package com.tunify.mobile.media

import android.content.ContentUris
import android.net.Uri
import android.provider.MediaStore
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeArray

class MediaStoreModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "TunifyMediaStore"

  @ReactMethod
  fun getAudioTracks(promise: Promise) {
    try {
      val resolver = reactApplicationContext.contentResolver
      val collection = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
      val projection = arrayOf(
        MediaStore.Audio.Media._ID,
        MediaStore.Audio.Media.TITLE,
        MediaStore.Audio.Media.ARTIST,
        MediaStore.Audio.Media.ALBUM,
        MediaStore.Audio.Media.ALBUM_ID,
        MediaStore.Audio.Media.DURATION,
        MediaStore.Audio.Media.MIME_TYPE,
        MediaStore.Audio.Media.SIZE,
        MediaStore.Audio.Media.DISPLAY_NAME,
        MediaStore.Audio.Media.DATA,
        MediaStore.Audio.Media.DATE_ADDED,
        MediaStore.Audio.Media.DATE_MODIFIED,
        MediaStore.Audio.Media.TRACK,
        MediaStore.Audio.Media.IS_MUSIC,
      )
      val selection = """
        ${MediaStore.Audio.Media.IS_MUSIC} != 0
        AND (${MediaStore.Audio.Media.IS_ALARM} IS NULL OR ${MediaStore.Audio.Media.IS_ALARM} = 0)
        AND (${MediaStore.Audio.Media.IS_NOTIFICATION} IS NULL OR ${MediaStore.Audio.Media.IS_NOTIFICATION} = 0)
        AND (${MediaStore.Audio.Media.IS_RINGTONE} IS NULL OR ${MediaStore.Audio.Media.IS_RINGTONE} = 0)
        AND (${MediaStore.Audio.Media.IS_PODCAST} IS NULL OR ${MediaStore.Audio.Media.IS_PODCAST} = 0)
        AND ${MediaStore.Audio.Media.DURATION} >= ?
        AND ${MediaStore.Audio.Media.SIZE} >= ?
        AND ${MediaStore.Audio.Media.MIME_TYPE} LIKE ?
        AND (
          ${MediaStore.Audio.Media.DATA} IS NULL
          OR (
            ${MediaStore.Audio.Media.DATA} NOT LIKE ?
            AND ${MediaStore.Audio.Media.DATA} NOT LIKE ?
            AND ${MediaStore.Audio.Media.DATA} NOT LIKE ?
            AND ${MediaStore.Audio.Media.DATA} NOT LIKE ?
            AND ${MediaStore.Audio.Media.DATA} NOT LIKE ?
            AND ${MediaStore.Audio.Media.DATA} NOT LIKE ?
            AND ${MediaStore.Audio.Media.DATA} NOT LIKE ?
          )
        )
      """.trimIndent()
      val selectionArgs = arrayOf(
        MIN_MUSIC_DURATION_MS.toString(),
        MIN_MUSIC_SIZE_BYTES.toString(),
        "audio/%",
        "%/Alarms/%",
        "%/Notifications/%",
        "%/Ringtones/%",
        "%/Recordings/%",
        "%/Voice Notes/%",
        "%/WhatsApp/Media/WhatsApp Audio/%",
        "%/WhatsApp/Media/WhatsApp Voice Notes/%",
      )
      val sortOrder = "${MediaStore.Audio.Media.TITLE} COLLATE NOCASE ASC"
      val tracks = WritableNativeArray()

      resolver.query(collection, projection, selection, selectionArgs, sortOrder)?.use { cursor ->
        val idIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
        val titleIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)
        val artistIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)
        val albumIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM)
        val albumIdIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM_ID)
        val durationIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION)
        val mimeTypeIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.MIME_TYPE)
        val sizeIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.SIZE)
        val displayNameIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DISPLAY_NAME)
        val dataIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA)
        val dateAddedIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATE_ADDED)
        val dateModifiedIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATE_MODIFIED)
        val trackIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TRACK)

        while (cursor.moveToNext()) {
          val id = cursor.getLong(idIndex)
          val albumId = cursor.getLong(albumIdIndex)
          val contentUri = ContentUris.withAppendedId(collection, id)
          val filePath = cursor.getNullableString(dataIndex)
          val map = Arguments.createMap()

          map.putString("id", id.toString())
          map.putString("title", cursor.getNullableString(titleIndex))
          map.putString("artist", cursor.getNullableString(artistIndex))
          map.putString("album", cursor.getNullableString(albumIndex))
          map.putString("albumId", if (albumId > 0) albumId.toString() else null)
          map.putString("url", contentUri.toString())
          map.putString("contentUri", contentUri.toString())
          map.putDouble("duration", cursor.getLong(durationIndex) / 1000.0)
          map.putString("mimeType", cursor.getNullableString(mimeTypeIndex))
          map.putDouble("size", cursor.getLong(sizeIndex).toDouble())
          map.putString("fileName", cursor.getNullableString(displayNameIndex))
          map.putString("folderPath", filePath?.substringBeforeLast("/", ""))
          map.putDouble("fileSize", cursor.getLong(sizeIndex).toDouble())
          map.putDouble("dateAdded", cursor.getLong(dateAddedIndex).toDouble())
          map.putDouble("dateModified", cursor.getLong(dateModifiedIndex).toDouble())
          map.putInt("trackNumber", cursor.getInt(trackIndex))
          map.putString("localArtworkUri", getAlbumArtworkUriValue(albumId))

          tracks.pushMap(map)
        }
      }

      promise.resolve(tracks)
    } catch (error: Exception) {
      promise.reject("MEDIASTORE_QUERY_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun getAlbumArtworkUri(albumId: String, promise: Promise) {
    promise.resolve(getAlbumArtworkUriValue(albumId.toLongOrNull() ?: 0))
  }

  private fun getAlbumArtworkUriValue(albumId: Long): String? {
    if (albumId <= 0) {
      return null
    }

    return ContentUris.withAppendedId(
      Uri.parse("content://media/external/audio/albumart"),
      albumId,
    ).toString()
  }

  private fun android.database.Cursor.getNullableString(columnIndex: Int): String? =
    if (isNull(columnIndex)) null else getString(columnIndex)

  private companion object {
    private const val MIN_MUSIC_DURATION_MS = 20_000L
    private const val MIN_MUSIC_SIZE_BYTES = 128L * 1024L
  }
}
