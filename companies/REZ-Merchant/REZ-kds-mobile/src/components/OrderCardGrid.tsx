/**
 * KDS Mobile - OrderCardGrid Component
 * Grid layout for order cards
 */

import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ViewToken,
} from 'react-native';
import { KDSOrder } from '../types';
import OrderCard from './OrderCard';
import EmptyState from './EmptyState';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OrderCardGridProps {
  orders: KDSOrder[];
  onOrderPress: (order: KDSOrder) => void;
  onOrderBump: (orderId: string) => void;
  onOrderRecall?: (orderId: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isCompact?: boolean;
  showPrices?: boolean;
  columns?: number;
}

const OrderCardGrid: React.FC<OrderCardGridProps> = ({
  orders,
  onOrderPress,
  onOrderBump,
  onOrderRecall,
  onRefresh,
  isRefreshing = false,
  isCompact = false,
  showPrices = false,
  columns = 4,
}) => {
  const cardWidth = useMemo(() => {
    const padding = 16 * 2; // container padding
    const gap = 8 * 2; // margins between cards
    return (SCREEN_WIDTH - padding - gap) / columns;
  }, [columns]);

  const renderItem = useCallback(
    ({ item, index }: { item: KDSOrder; index: number }) => (
      <OrderCard
        order={item}
        onPress={onOrderPress}
        onBump={onOrderBump}
        onRecall={onOrderRecall}
        showPrice={showPrices}
        compact={isCompact}
        index={index}
      />
    ),
    [onOrderPress, onOrderBump, onOrderRecall, showPrices, isCompact]
  );

  const keyExtractor = useCallback((item: KDSOrder) => item.id, []);

  const getItemLayout = useCallback(
    (_data: ArrayLike<KDSOrder> | null | undefined, index: number) => ({
      length: isCompact ? 180 : 220,
      offset: (isCompact ? 180 : 220) * Math.floor(index / columns),
      index,
    }),
    [isCompact, columns]
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      // Could track visible items for analytics
    },
    []
  );

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 50,
    }),
    []
  );

  if (orders.length === 0) {
    return <EmptyState />;
  }

  return (
    <FlatList
      data={orders}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={columns}
      key={columns} // Update key when columns change
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={styles.row}
      showsVerticalScrollIndicator={false}
      getItemLayout={getItemLayout}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      removeClippedSubviews
      maxToRenderPerBatch={10}
      windowSize={5}
      initialNumToRender={8}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#2196F3"
            colors={['#2196F3']}
          />
        ) : undefined
      }
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  row: {
    justifyContent: 'flex-start',
  },
});

export default OrderCardGrid;
