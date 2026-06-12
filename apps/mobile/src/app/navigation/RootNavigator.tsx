import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  BackHandler,
  GestureResponderEvent,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  ToastAndroid,
  useColorScheme,
  View,
} from 'react-native';
import type { DimensionValue } from 'react-native';
import {
  ChevronDown,
  CirclePlus,
  Disc3,
  Folder,
  FolderHeart,
  Heart,
  Home,
  Info,
  Library,
  ListEnd,
  ListMusic,
  ListPlus,
  MoreVertical,
  Music,
  Pause,
  Pencil,
  Play,
  Repeat,
  Search,
  Settings,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  User,
  X,
} from 'lucide-react-native';
import { RepeatMode } from 'react-native-track-player';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { DiscordPresencePayload, Track } from '@tunify/shared';

import { AlbumArt } from '../../components/music/AlbumArt';
import { AppButton } from '../../components/ui/AppButton';
import { ArtworkRemoteCacheService } from '../../services/artwork/artworkRemoteCache.service';
import { DiscordAlbumArtUploadService } from '../../services/artwork/discordAlbumArtUpload.service';
import { DiscordAuthService } from '../../features/discord/discordAuth.service';
import { useDiscordSettingsStore } from '../../features/discord/discordSettings.store';
import { useDiscordStore } from '../../features/discord/discord.store';
import { DiscordPresence, buildDiscordPresencePayload } from '../../features/discord/discordPresence';
import { useFavoritesStore } from '../../features/favorites/favorites.store';
import { useLibraryStore } from '../../features/library/library.store';
import { PermissionsService } from '../../features/permissions/permissions.service';
import { usePermissionsStore } from '../../features/permissions/permissions.store';
import { PlayerService } from '../../features/player/player.service';
import { usePlayerStore } from '../../features/player/player.store';
import { usePlaylistsStore } from '../../features/playlists/playlists.store';
import type { Playlist } from '../../features/playlists/playlists.types';
import type { TunifyColors } from '../theme/colors';
import { radius, spacing, typography } from '../theme/tokens';
import { useThemeStore, type ThemeMode } from '../theme/theme.store';
import type { AppRoute } from './routes';

type IconType = React.ComponentType<{ color?: string; size?: number; strokeWidth?: number; fill?: string }>;
type LibraryTab = 'tracks' | 'albums' | 'artists' | 'folders' | 'favorites';
type SortMode = 'title' | 'artist' | 'recent';

type TrackGroup = {
  key: string;
  title: string;
  subtitle: string;
  tracks: Track[];
  icon: IconType;
};

const formatDuration = (seconds?: number) => {
  if (!seconds || seconds <= 0) {
    return '--:--';
  }

  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${rest}`;
};

const formatDate = (seconds?: number) => {
  if (!seconds) {
    return 'Unknown date';
  }

  return new Date(seconds * 1000).toLocaleDateString();
};

const formatBytes = (bytes?: number) => {
  if (!bytes) {
    return 'Unknown size';
  }

  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const uniqueCount = (tracks: Track[], key: 'album' | 'artist') =>
  new Set(tracks.map(track => track[key]).filter(Boolean)).size;

const folderLabel = (track: Track) => {
  if (!track.folderPath) {
    return 'Unknown Folder';
  }

  return track.folderPath.split(/[\\/]/).filter(Boolean).pop() ?? track.folderPath;
};

const sortTracks = (tracks: Track[], mode: SortMode) => {
  const sorted = [...tracks];
  if (mode === 'recent') {
    return sorted.sort((a, b) => (b.dateAdded ?? 0) - (a.dateAdded ?? 0));
  }

  return sorted.sort((a, b) => {
    const left = mode === 'artist' ? `${a.artist} ${a.title}` : a.title;
    const right = mode === 'artist' ? `${b.artist} ${b.title}` : b.title;
    return left.localeCompare(right);
  });
};

const buildGroups = (
  tracks: Track[],
  keySelector: (track: Track) => string,
  icon: IconType,
): TrackGroup[] => {
  const groups = new Map<string, Track[]>();
  tracks.forEach(track => {
    const key = keySelector(track) || 'Unknown';
    groups.set(key, [...(groups.get(key) ?? []), track]);
  });

  return [...groups.entries()]
    .map(([title, groupTracks]) => ({
      key: title,
      title,
      subtitle: `${groupTracks.length} tracks`,
      tracks: sortTracks(groupTracks, 'title'),
      icon,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
};

const nextRepeatMode = (mode: RepeatMode) => {
  if (mode === RepeatMode.Off) {
    return RepeatMode.Track;
  }

  if (mode === RepeatMode.Track) {
    return RepeatMode.Queue;
  }

  return RepeatMode.Off;
};

const showToast = (message: string) => {
  ToastAndroid.show(message, ToastAndroid.SHORT);
};

export function RootNavigator() {
  const systemScheme = useColorScheme();
  const themeMode = useThemeStore(state => state.mode);
  const resolveColors = useThemeStore(state => state.resolveColors);
  const { colors, isDark } = useMemo(
    () => resolveColors(systemScheme),
    [resolveColors, systemScheme, themeMode],
  );
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [route, setRoute] = useState<AppRoute>('home');
  const [query, setQuery] = useState('');
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('tracks');
  const [sortMode, setSortMode] = useState<SortMode>('title');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | undefined>();
  const [createPlaylistVisible, setCreatePlaylistVisible] = useState(false);
  const [renamePlaylistTarget, setRenamePlaylistTarget] = useState<Playlist | undefined>();
  const [playlistName, setPlaylistName] = useState('');
  const [playlistError, setPlaylistError] = useState<string | undefined>();
  const [trackForPlaylist, setTrackForPlaylist] = useState<Track | undefined>();
  const [trackMenuTarget, setTrackMenuTarget] = useState<Track | undefined>();
  const [trackDetailsTarget, setTrackDetailsTarget] = useState<Track | undefined>();
  const [addTracksPlaylist, setAddTracksPlaylist] = useState<Playlist | undefined>();
  const [queueVisible, setQueueVisible] = useState(false);
  const [lyricsVisible, setLyricsVisible] = useState(false);

  const audioPermission = usePermissionsStore(state => state.audioPermission);
  const checkAudioPermission = usePermissionsStore(state => state.checkAudioPermission);
  const requestAudioPermission = usePermissionsStore(state => state.requestAudioPermission);
  const tracks = useLibraryStore(state => state.tracks);
  const isLibraryLoading = useLibraryStore(state => state.isLoading);
  const libraryError = useLibraryStore(state => state.error);
  const loadDeviceTracks = useLibraryStore(state => state.loadDeviceTracks);
  const loadCachedTracks = useLibraryStore(state => state.loadCachedTracks);
  const refreshDeviceTracks = useLibraryStore(state => state.refreshDeviceTracks);
  const clearLibraryCache = useLibraryStore(state => state.clearLibraryCache);
  const searchTracks = useLibraryStore(state => state.searchTracks);
  const setTrackRemoteArtworkUrl = useLibraryStore(state => state.setTrackRemoteArtworkUrl);
  const currentTrack = usePlayerStore(state => state.currentTrack);
  const isPlaying = usePlayerStore(state => state.isPlaying);
  const position = usePlayerStore(state => state.position);
  const duration = usePlayerStore(state => state.duration);
  const queue = usePlayerStore(state => state.queue);
  const queueIndex = usePlayerStore(state => state.queueIndex);
  const shuffleEnabled = usePlayerStore(state => state.shuffleEnabled);
  const repeatMode = usePlayerStore(state => state.repeatMode);
  const favorites = useFavoritesStore(state => state.favorites);
  const loadFavorites = useFavoritesStore(state => state.loadFavorites);
  const toggleFavorite = useFavoritesStore(state => state.toggleFavorite);
  const isFavorite = useFavoritesStore(state => state.isFavorite);
  const removeMissingFavorites = useFavoritesStore(state => state.removeMissingFavorites);
  const playlists = usePlaylistsStore(state => state.playlists);
  const loadPlaylists = usePlaylistsStore(state => state.loadPlaylists);
  const createPlaylist = usePlaylistsStore(state => state.createPlaylist);
  const renamePlaylist = usePlaylistsStore(state => state.renamePlaylist);
  const deletePlaylist = usePlaylistsStore(state => state.deletePlaylist);
  const addTrackToPlaylist = usePlaylistsStore(state => state.addTrackToPlaylist);
  const removeTrackFromPlaylist = usePlaylistsStore(state => state.removeTrackFromPlaylist);
  const removeMissingTracks = usePlaylistsStore(state => state.removeMissingTracks);
  const loadThemeMode = useThemeStore(state => state.loadThemeMode);
  const setThemeMode = useThemeStore(state => state.setThemeMode);
  const discordStatus = useDiscordStore(state => state.status);
  const discordError = useDiscordStore(state => state.error);
  const lastDiscordPayload = useDiscordStore(state => state.lastPayload);
  const setDiscordStatus = useDiscordStore(state => state.setStatus);
  const setDiscordError = useDiscordStore(state => state.setError);
  const setLastDiscordPayload = useDiscordStore(state => state.setLastPayload);
  const loadDiscordSettings = useDiscordSettingsStore(state => state.loadSettings);
  const uploadLocalAlbumArtEnabled = useDiscordSettingsStore(state => state.uploadLocalAlbumArtEnabled);
  const setUploadLocalAlbumArtEnabled = useDiscordSettingsStore(
    state => state.setUploadLocalAlbumArtEnabled,
  );

  const visibleTracks = useMemo(() => sortTracks(searchTracks(query), sortMode), [query, searchTracks, sortMode]);
  const trackById = useMemo(() => new Map(tracks.map(track => [track.id, track])), [tracks]);
  const favoriteTracks = useMemo(
    () =>
      favorites
        .slice()
        .sort((a, b) => b.addedAt - a.addedAt)
        .map(favorite => trackById.get(favorite.trackId))
        .filter(Boolean) as Track[],
    [favorites, trackById],
  );
  const recentlyAdded = useMemo(
    () => sortTracks(tracks, 'recent').slice(0, 8),
    [tracks],
  );
  const homeTracks = useMemo(() => sortTracks(tracks, 'title').slice(0, 12), [tracks]);
  const selectedPlaylist = playlists.find(playlist => playlist.id === selectedPlaylistId);
  const selectedPlaylistTracks = selectedPlaylist
    ? selectedPlaylist.trackIds.map(trackId => trackById.get(trackId)).filter(Boolean) as Track[]
    : [];
  const activeTrack = currentTrack;

  useEffect(() => {
    const hydrateApp = async () => {
      await Promise.all([
        loadThemeMode(),
        loadDiscordSettings(),
        loadFavorites(),
        loadPlaylists(),
        loadCachedTracks(),
      ]);
      const status = await checkAudioPermission();
      if (status === 'granted') {
        await loadDeviceTracks();
      }
      await DiscordAuthService.restoreSession();
    };

    hydrateApp().catch(error => {
      console.warn('[Tunify] hydrate failed', error);
    });
  }, [
    checkAudioPermission,
    loadCachedTracks,
    loadDiscordSettings,
    loadDeviceTracks,
    loadFavorites,
    loadPlaylists,
    loadThemeMode,
  ]);

  useEffect(() => {
    if (!tracks.length) {
      return;
    }

    const pruneMissingTracks = async () => {
      const ids = tracks.map(track => track.id);
      await Promise.all([removeMissingFavorites(ids), removeMissingTracks(ids)]);
    };

    pruneMissingTracks().catch(error => {
      console.warn('[Tunify] prune failed', error);
    });
  }, [removeMissingFavorites, removeMissingTracks, tracks]);

  const updateDiscordPresenceForTrack = useCallback(async (track: Track, shouldBePlaying: boolean) => {
    const cachedTrack = await ArtworkRemoteCacheService.applyCachedRemoteArtwork(track);
    const currentPosition = usePlayerStore.getState().position;
    const payload = buildDiscordPresencePayload(cachedTrack, {
      isPlaying: shouldBePlaying,
      position: currentPosition,
      startedAt: Date.now() - currentPosition * 1000,
    });
    setLastDiscordPayload(payload);

    if (useDiscordStore.getState().status !== 'connected') {
      return;
    }

    const didUpdate = await DiscordPresence.updatePresence(payload);
    if (!didUpdate) {
      setDiscordError('Discord native presence update failed. Check login status and Discord asset keys.');
    }

    if (!shouldBePlaying) {
      return;
    }

    void DiscordAlbumArtUploadService.ensureRemoteArtwork(cachedTrack, uploadLocalAlbumArtEnabled)
      .then(async remoteUrl => {
        if (!remoteUrl || usePlayerStore.getState().currentTrack?.id !== cachedTrack.id) {
          return;
        }

        const currentPosition = usePlayerStore.getState().position;
        const remoteTrack = { ...cachedTrack, artworkRemoteUrl: remoteUrl };
        const remotePayload = buildDiscordPresencePayload(remoteTrack, {
          isPlaying: true,
          position: currentPosition,
          startedAt: Date.now() - currentPosition * 1000,
        });

        setTrackRemoteArtworkUrl(cachedTrack.id, remoteUrl);
        setLastDiscordPayload(remotePayload);

        if (useDiscordStore.getState().status === 'connected') {
          await DiscordPresence.updatePresence(remotePayload);
        }
      });
  }, [
    setDiscordError,
    setLastDiscordPayload,
    setTrackRemoteArtworkUrl,
    uploadLocalAlbumArtEnabled,
  ]);

  const playTrack = async (track: Track, playQueue = tracks) => {
    await PlayerService.playTrack(track, playQueue.length ? playQueue : [track]);
  };

  const pause = async () => {
    await PlayerService.pause();
    if (discordStatus === 'connected') {
      await DiscordPresence.clearPresence();
    }
    setLastDiscordPayload(undefined);
  };

  const resumeActiveTrack = async () => {
    if (!activeTrack) {
      return;
    }

    await PlayerService.play();
  };

  useEffect(() => {
    if (!activeTrack || !isPlaying || discordStatus !== 'connected') {
      return;
    }

    updateDiscordPresenceForTrack(activeTrack, true).catch(error => {
      console.warn('[Tunify][DiscordPresence] auto update failed', error);
    });
  }, [
    activeTrack?.id,
    discordStatus,
    isPlaying,
    updateDiscordPresenceForTrack,
  ]);

  const connectDiscord = async () => {
    try {
      await DiscordAuthService.login();
      setDiscordError(undefined);
      showToast('Discord connected');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Discord login failed.';
      setDiscordStatus('error');
      setDiscordError(message);
    }
  };

  const disconnectDiscord = async () => {
    await DiscordAuthService.logout();
    showToast('Discord disconnected');
  };

  const testDiscordPresence = async () => {
    if (!activeTrack) {
      setDiscordError('Play a track first before testing Discord Presence.');
      return;
    }

    await updateDiscordPresenceForTrack(activeTrack, true);
    showToast('Presence payload sent');
  };

  const refreshLibrary = async () => {
    await refreshDeviceTracks();
  };

  const requestPermissionAndLoad = async () => {
    const status = await requestAudioPermission();
    if (status === 'granted') {
      await loadDeviceTracks();
    }
  };

  const closePlaylistNameModal = () => {
    setCreatePlaylistVisible(false);
    setRenamePlaylistTarget(undefined);
    setPlaylistName('');
    setPlaylistError(undefined);
  };

  const openCreatePlaylist = (track?: Track) => {
    setTrackForPlaylist(track);
    setPlaylistName('');
    setPlaylistError(undefined);
    setRenamePlaylistTarget(undefined);
    setCreatePlaylistVisible(true);
  };

  const openRenamePlaylist = (playlist: Playlist) => {
    setPlaylistName(playlist.name);
    setPlaylistError(undefined);
    setCreatePlaylistVisible(false);
    setRenamePlaylistTarget(playlist);
  };

  const submitPlaylistName = async () => {
    try {
      if (renamePlaylistTarget) {
        await renamePlaylist(renamePlaylistTarget.id, playlistName);
        showToast('Playlist renamed');
      } else {
        const playlist = await createPlaylist(playlistName);
        if (trackForPlaylist) {
          await addTrackToPlaylist(playlist.id, trackForPlaylist.id);
          showToast('Added to playlist');
        } else {
          showToast('Playlist created');
        }
        setSelectedPlaylistId(playlist.id);
        setRoute('playlistDetail');
      }

      closePlaylistNameModal();
      setTrackForPlaylist(undefined);
    } catch (error) {
      setPlaylistError(error instanceof Error ? error.message : 'Could not save playlist.');
    }
  };

  const openPlaylistDetail = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setRoute('playlistDetail');
  };

  const confirmDeletePlaylist = (playlist: Playlist) => {
    Alert.alert('Delete playlist?', playlist.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePlaylist(playlist.id);
          if (selectedPlaylistId === playlist.id) {
            setSelectedPlaylistId(undefined);
            setRoute('playlists');
          }
        },
      },
    ]);
  };

  const addTrackToPlaylistAndClose = async (playlistId: string, track: Track) => {
    await addTrackToPlaylist(playlistId, track.id);
    showToast('Added to playlist');
    setTrackForPlaylist(undefined);
  };

  const renderTrack = (track: Track, sourceQueue = tracks) => (
    <TrackRow
      colors={colors}
      isFavorite={isFavorite(track.id)}
      isPlaying={currentTrack?.id === track.id && isPlaying}
      key={track.id}
      onMore={() => setTrackMenuTarget(track)}
      onPress={() => playTrack(track, sourceQueue)}
      onToggleFavorite={() => toggleFavorite(track.id)}
      styles={styles}
      track={track}
    />
  );

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (trackDetailsTarget) {
        setTrackDetailsTarget(undefined);
        return true;
      }

      if (trackMenuTarget) {
        setTrackMenuTarget(undefined);
        return true;
      }

      if (trackForPlaylist) {
        setTrackForPlaylist(undefined);
        return true;
      }

      if (addTracksPlaylist) {
        setAddTracksPlaylist(undefined);
        return true;
      }

      if (createPlaylistVisible || renamePlaylistTarget) {
        closePlaylistNameModal();
        setTrackForPlaylist(undefined);
        return true;
      }

      if (queueVisible) {
        setQueueVisible(false);
        return true;
      }

      if (lyricsVisible) {
        setLyricsVisible(false);
        return true;
      }

      if (route === 'playlistDetail') {
        setRoute('playlists');
        return true;
      }

      if (route === 'nowPlaying') {
        setRoute('home');
        return true;
      }

      if (route !== 'home') {
        setRoute('home');
        return true;
      }

      return false;
    });

    return () => subscription.remove();
  }, [
    addTracksPlaylist,
    closePlaylistNameModal,
    createPlaylistVisible,
    lyricsVisible,
    queueVisible,
    renamePlaylistTarget,
    route,
    trackDetailsTarget,
    trackForPlaylist,
    trackMenuTarget,
  ]);

  const content = (() => {
    if (audioPermission !== 'granted' && route !== 'settings') {
      return (
        <PermissionScreen
          colors={colors}
          isDenied={audioPermission === 'denied'}
          onOpenSettings={() => PermissionsService.openAppSettings()}
          onRequest={requestPermissionAndLoad}
          styles={styles}
        />
      );
    }

    if (route === 'nowPlaying') {
      return (
        <NowPlayingScreen
          colors={colors}
          duration={duration || activeTrack?.duration || 0}
          isDark={isDark}
          isFavorite={activeTrack ? isFavorite(activeTrack.id) : false}
          isPlaying={isPlaying}
          onBack={() => setRoute('home')}
          onFavorite={() => activeTrack && toggleFavorite(activeTrack.id)}
          onLyrics={() => setLyricsVisible(true)}
          onNext={() => PlayerService.next()}
          onOpenQueue={() => setQueueVisible(true)}
          onPause={pause}
          onPlay={resumeActiveTrack}
          onPrevious={() => PlayerService.previous()}
          onRepeat={() => PlayerService.setRepeatMode(nextRepeatMode(repeatMode))}
          onSeek={seconds => PlayerService.seekTo(seconds)}
          onShuffle={() => PlayerService.toggleShuffle()}
          position={position}
          repeatMode={repeatMode}
          shuffleEnabled={shuffleEnabled}
          styles={styles}
          track={activeTrack}
        />
      );
    }

    return (
      <ScreenScaffold
        colors={colors}
        isDark={isDark}
        isRefreshing={isLibraryLoading}
        onRefresh={route === 'home' || route === 'library' ? refreshLibrary : undefined}
        setRoute={setRoute}
        styles={styles}
      >
        {route === 'home' && (
          <HomeView
            colors={colors}
            favoriteCount={favoriteTracks.length}
            homeTracks={homeTracks}
            isLoading={isLibraryLoading}
            libraryError={libraryError}
            onCreatePlaylist={() => openCreatePlaylist()}
            onOpenPlaylist={openPlaylistDetail}
            onPlayAll={() => tracks[0] && playTrack(tracks[0], sortTracks(tracks, 'title'))}
            onRefresh={refreshLibrary}
            onShuffle={() => {
              if (!tracks.length) {
                return;
              }
              const shuffled = [...tracks].sort(() => Math.random() - 0.5);
              playTrack(shuffled[0], shuffled);
            }}
            playlists={playlists}
            recentlyAdded={recentlyAdded}
            renderTrack={renderTrack}
            styles={styles}
            tracks={tracks}
          />
        )}

        {route === 'library' && (
          <LibraryView
            colors={colors}
            favoriteTracks={favoriteTracks}
            isLoading={isLibraryLoading}
            libraryTab={libraryTab}
            onPlayGroup={(groupTracks) => groupTracks[0] && playTrack(groupTracks[0], groupTracks)}
            onRefresh={refreshLibrary}
            onShuffleTracks={groupTracks => {
              if (!groupTracks.length) {
                return;
              }
              const shuffled = [...groupTracks].sort(() => Math.random() - 0.5);
              playTrack(shuffled[0], shuffled);
            }}
            query={query}
            renderTrack={renderTrack}
            setLibraryTab={setLibraryTab}
            setQuery={setQuery}
            setSortMode={setSortMode}
            sortMode={sortMode}
            styles={styles}
            tracks={visibleTracks}
          />
        )}

        {route === 'favorites' && (
          <FavoritesView
            onPlayAll={() => favoriteTracks[0] && playTrack(favoriteTracks[0], favoriteTracks)}
            onShuffle={() => {
              if (!favoriteTracks.length) {
                return;
              }
              const shuffled = [...favoriteTracks].sort(() => Math.random() - 0.5);
              playTrack(shuffled[0], shuffled);
            }}
            renderTrack={track => renderTrack(track, favoriteTracks)}
            styles={styles}
            tracks={favoriteTracks}
          />
        )}

        {route === 'playlists' && (
          <PlaylistsView
            colors={colors}
            onCreate={() => openCreatePlaylist()}
            onDelete={confirmDeletePlaylist}
            onOpen={openPlaylistDetail}
            onRename={openRenamePlaylist}
            playlists={playlists}
            styles={styles}
            trackById={trackById}
          />
        )}

        {route === 'playlistDetail' && (
          <PlaylistDetailView
            colors={colors}
            onAddTracks={playlist => setAddTracksPlaylist(playlist)}
            onBack={() => setRoute('playlists')}
            onDelete={confirmDeletePlaylist}
            onPlayTrack={playTrack}
            onRemoveTrack={removeTrackFromPlaylist}
            onRename={openRenamePlaylist}
            onShuffle={playlistTracks => {
              if (!playlistTracks.length) {
                return;
              }
              const shuffled = [...playlistTracks].sort(() => Math.random() - 0.5);
              playTrack(shuffled[0], shuffled);
            }}
            playlist={selectedPlaylist}
            playlistTracks={selectedPlaylistTracks}
            renderTrack={renderTrack}
            styles={styles}
          />
        )}

        {route === 'settings' && (
          <SettingsView
            audioPermission={audioPermission}
            colors={colors}
            onClearCache={() => {
              clearLibraryCache();
              showToast('Library cache cleared');
            }}
            onClearQueue={() => PlayerService.clearQueue()}
            onConnectDiscord={connectDiscord}
            onDisconnectDiscord={disconnectDiscord}
            onTestDiscordPresence={testDiscordPresence}
            onOpenSettings={() => PermissionsService.openAppSettings()}
            onRefresh={refreshLibrary}
            onRequestPermission={requestPermissionAndLoad}
            onClearDiscordPresence={pause}
            discordError={discordError}
            discordPayload={lastDiscordPayload}
            discordStatus={discordStatus}
            setUploadLocalAlbumArtEnabled={setUploadLocalAlbumArtEnabled}
            setThemeMode={setThemeMode}
            styles={styles}
            themeMode={themeMode}
            uploadLocalAlbumArtEnabled={uploadLocalAlbumArtEnabled}
          />
        )}
      </ScreenScaffold>
    );
  })();

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {content}
      {route !== 'nowPlaying' && activeTrack && (
        <MiniPlayer
          colors={colors}
          duration={duration || activeTrack.duration || 0}
          isFavorite={isFavorite(activeTrack.id)}
          isPlaying={isPlaying}
          onFavorite={() => toggleFavorite(activeTrack.id)}
          onOpen={() => setRoute('nowPlaying')}
          onPause={pause}
          onPlay={resumeActiveTrack}
          position={position}
          styles={styles}
          track={activeTrack}
        />
      )}
      {route !== 'nowPlaying' && (
        <BottomTabs colors={colors} route={route} setRoute={setRoute} styles={styles} />
      )}

      <PlaylistNameModal
        error={playlistError}
        onClose={() => {
          closePlaylistNameModal();
          setTrackForPlaylist(undefined);
        }}
        onSubmit={submitPlaylistName}
        playlistName={playlistName}
        setPlaylistName={setPlaylistName}
        styles={styles}
        title={renamePlaylistTarget ? 'Rename playlist' : 'Create playlist'}
        visible={createPlaylistVisible || Boolean(renamePlaylistTarget)}
      />

      <AddToPlaylistModal
        colors={colors}
        onClose={() => setTrackForPlaylist(undefined)}
        onCreateNew={() => openCreatePlaylist(trackForPlaylist)}
        onSelect={playlistId => {
          if (trackForPlaylist) {
            addTrackToPlaylistAndClose(playlistId, trackForPlaylist);
          }
        }}
        playlists={playlists}
        styles={styles}
        track={createPlaylistVisible ? undefined : trackForPlaylist}
      />

      <AddTracksToPlaylistModal
        colors={colors}
        onAddTrack={(playlist, track) => {
          addTrackToPlaylist(playlist.id, track.id);
          showToast('Added to playlist');
        }}
        onClose={() => setAddTracksPlaylist(undefined)}
        playlist={addTracksPlaylist}
        styles={styles}
        tracks={tracks}
      />

      <TrackMoreMenu
        colors={colors}
        isFavorite={trackMenuTarget ? isFavorite(trackMenuTarget.id) : false}
        onAddToPlaylist={track => {
          setTrackForPlaylist(track);
          setTrackMenuTarget(undefined);
        }}
        onAddToQueue={track => {
          PlayerService.addToQueue(track);
          setTrackMenuTarget(undefined);
          showToast('Added to queue');
        }}
        onClose={() => setTrackMenuTarget(undefined)}
        onPlayNext={track => {
          PlayerService.playNext(track);
          setTrackMenuTarget(undefined);
          showToast('Added to Up Next');
        }}
        onPlayNow={track => {
          playTrack(track, tracks);
          setTrackMenuTarget(undefined);
        }}
        onToggleFavorite={track => {
          toggleFavorite(track.id);
          setTrackMenuTarget(undefined);
        }}
        onViewDetails={track => {
          setTrackDetailsTarget(track);
          setTrackMenuTarget(undefined);
        }}
        styles={styles}
        track={trackMenuTarget}
      />

      <TrackDetailsModal
        colors={colors}
        onClose={() => setTrackDetailsTarget(undefined)}
        styles={styles}
        track={trackDetailsTarget}
      />

      <QueueModal
        colors={colors}
        currentIndex={queueIndex}
        onClear={() => PlayerService.clearQueue()}
        onClose={() => setQueueVisible(false)}
        onPlayIndex={index => PlayerService.skipToQueueIndex(index)}
        onRemove={index => PlayerService.removeFromQueue(index)}
        queue={queue}
        styles={styles}
        visible={queueVisible}
      />

      <LyricsModal
        onClose={() => setLyricsVisible(false)}
        styles={styles}
        track={activeTrack}
        visible={lyricsVisible}
      />
    </SafeAreaView>
  );
}

function ScreenScaffold({
  children,
  colors,
  isDark,
  isRefreshing,
  onRefresh,
  setRoute,
  styles,
}: {
  children: React.ReactNode;
  colors: TunifyColors;
  isDark: boolean;
  isRefreshing: boolean;
  onRefresh?: () => void;
  setRoute: (route: AppRoute) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.scaffold}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Welcome Back</Text>
          <Text style={styles.headerSubtitle}>Your local music library</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" onPress={() => setRoute('library')} style={styles.headerButton}>
            <Search color={colors.icon} size={24} />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setRoute('settings')} style={styles.headerButton}>
            <Settings color={colors.icon} size={24} />
          </Pressable>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={isDark ? '#fff' : '#111'} />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

function PermissionScreen({
  colors,
  isDenied,
  onOpenSettings,
  onRequest,
  styles,
}: {
  colors: TunifyColors;
  isDenied: boolean;
  onOpenSettings: () => void;
  onRequest: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.permissionScreen}>
      <View style={styles.permissionCard}>
        <AlbumArt colors={colors} size={96} radiusValue={radius.xl} />
        <Text style={styles.permissionTitle}>
          {isDenied ? 'Music access denied' : 'Allow music access'}
        </Text>
        <Text style={styles.permissionText}>
          {isDenied
            ? 'Enable audio permission from Android Settings to use Tunify.'
            : 'Tunify needs access to your audio files to show your local music library.'}
        </Text>
        <PrimaryButton
          icon={isDenied ? Settings : Music}
          label={isDenied ? 'Open Settings' : 'Allow Access'}
          onPress={isDenied ? onOpenSettings : onRequest}
          styles={styles}
        />
      </View>
    </View>
  );
}

function HomeView({
  colors,
  favoriteCount,
  homeTracks,
  isLoading,
  libraryError,
  onCreatePlaylist,
  onOpenPlaylist,
  onPlayAll,
  onRefresh,
  onShuffle,
  playlists,
  recentlyAdded,
  renderTrack,
  styles,
  tracks,
}: {
  colors: TunifyColors;
  favoriteCount: number;
  homeTracks: Track[];
  isLoading: boolean;
  libraryError?: string;
  onCreatePlaylist: () => void;
  onOpenPlaylist: (playlistId: string) => void;
  onPlayAll: () => void;
  onRefresh: () => void;
  onShuffle: () => void;
  playlists: Playlist[];
  recentlyAdded: Track[];
  renderTrack: (track: Track, sourceQueue?: Track[]) => React.ReactNode;
  styles: ReturnType<typeof createStyles>;
  tracks: Track[];
}) {
  const heroTrack = recentlyAdded[0] ?? homeTracks[0];
  const topTracks = homeTracks.slice(0, 6);
  const isDarkPalette = colors.background === '#05070A';
  const primaryActionForeground = isDarkPalette ? '#05070A' : '#FAF8FF';

  return (
    <View>
      <View style={styles.homeHero}>
        <View style={styles.homeHeroArtWrap}>
          <AlbumArt colors={colors} radiusValue={12} size={210} track={heroTrack} />
        </View>
        <Text style={styles.homeHeroLabel}>RECENTLY PLAYED</Text>
        <Text numberOfLines={1} style={styles.homeHeroTitle}>{heroTrack?.title ?? 'No music yet'}</Text>
        <Text numberOfLines={1} style={styles.homeHeroArtist}>{heroTrack?.artist ?? 'Add local tracks to begin'}</Text>
        <Pressable disabled={!tracks.length} onPress={onPlayAll} style={styles.homeHeroPlay}>
          <Play color={primaryActionForeground} size={26} />
        </Pressable>
      </View>

      <View style={styles.statsGrid}>
        <Stat label="Tracks" value={tracks.length} styles={styles} />
        <Stat label="Albums" value={uniqueCount(tracks, 'album')} styles={styles} />
        <Stat label="Artists" value={uniqueCount(tracks, 'artist')} styles={styles} />
        <Stat label="Playlists" value={playlists.length} styles={styles} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.homeActionsScroller}>
        <View style={styles.homeActions}>
          <Pressable disabled={!tracks.length} onPress={onPlayAll} style={[styles.homeActionChip, styles.homeActionChipPrimary]}>
            <Play color={primaryActionForeground} size={20} />
            <Text style={styles.homeActionPrimaryText}>Play All</Text>
          </Pressable>
          <Pressable disabled={!tracks.length} onPress={onShuffle} style={styles.homeActionChip}>
            <Shuffle color={colors.textPrimary} size={20} />
            <Text style={styles.homeActionText}>Shuffle</Text>
          </Pressable>
          <Pressable onPress={onCreatePlaylist} style={styles.homeActionChip}>
            <CirclePlus color={colors.textPrimary} size={20} />
            <Text style={styles.homeActionText}>New Mix</Text>
          </Pressable>
          <View style={styles.homeActionChip}>
            <Heart color={colors.textPrimary} size={20} />
            <Text style={styles.homeActionText}>{favoriteCount} Saved</Text>
          </View>
        </View>
      </ScrollView>

      <SectionHeader action="Refresh" onAction={onRefresh} styles={styles} title="Top Tracks" />
      {isLoading && <Text style={styles.mutedText}>Loading your local library...</Text>}
      {libraryError && <Text style={styles.warningText}>{libraryError}</Text>}
      {!isLoading && !tracks.length && <EmptyState styles={styles} text="No local music found yet." />}
      {topTracks.map(track => renderTrack(track, homeTracks))}

      <SectionHeader styles={styles} title="Local Playlists" />
      {!playlists.length && <EmptyState styles={styles} text="No playlists yet." />}
      {playlists.slice(0, 3).map(playlist => (
        <Pressable key={playlist.id} onPress={() => onOpenPlaylist(playlist.id)} style={styles.playlistCompact}>
          <FolderHeart color={colors.primary} size={24} />
          <View style={styles.trackText}>
            <Text style={styles.playlistTitle}>{playlist.name}</Text>
            <Text style={styles.mutedText}>{playlist.trackIds.length} tracks</Text>
          </View>
        </Pressable>
      ))}

      <SectionHeader styles={styles} title="All Tracks" />
      {homeTracks.map(track => renderTrack(track, homeTracks))}
    </View>
  );
}

function LibraryView({
  colors,
  favoriteTracks,
  isLoading,
  libraryTab,
  onPlayGroup,
  onRefresh,
  onShuffleTracks,
  query,
  renderTrack,
  setLibraryTab,
  setQuery,
  setSortMode,
  sortMode,
  styles,
  tracks,
}: {
  colors: TunifyColors;
  favoriteTracks: Track[];
  isLoading: boolean;
  libraryTab: LibraryTab;
  onPlayGroup: (tracks: Track[]) => void;
  onRefresh: () => void;
  onShuffleTracks: (tracks: Track[]) => void;
  query: string;
  renderTrack: (track: Track, sourceQueue?: Track[]) => React.ReactNode;
  setLibraryTab: (tab: LibraryTab) => void;
  setQuery: (query: string) => void;
  setSortMode: (mode: SortMode) => void;
  sortMode: SortMode;
  styles: ReturnType<typeof createStyles>;
  tracks: Track[];
}) {
  const groupsByTab: Record<Exclude<LibraryTab, 'tracks' | 'favorites'>, TrackGroup[]> = {
    albums: buildGroups(tracks, track => track.album ?? 'Unknown Album', Disc3),
    artists: buildGroups(tracks, track => track.artist ?? 'Unknown Artist', User),
    folders: buildGroups(tracks, folderLabel, Folder),
  };

  const activeGroups =
    libraryTab === 'albums' || libraryTab === 'artists' || libraryTab === 'folders'
      ? groupsByTab[libraryTab]
      : [];
  const tabTracks = libraryTab === 'favorites' ? favoriteTracks : tracks;

  return (
    <View>
      <Text style={styles.pageTitle}>Library</Text>
      <View style={styles.searchBox}>
        <Search color="#8E839E" size={18} />
        <TextInput
          placeholder="Search tracks, artists, albums"
          placeholderTextColor="#8E839E"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroller}>
        {(['tracks', 'albums', 'artists', 'folders', 'favorites'] as LibraryTab[]).map(tab => (
          <TabPill
            active={libraryTab === tab}
            key={tab}
            label={tab}
            onPress={() => setLibraryTab(tab)}
            styles={styles}
          />
        ))}
      </ScrollView>

      {libraryTab === 'tracks' && (
        <View style={styles.segmented}>
          {(['title', 'artist', 'recent'] as SortMode[]).map(mode => (
            <Pressable
              key={mode}
              onPress={() => setSortMode(mode)}
              style={[styles.segment, sortMode === mode && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, sortMode === mode && styles.segmentTextActive]}>{mode}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <SectionHeader action="Refresh" onAction={onRefresh} styles={styles} title={libraryTab === 'tracks' ? 'All Tracks' : libraryTab} />
      {isLoading && <Text style={styles.mutedText}>Syncing library...</Text>}

      {(libraryTab === 'tracks' || libraryTab === 'favorites') && (
        <>
          {libraryTab === 'favorites' && (
            <View style={styles.actionRow}>
              <SecondaryButton disabled={!tabTracks.length} icon={Play} label="Play Favorites" onPress={() => onPlayGroup(tabTracks)} styles={styles} />
              <SecondaryButton disabled={!tabTracks.length} icon={Shuffle} label="Shuffle" onPress={() => onShuffleTracks(tabTracks)} styles={styles} />
            </View>
          )}
          {tabTracks.map(track => renderTrack(track, tabTracks))}
          {!isLoading && !tabTracks.length && (
            <EmptyState styles={styles} text={libraryTab === 'favorites' ? 'No favorites yet' : 'No tracks match your search.'} />
          )}
        </>
      )}

      {activeGroups.map(group => (
        <GroupPanel colors={colors} group={group} key={group.key} onPlay={() => onPlayGroup(group.tracks)} styles={styles} />
      ))}
      {!isLoading && activeGroups.length === 0 && libraryTab !== 'tracks' && libraryTab !== 'favorites' && (
        <EmptyState styles={styles} text="No groups found." />
      )}
    </View>
  );
}

function FavoritesView({
  onPlayAll,
  onShuffle,
  renderTrack,
  styles,
  tracks,
}: {
  onPlayAll: () => void;
  onShuffle: () => void;
  renderTrack: (track: Track) => React.ReactNode;
  styles: ReturnType<typeof createStyles>;
  tracks: Track[];
}) {
  return (
    <View>
      <Text style={styles.pageTitle}>Favorites</Text>
      <View style={styles.actionRow}>
        <PrimaryButton disabled={!tracks.length} icon={Play} label="Play All" onPress={onPlayAll} styles={styles} />
        <SecondaryButton disabled={!tracks.length} icon={Shuffle} label="Shuffle" onPress={onShuffle} styles={styles} />
      </View>
      {tracks.map(renderTrack)}
      {!tracks.length && <EmptyState styles={styles} text="Tap the heart on songs you love." />}
    </View>
  );
}

function PlaylistsView({
  colors,
  onCreate,
  onDelete,
  onOpen,
  onRename,
  playlists,
  styles,
  trackById,
}: {
  colors: TunifyColors;
  onCreate: () => void;
  onDelete: (playlist: Playlist) => void;
  onOpen: (playlistId: string) => void;
  onRename: (playlist: Playlist) => void;
  playlists: Playlist[];
  styles: ReturnType<typeof createStyles>;
  trackById: Map<string, Track>;
}) {
  return (
    <View>
      <View style={styles.rowBetween}>
        <Text style={styles.pageTitle}>Playlists</Text>
        <Pressable onPress={onCreate} style={styles.circleButton}>
          <CirclePlus color={colors.primary} size={24} />
        </Pressable>
      </View>
      {!playlists.length && <EmptyState styles={styles} text="Create a playlist for your local tracks." />}
      {playlists.map(playlist => {
        const coverTrack = playlist.coverTrackId ? trackById.get(playlist.coverTrackId) : undefined;
        return (
          <Pressable key={playlist.id} onPress={() => onOpen(playlist.id)} style={styles.playlistPanel}>
            <View style={styles.playlistCardRow}>
              <AlbumArt colors={colors} size={64} track={coverTrack} />
              <View style={styles.trackText}>
                <Text numberOfLines={1} style={styles.playlistTitle}>{playlist.name}</Text>
                <Text style={styles.mutedText}>{playlist.trackIds.length} tracks</Text>
              </View>
              <Pressable onPress={() => onRename(playlist)} style={styles.trackIconButton}>
                <Pencil color={colors.textMuted} size={19} />
              </Pressable>
              <Pressable onPress={() => onDelete(playlist)} style={styles.trackIconButton}>
                <Trash2 color={colors.danger} size={19} />
              </Pressable>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function PlaylistDetailView({
  colors,
  onAddTracks,
  onBack,
  onDelete,
  onPlayTrack,
  onRemoveTrack,
  onRename,
  onShuffle,
  playlist,
  playlistTracks,
  renderTrack,
  styles,
}: {
  colors: TunifyColors;
  onAddTracks: (playlist: Playlist) => void;
  onBack: () => void;
  onDelete: (playlist: Playlist) => void;
  onPlayTrack: (track: Track, queue?: Track[]) => Promise<void>;
  onRemoveTrack: (playlistId: string, trackId: string) => Promise<void>;
  onRename: (playlist: Playlist) => void;
  onShuffle: (playlistTracks: Track[]) => void;
  playlist?: Playlist;
  playlistTracks: Track[];
  renderTrack: (track: Track, sourceQueue?: Track[]) => React.ReactNode;
  styles: ReturnType<typeof createStyles>;
}) {
  if (!playlist) {
    return (
      <View>
        <SecondaryButton icon={ChevronDown} label="Back" onPress={onBack} styles={styles} />
        <EmptyState styles={styles} text="Playlist not found." />
      </View>
    );
  }

  return (
    <View>
      <Pressable onPress={onBack} style={styles.backRow}>
        <ChevronDown color={colors.textMuted} size={20} />
        <Text style={styles.backText}>Playlists</Text>
      </Pressable>
      <View style={styles.rowBetween}>
        <View style={styles.trackText}>
          <Text numberOfLines={2} style={styles.pageTitle}>{playlist.name}</Text>
          <Text style={styles.mutedText}>{playlistTracks.length} tracks</Text>
        </View>
        <FolderHeart color={colors.primary} size={34} />
      </View>
      <View style={styles.actionRow}>
        <PrimaryButton disabled={!playlistTracks.length} icon={Play} label="Play" onPress={() => playlistTracks[0] && onPlayTrack(playlistTracks[0], playlistTracks)} styles={styles} />
        <SecondaryButton disabled={!playlistTracks.length} icon={Shuffle} label="Shuffle" onPress={() => onShuffle(playlistTracks)} styles={styles} />
        <SecondaryButton icon={CirclePlus} label="Add Tracks" onPress={() => onAddTracks(playlist)} styles={styles} />
      </View>
      <View style={styles.actionRow}>
        <SecondaryButton icon={Pencil} label="Rename" onPress={() => onRename(playlist)} styles={styles} />
        <DangerButton icon={Trash2} label="Delete" onPress={() => onDelete(playlist)} styles={styles} />
      </View>
      {!playlistTracks.length && <EmptyState styles={styles} text="No tracks in this playlist." />}
      {playlistTracks.map(track => (
        <View key={track.id}>
          {renderTrack(track, playlistTracks)}
          <Pressable onPress={() => onRemoveTrack(playlist.id, track.id)} style={styles.inlineRemove}>
            <Trash2 color={colors.danger} size={16} />
            <Text style={styles.removeText}>Remove from playlist</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function SettingsView({
  audioPermission,
  colors,
  discordError,
  discordPayload,
  discordStatus,
  onClearCache,
  onClearQueue,
  onClearDiscordPresence,
  onConnectDiscord,
  onDisconnectDiscord,
  onOpenSettings,
  onRefresh,
  onRequestPermission,
  onTestDiscordPresence,
  setUploadLocalAlbumArtEnabled,
  setThemeMode,
  styles,
  themeMode,
  uploadLocalAlbumArtEnabled,
}: {
  audioPermission: string;
  colors: TunifyColors;
  discordError?: string;
  discordPayload?: DiscordPresencePayload;
  discordStatus: string;
  onClearCache: () => void;
  onClearQueue: () => void;
  onClearDiscordPresence: () => void;
  onConnectDiscord: () => void;
  onDisconnectDiscord: () => void;
  onOpenSettings: () => void;
  onRefresh: () => void;
  onRequestPermission: () => void;
  onTestDiscordPresence: () => void;
  setUploadLocalAlbumArtEnabled: (enabled: boolean) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  styles: ReturnType<typeof createStyles>;
  themeMode: ThemeMode;
  uploadLocalAlbumArtEnabled: boolean;
}) {
  return (
    <View>
      <Text style={styles.pageTitle}>Settings</Text>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Appearance</Text>
        <View style={styles.segmented}>
          {(['system', 'light', 'dark'] as ThemeMode[]).map(mode => (
            <Pressable
              key={mode}
              onPress={() => setThemeMode(mode)}
              style={[styles.segment, themeMode === mode && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, themeMode === mode && styles.segmentTextActive]}>{mode}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Library</Text>
        <Text style={styles.payloadLine}>Audio permission: {audioPermission}</Text>
        <SecondaryButton icon={Music} label="Request Audio Access" onPress={onRequestPermission} styles={styles} />
        <SecondaryButton icon={Settings} label="Open App Settings" onPress={onOpenSettings} styles={styles} />
        <SecondaryButton icon={Repeat} label="Refresh Library" onPress={onRefresh} styles={styles} />
        <DangerButton icon={Trash2} label="Clear Library Cache" onPress={onClearCache} styles={styles} />
      </View>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Playback</Text>
        <SecondaryButton icon={ListMusic} label="Clear Queue" onPress={onClearQueue} styles={styles} />
      </View>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Discord Presence</Text>
        <Text style={styles.payloadLine}>Status: {discordStatus}</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Upload local album art for Discord</Text>
          <Switch
            onValueChange={enabled => {
              setUploadLocalAlbumArtEnabled(enabled);
            }}
            thumbColor={uploadLocalAlbumArtEnabled ? colors.primary : colors.textMuted}
            trackColor={{
              false: colors.surfaceSoft,
              true: colors.accentSoft,
            }}
            value={uploadLocalAlbumArtEnabled}
          />
        </View>
        {discordError && <Text style={styles.warningText}>{discordError}</Text>}
        {discordPayload && (
          <View style={styles.payloadPreview}>
            <Text style={styles.payloadLine}>Title: {discordPayload.title}</Text>
            <Text style={styles.payloadLine}>Artist: {discordPayload.artist ?? 'Unknown Artist'}</Text>
            <Text style={styles.payloadLine}>Image: {discordPayload.largeImage}</Text>
          </View>
        )}
        <View style={styles.actionRow}>
          <PrimaryButton icon={Music} label="Connect Discord" onPress={onConnectDiscord} styles={styles} />
          <SecondaryButton icon={Play} label="Test Presence" onPress={onTestDiscordPresence} styles={styles} />
        </View>
        <View style={styles.actionRow}>
          <SecondaryButton icon={Repeat} label="Clear Presence" onPress={onClearDiscordPresence} styles={styles} />
          <DangerButton icon={Trash2} label="Disconnect" onPress={onDisconnectDiscord} styles={styles} />
        </View>
      </View>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>About</Text>
        <Text style={styles.payloadLine}>Tunify mobile local music player</Text>
      </View>
    </View>
  );
}

function NowPlayingScreen({
  colors,
  duration,
  isDark,
  isFavorite,
  isPlaying,
  onBack,
  onFavorite,
  onLyrics,
  onNext,
  onOpenQueue,
  onPause,
  onPlay,
  onPrevious,
  onRepeat,
  onSeek,
  onShuffle,
  position,
  repeatMode,
  shuffleEnabled,
  styles,
  track,
}: {
  colors: TunifyColors;
  duration: number;
  isDark: boolean;
  isFavorite: boolean;
  isPlaying: boolean;
  onBack: () => void;
  onFavorite: () => void;
  onLyrics: () => void;
  onNext: () => void;
  onOpenQueue: () => void;
  onPause: () => void;
  onPlay: () => void;
  onPrevious: () => void;
  onRepeat: () => void;
  onSeek: (seconds: number) => void;
  onShuffle: () => void;
  position: number;
  repeatMode: RepeatMode;
  shuffleEnabled: boolean;
  styles: ReturnType<typeof createStyles>;
  track?: Track;
}) {
  const playIconColor = isDark ? '#05070A' : '#FAF8FF';

  return (
    <View style={[styles.nowPlayingScreen, isDark && styles.nowPlayingDark]}>
      <View style={styles.nowHeader}>
        <Pressable onPress={onBack} style={styles.headerButton}>
          <ChevronDown color={colors.icon} size={28} />
        </Pressable>
        <Text style={styles.nowHeaderTitle}>Now Playing</Text>
        <Pressable onPress={onOpenQueue} style={styles.headerButton}>
          <ListMusic color={colors.icon} size={24} />
        </Pressable>
      </View>

      <View style={styles.nowBody}>
        <View style={styles.nowArtworkShell}>
          <AlbumArt colors={colors} radiusValue={32} size={300} track={track} />
        </View>
        <View style={styles.nowInfoRow}>
          <Pressable onPress={onFavorite} style={styles.favoriteBig}>
            <Heart color={colors.textSecondary} fill={isFavorite ? colors.textSecondary : 'transparent'} size={24} />
          </Pressable>
          <View style={styles.nowTitleWrap}>
            <Text numberOfLines={1} style={styles.nowTitle}>{track?.title ?? 'No track selected'}</Text>
            <Text numberOfLines={1} style={styles.nowArtist}>{track?.artist ?? 'Unknown Artist'}</Text>
          </View>
          <Pressable onPress={onLyrics} style={styles.favoriteBig}>
            <MoreVertical color={colors.textSecondary} size={24} />
          </Pressable>
        </View>
        <ProgressBar
          colors={colors}
          duration={duration}
          onSeek={onSeek}
          position={position}
          showTimes
          styles={styles}
        />
        <View style={styles.controlsRow}>
          <Pressable onPress={onShuffle} style={styles.controlButton}>
            <Shuffle color={shuffleEnabled ? colors.primary : colors.textSecondary} size={24} />
          </Pressable>
          <Pressable onPress={onPrevious} style={styles.controlButtonLarge}>
            <SkipBack color={colors.textPrimary} size={36} />
          </Pressable>
          <Pressable onPress={isPlaying ? onPause : onPlay} style={styles.playButtonHuge}>
            {isPlaying ? <Pause color={playIconColor} size={40} /> : <Play color={playIconColor} size={40} />}
          </Pressable>
          <Pressable onPress={onNext} style={styles.controlButtonLarge}>
            <SkipForward color={colors.textPrimary} size={36} />
          </Pressable>
          <Pressable onPress={onRepeat} style={styles.controlButton}>
            <Repeat color={repeatMode === RepeatMode.Off ? colors.textSecondary : colors.primary} size={24} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function MiniPlayer({
  colors,
  duration,
  isFavorite,
  isPlaying,
  onFavorite,
  onOpen,
  onPause,
  onPlay,
  position,
  styles,
  track,
}: {
  colors: TunifyColors;
  duration: number;
  isFavorite: boolean;
  isPlaying: boolean;
  onFavorite: () => void;
  onOpen: () => void;
  onPause: () => void;
  onPlay: () => void;
  position: number;
  styles: ReturnType<typeof createStyles>;
  track: Track;
}) {
  const progress = (duration > 0 ? `${clamp(position / duration) * 100}%` : '0%') as DimensionValue;
  const isDarkPalette = colors.background === '#05070A';
  const miniForeground = isDarkPalette ? '#05070A' : '#FFFFFF';
  const miniPlayIcon = isDarkPalette ? '#FFFFFF' : '#05070A';

  return (
    <Pressable onPress={onOpen} style={styles.miniPlayer}>
      <AlbumArt colors={colors} size={52} track={track} />
      <View style={styles.miniInfo}>
        <Text numberOfLines={1} style={styles.miniTitle}>{track.title}</Text>
        <Text numberOfLines={1} style={styles.miniArtist}>{track.artist ?? 'Unknown Artist'}</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: progress }]} /></View>
      </View>
      <Pressable onPress={onFavorite} style={styles.trackIconButton}>
        <Heart color={miniForeground} fill={isFavorite ? miniForeground : 'transparent'} size={24} />
      </Pressable>
      <Pressable onPress={isPlaying ? onPause : onPlay} style={styles.miniButton}>
        {isPlaying ? <Pause color={miniPlayIcon} size={24} /> : <Play color={miniPlayIcon} size={24} />}
      </Pressable>
    </Pressable>
  );
}

function BottomTabs({
  colors,
  route,
  setRoute,
  styles,
}: {
  colors: TunifyColors;
  route: AppRoute;
  setRoute: (route: AppRoute) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const tabs: Array<{ route: AppRoute; label: string; icon: IconType }> = [
    { route: 'home', label: 'Home', icon: Home },
    { route: 'library', label: 'Library', icon: Library },
    { route: 'favorites', label: 'Saved', icon: Heart },
    { route: 'playlists', label: 'Mixes', icon: ListMusic },
    { route: 'settings', label: 'Settings', icon: Settings },
  ];
  const activeRoute = route === 'playlistDetail' ? 'playlists' : route;

  return (
    <View style={styles.bottomNav}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        const active = activeRoute === tab.route;
        return (
          <Pressable key={tab.route} onPress={() => setRoute(tab.route)} style={styles.navItem}>
            <Icon color={active ? colors.textPrimary : colors.textMuted} size={22} />
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TrackRow({
  colors,
  isFavorite,
  isPlaying,
  onMore,
  onPress,
  onToggleFavorite,
  styles,
  track,
}: {
  colors: TunifyColors;
  isFavorite: boolean;
  isPlaying: boolean;
  onMore: () => void;
  onPress: () => void;
  onToggleFavorite: () => void;
  styles: ReturnType<typeof createStyles>;
  track: Track;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.trackRow, isPlaying && styles.trackRowActive]}>
      <AlbumArt colors={colors} size={54} track={track} />
      <View style={styles.trackText}>
        <Text numberOfLines={1} style={styles.trackTitle}>{track.title}</Text>
        <Text numberOfLines={1} style={styles.trackMeta}>{track.artist} / {track.album}</Text>
      </View>
      <Text style={styles.duration}>{formatDuration(track.duration)}</Text>
      <Pressable onPress={onToggleFavorite} style={styles.trackIconButton}>
        <Heart color={colors.accent} fill={isFavorite ? colors.accent : 'transparent'} size={20} />
      </Pressable>
      <Pressable onPress={onMore} style={styles.trackIconButton}>
        <MoreVertical color={colors.textMuted} size={20} />
      </Pressable>
    </Pressable>
  );
}

function GroupPanel({
  colors,
  group,
  onPlay,
  styles,
}: {
  colors: TunifyColors;
  group: TrackGroup;
  onPlay: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const Icon = group.icon;
  return (
    <View style={styles.groupPanel}>
      <View style={styles.rowBetween}>
        <View style={styles.groupTitleRow}>
          <Icon color={colors.primary} size={24} />
          <View style={styles.trackText}>
            <Text numberOfLines={1} style={styles.playlistTitle}>{group.title}</Text>
            <Text style={styles.mutedText}>{group.subtitle}</Text>
          </View>
        </View>
        <Pressable onPress={onPlay} style={styles.circleButtonSmall}>
          <Play color={colors.primary} size={18} />
        </Pressable>
      </View>
      {group.tracks.slice(0, 3).map(track => (
        <Text key={track.id} numberOfLines={1} style={styles.groupTrackText}>{track.title}</Text>
      ))}
    </View>
  );
}

function AddToPlaylistModal({
  colors,
  onClose,
  onCreateNew,
  onSelect,
  playlists,
  styles,
  track,
}: {
  colors: TunifyColors;
  onClose: () => void;
  onCreateNew: () => void;
  onSelect: (playlistId: string) => void;
  playlists: Playlist[];
  styles: ReturnType<typeof createStyles>;
  track?: Track;
}) {
  return (
    <Modal transparent animationType="fade" visible={Boolean(track)} onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.panelTitle}>Add to playlist</Text>
          <Text numberOfLines={1} style={styles.mutedText}>{track?.title}</Text>
          {playlists.map(playlist => (
            <Pressable key={playlist.id} onPress={() => onSelect(playlist.id)} style={styles.modalRow}>
              <Disc3 color={colors.primary} size={22} />
              <Text style={styles.modalRowText}>{playlist.name}</Text>
            </Pressable>
          ))}
          <Pressable onPress={onCreateNew} style={styles.modalRow}>
            <CirclePlus color={colors.primary} size={22} />
            <Text style={styles.modalRowText}>Create new playlist</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

function AddTracksToPlaylistModal({
  colors,
  onAddTrack,
  onClose,
  playlist,
  styles,
  tracks,
}: {
  colors: TunifyColors;
  onAddTrack: (playlist: Playlist, track: Track) => void;
  onClose: () => void;
  playlist?: Playlist;
  styles: ReturnType<typeof createStyles>;
  tracks: Track[];
}) {
  const added = new Set(playlist?.trackIds ?? []);

  return (
    <Modal transparent animationType="slide" visible={Boolean(playlist)} onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.modalBackdrop}>
        <View style={styles.largeModalCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.panelTitle}>Add tracks</Text>
            <Pressable onPress={onClose} style={styles.trackIconButton}>
              <X color={colors.textMuted} size={22} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {tracks.map(track => {
              const isAdded = added.has(track.id);
              return (
                <Pressable
                  disabled={isAdded || !playlist}
                  key={track.id}
                  onPress={() => playlist && onAddTrack(playlist, track)}
                  style={styles.modalTrackRow}
                >
                  <AlbumArt colors={colors} size={42} track={track} />
                  <View style={styles.trackText}>
                    <Text numberOfLines={1} style={styles.trackTitle}>{track.title}</Text>
                    <Text numberOfLines={1} style={styles.trackMeta}>{track.artist}</Text>
                  </View>
                  <Text style={isAdded ? styles.addedText : styles.sectionAction}>{isAdded ? 'Added' : 'Add'}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

function PlaylistNameModal({
  error,
  onClose,
  onSubmit,
  playlistName,
  setPlaylistName,
  styles,
  title,
  visible,
}: {
  error?: string;
  onClose: () => void;
  onSubmit: () => void;
  playlistName: string;
  setPlaylistName: (value: string) => void;
  styles: ReturnType<typeof createStyles>;
  title: string;
  visible: boolean;
}) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.panelTitle}>{title}</Text>
          <TextInput
            maxLength={40}
            placeholder="Playlist name"
            placeholderTextColor="#8E839E"
            value={playlistName}
            onChangeText={setPlaylistName}
            style={styles.modalInput}
          />
          {error && <Text style={styles.warningText}>{error}</Text>}
          <PrimaryButton icon={CirclePlus} label="Save Playlist" onPress={onSubmit} styles={styles} />
        </View>
      </Pressable>
    </Modal>
  );
}

function TrackMoreMenu({
  colors,
  isFavorite,
  onAddToPlaylist,
  onAddToQueue,
  onClose,
  onPlayNext,
  onPlayNow,
  onToggleFavorite,
  onViewDetails,
  styles,
  track,
}: {
  colors: TunifyColors;
  isFavorite: boolean;
  onAddToPlaylist: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onClose: () => void;
  onPlayNext: (track: Track) => void;
  onPlayNow: (track: Track) => void;
  onToggleFavorite: (track: Track) => void;
  onViewDetails: (track: Track) => void;
  styles: ReturnType<typeof createStyles>;
  track?: Track;
}) {
  const actions = track
    ? [
        { label: 'Play Now', icon: Play, onPress: () => onPlayNow(track) },
        { label: 'Play Next', icon: ListEnd, onPress: () => onPlayNext(track) },
        { label: 'Add to Queue', icon: ListPlus, onPress: () => onAddToQueue(track) },
        { label: 'Add to Playlist', icon: CirclePlus, onPress: () => onAddToPlaylist(track) },
        { label: isFavorite ? 'Remove Favorite' : 'Add Favorite', icon: Heart, onPress: () => onToggleFavorite(track) },
        { label: 'View Details', icon: Info, onPress: () => onViewDetails(track) },
      ]
    : [];

  return (
    <Modal transparent animationType="fade" visible={Boolean(track)} onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text numberOfLines={1} style={styles.panelTitle}>{track?.title}</Text>
          {actions.map(action => {
            const Icon = action.icon;
            return (
              <Pressable key={action.label} onPress={action.onPress} style={styles.modalRow}>
                <Icon color={colors.primary} size={22} />
                <Text style={styles.modalRowText}>{action.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
}

function TrackDetailsModal({
  colors,
  onClose,
  styles,
  track,
}: {
  colors: TunifyColors;
  onClose: () => void;
  styles: ReturnType<typeof createStyles>;
  track?: Track;
}) {
  const details = track
    ? [
        ['Title', track.title],
        ['Artist', track.artist ?? 'Unknown Artist'],
        ['Album', track.album ?? 'Unknown Album'],
        ['Duration', formatDuration(track.duration)],
        ['File', track.fileName ?? track.url],
        ['Folder', track.folderPath ?? 'Unknown Folder'],
        ['Mime', track.mimeType ?? 'Unknown mime'],
        ['Size', formatBytes(track.fileSize ?? track.size)],
        ['Added', formatDate(track.dateAdded)],
      ]
    : [];

  return (
    <Modal transparent animationType="fade" visible={Boolean(track)} onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.panelTitle}>Track details</Text>
            <X color={colors.textMuted} size={22} />
          </View>
          {details.map(([label, value]) => (
            <View key={label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text numberOfLines={2} style={styles.detailValue}>{value}</Text>
            </View>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

function QueueModal({
  colors,
  currentIndex,
  onClear,
  onClose,
  onPlayIndex,
  onRemove,
  queue,
  styles,
  visible,
}: {
  colors: TunifyColors;
  currentIndex: number;
  onClear: () => void;
  onClose: () => void;
  onPlayIndex: (index: number) => void;
  onRemove: (index: number) => void;
  queue: Track[];
  styles: ReturnType<typeof createStyles>;
  visible: boolean;
}) {
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.modalBackdrop}>
        <View style={styles.largeModalCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.panelTitle}>Up Next</Text>
            <View style={styles.rowInline}>
              <Pressable onPress={onClear} style={styles.trackIconButton}>
                <Trash2 color={colors.danger} size={20} />
              </Pressable>
              <Pressable onPress={onClose} style={styles.trackIconButton}>
                <X color={colors.textMuted} size={22} />
              </Pressable>
            </View>
          </View>
          {!queue.length && <EmptyState styles={styles} text="Queue is empty." />}
          <ScrollView showsVerticalScrollIndicator={false}>
            {queue.map((track, index) => (
              <Pressable
                key={`${track.id}-${index}`}
                onPress={() => onPlayIndex(index)}
                style={[styles.modalTrackRow, currentIndex === index && styles.trackRowActive]}
              >
                <AlbumArt colors={colors} size={42} track={track} />
                <View style={styles.trackText}>
                  <Text numberOfLines={1} style={styles.trackTitle}>{track.title}</Text>
                  <Text numberOfLines={1} style={styles.trackMeta}>{currentIndex === index ? 'Now Playing' : track.artist}</Text>
                </View>
                {currentIndex !== index && (
                  <Pressable onPress={() => onRemove(index)} style={styles.trackIconButton}>
                    <X color={colors.textMuted} size={18} />
                  </Pressable>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

function LyricsModal({
  onClose,
  styles,
  track,
  visible,
}: {
  onClose: () => void;
  styles: ReturnType<typeof createStyles>;
  track?: Track;
  visible: boolean;
}) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.panelTitle}>Lyrics</Text>
          <Text style={styles.mutedText}>{track?.title ?? 'No track selected'}</Text>
          <EmptyState styles={styles} text="Lyrics are not available for this local file." />
        </View>
      </Pressable>
    </Modal>
  );
}

function ProgressBar({
  colors,
  duration,
  onSeek,
  position,
  showTimes,
  styles,
}: {
  colors: TunifyColors;
  duration: number;
  onSeek: (seconds: number) => void;
  position: number;
  showTimes?: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  const [width, setWidth] = useState(1);
  const progress = duration > 0 ? clamp(position / duration) : 0;
  const progressWidth = `${progress * 100}%` as DimensionValue;

  const seek = (event: GestureResponderEvent) => {
    if (!duration) {
      return;
    }

    const fraction = clamp(event.nativeEvent.locationX / width);
    onSeek(duration * fraction);
  };

  return (
    <View style={styles.progressShell}>
      <Pressable
        onLayout={event => setWidth(event.nativeEvent.layout.width || 1)}
        onPress={seek}
        style={styles.progressBar}
      >
        <View style={[styles.progressBarFill, { backgroundColor: colors.textPrimary, width: progressWidth }]} />
        <View style={[styles.progressThumb, { left: progressWidth }]} />
      </Pressable>
      {showTimes && (
        <View style={styles.rowBetween}>
          <Text style={styles.progressTime}>{formatDuration(position)}</Text>
          <Text style={styles.progressTime}>-{formatDuration(Math.max(duration - position, 0))}</Text>
        </View>
      )}
    </View>
  );
}

function PrimaryButton({
  disabled,
  icon: Icon,
  label,
  onPress,
  styles,
}: {
  disabled?: boolean;
  icon: IconType;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <AppButton disabled={disabled} icon={Icon} label={label} onPress={onPress} variant="primary" />
  );
}

function SecondaryButton({
  disabled,
  icon: Icon,
  label,
  onPress,
  styles,
}: {
  disabled?: boolean;
  icon: IconType;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <AppButton disabled={disabled} icon={Icon} label={label} onPress={onPress} variant="secondary" />
  );
}

function DangerButton({
  icon: Icon,
  label,
  onPress,
  styles,
}: {
  icon: IconType;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <AppButton icon={Icon} label={label} onPress={onPress} variant="danger" />
  );
}

function SectionHeader({
  action,
  onAction,
  styles,
  title,
}: {
  action?: string;
  onAction?: () => void;
  styles: ReturnType<typeof createStyles>;
  title: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && <Pressable onPress={onAction}><Text style={styles.sectionAction}>{action}</Text></Pressable>}
    </View>
  );
}

function Stat({ label, value, styles }: { label: string; value: number; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ styles, text }: { styles: ReturnType<typeof createStyles>; text: string }) {
  return (
    <View style={styles.emptyState}>
      <Music color="#8E839E" size={34} />
      <Text style={styles.mutedText}>{text}</Text>
    </View>
  );
}

function TabPill({
  active,
  label,
  onPress,
  styles,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tabPill, active && styles.tabPillActive]}>
      <Text style={[styles.tabPillText, active && styles.tabPillTextActive]}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (colors: TunifyColors, isDark: boolean) =>
  StyleSheet.create({
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    scaffold: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: 196,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 76,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    nowHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 64,
      paddingHorizontal: spacing.xl,
      zIndex: 2,
    },
    headerButton: {
      alignItems: 'center',
      borderRadius: radius.pill,
      height: 46,
      justifyContent: 'center',
      width: 46,
    },
    headerCopy: {
      flex: 1,
      minWidth: 0,
    },
    headerActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
    },
    headerCenter: {
      alignItems: 'center',
    },
    headerEyebrow: {
      color: colors.textMuted,
      fontFamily: typography.fontFamily.extraBold,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    brand: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.extraBold,
      fontSize: 18,
      fontWeight: '900',
    },
    headerTitle: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.semiBold,
      fontSize: 21,
      fontWeight: '700',
      lineHeight: 28,
    },
    headerSubtitle: {
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.medium,
      fontSize: 19,
      fontWeight: '500',
      lineHeight: 26,
    },
    pageTitle: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.extraBold,
      fontSize: 34,
      fontWeight: '900',
      lineHeight: 40,
      marginBottom: spacing.lg,
    },
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    homeHero: {
      alignItems: 'center',
      backgroundColor: isDark ? '#0F172A' : '#E9EEF6',
      borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#DCE3EE',
      borderRadius: 24,
      borderWidth: 1,
      marginBottom: spacing.xl,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xxl,
      shadowColor: isDark ? '#E0F2FE' : '#B7C9D5',
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: isDark ? 0.14 : 0.24,
      shadowRadius: 30,
    },
    homeHeroArtWrap: {
      borderRadius: 14,
      marginBottom: spacing.xl,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.22,
      shadowRadius: 24,
    },
    homeHeroLabel: {
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.medium,
      fontSize: 16,
      fontWeight: '500',
      letterSpacing: 0,
      marginBottom: spacing.md,
      textTransform: 'uppercase',
    },
    homeHeroTitle: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.semiBold,
      fontSize: 22,
      fontWeight: '700',
      maxWidth: '88%',
      textAlign: 'center',
    },
    homeHeroArtist: {
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.medium,
      fontSize: 19,
      fontWeight: '500',
      marginTop: spacing.sm,
      maxWidth: '88%',
      textAlign: 'center',
    },
    homeHeroPlay: {
      alignItems: 'center',
      backgroundColor: isDark ? '#FFFFFF' : '#1B1C1C',
      borderRadius: radius.pill,
      height: 80,
      justifyContent: 'center',
      marginTop: spacing.xxl,
      shadowColor: isDark ? '#B7C9D5' : '#1B1C1C',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.34 : 0.18,
      shadowRadius: 22,
      width: 80,
    },
    homeActionsScroller: {
      marginBottom: spacing.xl,
      overflow: 'visible',
    },
    homeActions: {
      flexDirection: 'row',
      gap: spacing.md,
      paddingRight: spacing.lg,
    },
    homeActionChip: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.divider,
      borderRadius: radius.pill,
      borderWidth: 1,
      flexDirection: 'row',
      gap: spacing.sm,
      minHeight: 58,
      paddingHorizontal: spacing.lg,
    },
    homeActionChipPrimary: {
      backgroundColor: isDark ? '#FFFFFF' : '#1B1C1C',
      borderColor: isDark ? '#FFFFFF' : '#1B1C1C',
      shadowColor: isDark ? '#FFFFFF' : '#1B1C1C',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 18,
    },
    homeActionText: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.semiBold,
      fontSize: 16,
      fontWeight: '700',
    },
    homeActionPrimaryText: {
      color: isDark ? '#05070A' : '#FAF8FF',
      fontFamily: typography.fontFamily.semiBold,
      fontSize: 16,
      fontWeight: '700',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    stat: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderColor: colors.divider,
      borderWidth: 1,
      flexBasis: '48%',
      flexGrow: 1,
      minHeight: 108,
      padding: spacing.lg,
    },
    statValue: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.medium,
      fontSize: 22,
      fontWeight: '500',
      textAlign: 'center',
    },
    statLabel: {
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.medium,
      fontSize: 18,
      fontWeight: '500',
      marginTop: spacing.sm,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    shortcutRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    shortcutCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      flex: 1,
      minHeight: 112,
      padding: spacing.base,
    },
    shortcutLabel: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.extraBold,
      fontSize: 16,
      fontWeight: '900',
      marginTop: spacing.md,
    },
    shortcutValue: {
      color: colors.textMuted,
      fontFamily: typography.fontFamily.bold,
      fontSize: 12,
      fontWeight: '700',
      marginTop: 2,
    },
    sectionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
      marginTop: spacing.xl,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.semiBold,
      fontSize: 20,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    sectionAction: {
      color: colors.primary,
      fontFamily: typography.fontFamily.extraBold,
      fontSize: 13,
      fontWeight: '900',
    },
    trackRow: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: 'transparent',
      borderRadius: radius.md,
      borderWidth: 1,
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.sm,
      minHeight: 78,
      padding: spacing.md,
    },
    trackRowActive: {
      backgroundColor: isDark ? '#1D232D' : '#EEF2F8',
      borderColor: colors.divider,
    },
    trackText: {
      flex: 1,
      minWidth: 0,
    },
    trackTitle: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.semiBold,
      fontSize: 16,
      fontWeight: '700',
    },
    trackMeta: {
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.medium,
      fontSize: 14,
      fontWeight: '500',
      marginTop: 3,
    },
    duration: {
      color: colors.textMuted,
      fontFamily: typography.fontFamily.medium,
      fontSize: 12,
      fontWeight: '500',
    },
    trackIconButton: {
      alignItems: 'center',
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    searchBox: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.divider,
      borderWidth: 1,
      borderRadius: radius.pill,
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
      minHeight: 50,
      paddingHorizontal: spacing.base,
    },
    searchInput: {
      color: colors.textPrimary,
      flex: 1,
      fontFamily: typography.fontFamily.bold,
      fontSize: 14,
      fontWeight: '700',
    },
    tabScroller: {
      marginBottom: spacing.md,
    },
    tabPill: {
      backgroundColor: colors.surface,
      borderColor: colors.divider,
      borderWidth: 1,
      borderRadius: radius.pill,
      marginRight: spacing.sm,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
    },
    tabPillActive: {
      backgroundColor: isDark ? '#FFFFFF' : '#1B1C1C',
      borderColor: isDark ? '#FFFFFF' : '#1B1C1C',
    },
    tabPillText: {
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.extraBold,
      fontSize: 12,
      fontWeight: '900',
      textTransform: 'capitalize',
    },
    tabPillTextActive: {
      color: isDark ? '#05070A' : '#FAF8FF',
    },
    mutedText: {
      color: colors.textMuted,
      fontFamily: typography.fontFamily.bold,
      fontSize: 13,
      fontWeight: '700',
    },
    warningText: {
      color: colors.danger,
      fontFamily: typography.fontFamily.bold,
      fontSize: 13,
      fontWeight: '800',
      marginBottom: spacing.md,
    },
    emptyState: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      gap: spacing.md,
      justifyContent: 'center',
      minHeight: 126,
      padding: spacing.lg,
    },
    miniPlayer: {
      alignItems: 'center',
      backgroundColor: isDark ? '#FFFFFF' : '#05070A',
      borderColor: isDark ? '#FFFFFF' : '#222530',
      borderRadius: 24,
      borderWidth: 1,
      bottom: 84,
      flexDirection: 'row',
      gap: spacing.md,
      left: spacing.lg,
      minHeight: 82,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      position: 'absolute',
      right: spacing.lg,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.26,
      shadowRadius: 22,
    },
    miniInfo: {
      flex: 1,
      minWidth: 0,
    },
    miniTitle: {
      color: isDark ? '#05070A' : '#FFFFFF',
      fontFamily: typography.fontFamily.semiBold,
      fontSize: 17,
      fontWeight: '700',
    },
    miniArtist: {
      color: isDark ? '#566771' : '#D4C0D7',
      fontFamily: typography.fontFamily.medium,
      fontSize: 14,
      fontWeight: '500',
      marginTop: 2,
      marginBottom: spacing.sm,
    },
    miniButton: {
      alignItems: 'center',
      backgroundColor: isDark ? '#05070A' : '#FFFFFF',
      borderRadius: radius.pill,
      height: 46,
      justifyContent: 'center',
      width: 46,
    },
    progressTrack: {
      backgroundColor: isDark ? '#D8DDE5' : '#32343E',
      borderRadius: radius.pill,
      height: 4,
      overflow: 'hidden',
    },
    progressFill: {
      backgroundColor: isDark ? '#05070A' : '#FFFFFF',
      borderRadius: radius.pill,
      height: 4,
    },
    bottomNav: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.divider,
      borderRadius: 24,
      borderWidth: 1,
      bottom: spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-around',
      left: 0,
      minHeight: 78,
      position: 'absolute',
      right: 0,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
    },
    navItem: {
      alignItems: 'center',
      minWidth: 62,
    },
    navLabel: {
      color: colors.textMuted,
      fontFamily: typography.fontFamily.medium,
      fontSize: 11,
      fontWeight: '500',
      marginTop: 2,
    },
    navLabelActive: {
      color: colors.textPrimary,
    },
    permissionScreen: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: spacing.xl,
    },
    permissionCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.xl,
      width: '100%',
    },
    permissionTitle: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.extraBold,
      fontSize: 24,
      fontWeight: '900',
      marginTop: spacing.lg,
      textAlign: 'center',
    },
    permissionText: {
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.bold,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 22,
      marginVertical: spacing.lg,
      textAlign: 'center',
    },
    rowBetween: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    rowInline: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
    },
    circleButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.pill,
      height: 46,
      justifyContent: 'center',
      width: 46,
    },
    circleButtonSmall: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSoft,
      borderRadius: radius.pill,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    playlistPanel: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      marginBottom: spacing.md,
      padding: spacing.base,
    },
    playlistCompact: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.sm,
      minHeight: 64,
      padding: spacing.base,
    },
    playlistCardRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.md,
    },
    playlistTitle: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.extraBold,
      fontSize: 18,
      fontWeight: '900',
    },
    groupPanel: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      gap: spacing.sm,
      marginBottom: spacing.md,
      padding: spacing.base,
    },
    groupTitleRow: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      gap: spacing.md,
    },
    groupTrackText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
      marginLeft: 36,
    },
    backRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    backText: {
      color: colors.textMuted,
      fontFamily: typography.fontFamily.extraBold,
      fontSize: 13,
      fontWeight: '900',
    },
    inlineRemove: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
      marginLeft: spacing.md,
    },
    removeText: {
      color: colors.danger,
      fontFamily: typography.fontFamily.extraBold,
      fontSize: 12,
      fontWeight: '900',
    },
    panel: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      gap: spacing.md,
      marginBottom: spacing.lg,
      padding: spacing.base,
    },
    panelTitle: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.extraBold,
      fontSize: 18,
      fontWeight: '900',
    },
    settingLabel: {
      color: colors.textPrimary,
      flex: 1,
      fontFamily: typography.fontFamily.bold,
      fontSize: 14,
      fontWeight: '800',
    },
    settingRow: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.divider,
      borderRadius: radius.md,
      borderWidth: 1,
      flexDirection: 'row',
      gap: spacing.md,
      justifyContent: 'space-between',
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
    },
    payloadLine: {
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.bold,
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 20,
    },
    payloadPreview: {
      backgroundColor: colors.surfaceSoft,
      borderRadius: radius.md,
      gap: spacing.xs,
      padding: spacing.md,
    },
    segmented: {
      backgroundColor: colors.surfaceSoft,
      borderRadius: radius.pill,
      flexDirection: 'row',
      marginBottom: spacing.md,
      padding: 4,
    },
    segment: {
      alignItems: 'center',
      borderRadius: radius.pill,
      flex: 1,
      paddingVertical: spacing.sm,
    },
    segmentActive: {
      backgroundColor: colors.primary,
    },
    segmentText: {
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.extraBold,
      fontSize: 12,
      fontWeight: '900',
      textTransform: 'capitalize',
    },
    segmentTextActive: {
      color: '#FFFFFF',
    },
    nowPlayingScreen: {
      backgroundColor: colors.background,
      flex: 1,
      overflow: 'hidden',
    },
    nowPlayingDark: {
      backgroundColor: '#05070A',
    },
    ringOne: {
      borderColor: isDark ? 'rgba(224,242,254,0.05)' : 'rgba(183,201,225,0.18)',
      borderRadius: 360,
      borderWidth: 1,
      height: 720,
      left: -160,
      position: 'absolute',
      top: -230,
      width: 720,
    },
    ringTwo: {
      borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(183,201,225,0.16)',
      borderRadius: 280,
      borderWidth: 1,
      height: 560,
      left: -80,
      position: 'absolute',
      top: -150,
      width: 560,
    },
    ringThree: {
      borderColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(183,201,225,0.14)',
      borderRadius: 220,
      borderWidth: 1,
      height: 440,
      left: -20,
      position: 'absolute',
      top: -90,
      width: 440,
    },
    nowBody: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: spacing.xl,
      paddingBottom: 128,
      paddingTop: 96,
      zIndex: 1,
    },
    nowHeaderTitle: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.bold,
      fontSize: 20,
      fontWeight: '700',
      lineHeight: 28,
      textAlign: 'center',
    },
    nowArtworkShell: {
      alignItems: 'center',
      alignSelf: 'center',
      borderRadius: 32,
      marginBottom: 40,
      shadowColor: isDark ? '#FFFFFF' : '#B7C9D5',
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: isDark ? 0.08 : 0.28,
      shadowRadius: 30,
    },
    nowInfoRow: {
      alignItems: 'center',
      alignSelf: 'stretch',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.xxl,
      paddingHorizontal: spacing.xs,
    },
    nowTitleWrap: {
      flex: 1,
      minWidth: 0,
      paddingHorizontal: spacing.md,
    },
    nowTitle: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.bold,
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
      textAlign: 'center',
    },
    nowArtist: {
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.medium,
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 24,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
    favoriteBig: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    progressShell: {
      alignSelf: 'stretch',
      marginTop: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    progressBar: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : colors.divider,
      borderRadius: radius.pill,
      height: 2,
      overflow: 'visible',
    },
    progressBarFill: {
      borderRadius: radius.pill,
      height: 2,
    },
    progressThumb: {
      backgroundColor: colors.textPrimary,
      borderRadius: radius.pill,
      height: 12,
      marginLeft: -6,
      position: 'absolute',
      shadowColor: colors.textPrimary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isDark ? 0.5 : 0.22,
      shadowRadius: 10,
      top: -5,
      width: 12,
    },
    progressTime: {
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.semiBold,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.6,
      lineHeight: 16,
      marginTop: spacing.sm,
    },
    controlsRow: {
      alignItems: 'center',
      alignSelf: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 40,
      paddingHorizontal: spacing.base,
      width: '100%',
      maxWidth: 340,
    },
    controlButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    controlButtonLarge: {
      alignItems: 'center',
      height: 54,
      justifyContent: 'center',
      width: 54,
    },
    playButtonHuge: {
      alignItems: 'center',
      backgroundColor: isDark ? '#FFFFFF' : '#1B1C1C',
      borderRadius: radius.pill,
      height: 80,
      justifyContent: 'center',
      shadowColor: isDark ? '#FFFFFF' : '#1B1C1C',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isDark ? 0.4 : 0.18,
      shadowRadius: 30,
      width: 80,
    },
    bottomActionRow: {
      flexDirection: 'row',
      gap: spacing.md,
      justifyContent: 'center',
      marginTop: spacing.lg,
    },
    repeatStatus: {
      color: colors.textMuted,
      fontFamily: typography.fontFamily.bold,
      fontSize: 12,
      fontWeight: '800',
      marginTop: spacing.md,
      textAlign: 'center',
    },
    modalBackdrop: {
      backgroundColor: 'rgba(0,0,0,0.42)',
      flex: 1,
      justifyContent: 'flex-end',
      padding: spacing.xl,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      gap: spacing.md,
      maxHeight: '82%',
      padding: spacing.lg,
    },
    largeModalCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      gap: spacing.md,
      maxHeight: '78%',
      padding: spacing.lg,
    },
    modalRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.md,
      minHeight: 46,
    },
    modalRowText: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.bold,
      fontSize: 15,
      fontWeight: '800',
    },
    modalTrackRow: {
      alignItems: 'center',
      borderBottomColor: colors.divider,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: spacing.md,
      minHeight: 62,
      paddingVertical: spacing.sm,
    },
    addedText: {
      color: colors.textMuted,
      fontFamily: typography.fontFamily.extraBold,
      fontSize: 13,
      fontWeight: '900',
    },
    modalInput: {
      backgroundColor: colors.surfaceSoft,
      borderRadius: radius.md,
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.bold,
      fontSize: 16,
      fontWeight: '800',
      minHeight: 52,
      paddingHorizontal: spacing.base,
    },
    detailRow: {
      borderBottomColor: colors.divider,
      borderBottomWidth: 1,
      gap: spacing.xs,
      paddingBottom: spacing.sm,
    },
    detailLabel: {
      color: colors.textMuted,
      fontFamily: typography.fontFamily.extraBold,
      fontSize: 11,
      fontWeight: '900',
      textTransform: 'uppercase',
    },
    detailValue: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.bold,
      fontSize: 14,
      fontWeight: '800',
    },
  });
