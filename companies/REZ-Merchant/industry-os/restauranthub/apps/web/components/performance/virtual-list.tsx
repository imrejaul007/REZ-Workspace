'use client';

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';

interface VirtualListItem {
  id: string | number;
  height?: number;
}

interface VirtualListProps<T extends VirtualListItem> {
  items: T[];
  height: number;
  itemHeight: number | ((item: T, index: number) => number);
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

/**
 * Virtual list component for rendering large datasets efficiently
 * Only renders visible items plus a small buffer (overscan) to improve performance
 */
export function VirtualList<T extends VirtualListItem>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const getItemHeight = useCallback(
    (item: T, index: number): number => {
      if (typeof itemHeight === 'function') {
        return itemHeight(item, index);
      }
      return item.height || itemHeight;
    },
    [itemHeight]
  );

  const { totalHeight, visibleItems, startIndex, endIndex } = useMemo(() => {
    if (!items.length) {
      return {
        totalHeight: 0,
        visibleItems: [],
        startIndex: 0,
        endIndex: 0
      };
    }

    // Calculate total height and item positions
    let currentHeight = 0;
    const itemPositions: number[] = [];

    items.forEach((item, index) => {
      itemPositions.push(currentHeight);
      currentHeight += getItemHeight(item, index);
    });

    const totalHeight = currentHeight;

    // Find visible range
    let startIndex = 0;
    let endIndex = items.length - 1;

    // Binary search for start index
    let left = 0;
    let right = items.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (itemPositions[mid] < scrollTop) {
        startIndex = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    // Find end index
    const visibleHeight = scrollTop + height;
    for (let i = startIndex; i < items.length; i++) {
      if (itemPositions[i] >= visibleHeight) {
        endIndex = i - 1;
        break;
      }
    }

    // Apply overscan
    startIndex = Math.max(0, startIndex - overscan);
    endIndex = Math.min(items.length - 1, endIndex + overscan);

    // Get visible items with their positions
    const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      top: itemPositions[startIndex + index]
    }));

    return {
      totalHeight,
      visibleItems,
      startIndex,
      endIndex
    };
  }, [items, scrollTop, height, getItemHeight, overscan]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    },
    [onScroll]
  );

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, top }) => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              top,
              left: 0,
              right: 0,
              height: getItemHeight(item, index)
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Hook for managing virtual list state
export function useVirtualList<T extends VirtualListItem>(items: T[]) {
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredAndSortedItems = useMemo(() => {
    let result = items;

    // Apply filter
    if (filter) {
      result = result.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(filter.toLowerCase())
        )
      );
    }

    // Apply sort
    if (sortBy) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];

        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [items, filter, sortBy, sortOrder]);

  const handleSort = useCallback((field: keyof T) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }, [sortBy]);

  return {
    items: filteredAndSortedItems,
    filter,
    setFilter,
    sortBy,
    sortOrder,
    handleSort
  };
}