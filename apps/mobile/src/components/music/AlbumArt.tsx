import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Music } from 'lucide-react-native';
import type { Track } from '@tunify/shared';

import { getArtworkPreviewUri } from '../../services/artwork/artwork.utils';
import { radius } from '../../app/theme/tokens';
import type { TunifyColors } from '../../app/theme/colors';

type AlbumArtProps = {
  track?: Track;
  colors: TunifyColors;
  size: number;
  radiusValue?: number;
};

export function AlbumArt({ track, colors, size, radiusValue = radius.md }: AlbumArtProps) {
  const uri = getArtworkPreviewUri(track);
  const [failedUri, setFailedUri] = useState<string | undefined>();

  useEffect(() => {
    setFailedUri(undefined);
  }, [uri]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceLavender,
          borderRadius: radiusValue,
          height: size,
          width: size,
        },
      ]}
    >
      {uri && uri !== failedUri ? (
        <Image
          source={{ uri }}
          style={styles.image}
          onError={() => setFailedUri(uri)}
        />
      ) : (
        <Music color={colors.primary} size={Math.max(22, size * 0.36)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    height: '100%',
    width: '100%',
  },
});
