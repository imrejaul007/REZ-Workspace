// @ts-nocheck
import React from 'react';
import { View, StyleSheet } from 'react-native';
import TypedFlashList from '@/components/ui/TypedFlashList';
import { UGCVideoItem, PLAY_PAGE_COLORS } from '@/types/playPage.types';
import SectionHeader from './SectionHeader';
import ThumbnailVideoCard from './ThumbnailVideoCard';

interface UGCVideoSectionProps {
  videos: UGCVideoItem[];
  onVideoPress: (video: UGCVideoItem) => void;
  onViewAllPress?: () => void;
  onLoadMore?: () => void;
  loading?: boolean;
  hasMore?: boolean;
}

function UGCVideoSection({
  videos,
  onVideoPress,
  onViewAllPress,
  onLoadMore,
  loading = false,
  hasMore = false
}: UGCVideoSectionProps) {
  const renderItem = ({ item }: { item: UGCVideoItem }) => (
    <ThumbnailVideoCard
      item={item}
      onPress={onVideoPress}
      showHashtags={true}
    />
  );

  const handleEndReached = () => {
    if (!loading && hasMore && onLoadMore) {
      onLoadMore();
    }
  };

  return (
    <View style={styles.container}>
      <SectionHeader
        title="UGC Videos"
        showViewAll={videos.length > 4}
        onViewAllPress={onViewAllPress}
      />

      <TypedFlashList
        data={videos.slice(0, 4)}
        renderItem={renderItem}
        keyExtractor={(item, index: number) => item.id || `ugc-video-${index}`}
        numColumns={2}
        contentContainerStyle={styles.gridContainer as unknown}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={250}

        // Performance Optimizations
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: PLAY_PAGE_COLORS.background,
    paddingBottom: 16,
  },
  gridContainer: {
    paddingHorizontal: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
});

export default React.memo(UGCVideoSection);
