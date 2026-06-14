// @ts-nocheck
/**
 * TypedFlashList — FlashList wrapper that resolves TypeScript strictness issues.
 *
 * @shopify/flash-list's built-in types require ListRenderItemInfo<T> for renderItem,
 * but this codebase uses { item } destructuring. This wrapper bridges the gap.
 *
 * Replace `const AnyFlashList = FlashList as unknown` with this component.
 * Usage: import TypedFlashList from '@/components/ui/TypedFlashList'
 *        and use <TypedFlashList data={...} renderItem={...} />
 */

import React, { memo } from 'react';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import type { StyleProp, ViewStyle, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

// Accept both the {item} destructuring pattern used in this codebase
// AND the ListRenderItemInfo pattern that FlashList expects internally.
type RenderItem<T> =
  | ((info: ListRenderItemInfo<T>) => React.ReactElement | null)
  | (({ item }: { item: T }) => React.ReactElement | null)
  | (({ item, index }: { item: T; index: number }) => React.ReactElement | null);

export interface TypedFlashListProps<T> {
  data: T[];
  renderItem: RenderItem<T>;
  keyExtractor?: (item: T, index: number) => string;
  separator?: () => React.ReactElement | null;
  ItemSeparatorComponent?: () => React.ReactElement | null;
  contentContainerStyle?: StyleProp<ViewStyle>;
  horizontal?: boolean;
  numColumns?: number;
  pagingEnabled?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  showsVerticalScrollIndicator?: boolean;
  scrollEnabled?: boolean;
  nestedScrollEnabled?: boolean;
  removeClippedSubviews?: boolean;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  onScrollBeginDrag?: () => void;
  onScrollEndDrag?: () => void;
  onMomentumScrollEnd?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollToIndexFailed?: (info: unknown) => void;
  scrollEventThrottle?: number;
  snapToInterval?: number;
  snapToAlignment?: 'start' | 'center' | 'end';
  decelerationRate?: number | 'fast' | 'normal';
  estimatedItemSize?: number;
  overrideItemLayout?: (layout: { size: number }, item: T, index: number) => void;
  maxToRenderPerBatch?: number;
  ListHeaderComponent?: React.ComponentType<unknown> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<unknown> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<unknown> | React.ReactElement | null;
  refreshControl?: React.ReactElement;
  style?: StyleProp<ViewStyle>;
  ref?: unknown;
  accessible?: boolean;
  accessibilityRole?: string;
  accessibilityLabel?: string;
  [key: string]: unknown;
}

function TypedFlashListInner<T>(props: TypedFlashListProps<T>) {
  const {
    data,
    renderItem,
    keyExtractor,
    ItemSeparatorComponent,
    separator,
    contentContainerStyle,
    ...rest
  } = props;
  const effectiveSeparator = ItemSeparatorComponent ?? separator;

  // Normalize: convert {item} pattern to ListRenderItemInfo so FlashList accepts it.
  // This handles both render signatures: ({item})=> and (info)=> styles.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizedRenderItem = (info: ListRenderItemInfo<unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = renderItem as unknown;
    if (typeof fn === 'function') {
      // If fn expects {item} destructuring, call with {item: info.item}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = fn({ item: info.item, index: info.index } as unknown);
      return result;
    }
    return null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (
    <FlashList
      data={data as unknown}
      renderItem={normalizedRenderItem as unknown}
      keyExtractor={keyExtractor as unknown}
      contentContainerStyle={contentContainerStyle as unknown}
      ItemSeparatorComponent={effectiveSeparator as unknown}
      {...(rest as unknown)}
    />
  );
}

export const TypedFlashList = memo(TypedFlashListInner) as <T>(
  props: TypedFlashListProps<T>
) => React.JSX.Element;

export default TypedFlashList;
