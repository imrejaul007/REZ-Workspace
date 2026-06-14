# Screen Split: app/(tabs)/index.tsx

**Original Size:** 2,007 lines  
**Target Size:** ~300 lines per component  
**Status:** SPLIT REQUIRED

---

## Current Structure (Line Ranges)

```
Lines 1-100:    Imports
Lines 101-200:  Type definitions
Lines 201-400:  Header & Search
Lines 401-600:  Categories Grid
Lines 601-800:  Featured Deals
Lines 801-1000: Flash Sales
Lines 1001-1200: Nearby Stores
Lines 1201-1400: Trending Products
Lines 1401-1600: Sponsored Content
Lines 1601-1800: Bottom Actions
Lines 1801-2007: Render & Exports
```

---

## Split Plan

### 1. Create Component Directory

```
app/(tabs)/index/
├── index.tsx                    # Main container (~300 lines)
├── components/
│   ├── HomeHeader.tsx          # Header + Search
│   ├── CategoryGrid.tsx        # Categories grid
│   ├── FeaturedDeals.tsx       # Featured section
│   ├── FlashSalesCarousel.tsx   # Flash sales
│   ├── NearbyStores.tsx         # Nearby stores
│   ├── TrendingProducts.tsx     # Trending products
│   ├── SponsoredBanner.tsx      # Ads banner
│   └── HomeSkeleton.tsx        # Loading skeleton
```

### 2. Main Container (index.tsx)

```typescript
// app/(tabs)/index/index.tsx

import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import ReAnimated, { useAnimatedScrollHandler } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import HomeHeader from './components/HomeHeader';
import CategoryGrid from './components/CategoryGrid';
import FeaturedDeals from './components/FeaturedDeals';
import FlashSalesCarousel from './components/FlashSalesCarousel';
import NearbyStores from './components/NearbyStores';
import TrendingProducts from './components/TrendingProducts';
import HomeSkeleton from './components/HomeSkeleton';

export default function HomeScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const scrollHandler = useAnimatedScrollHandler({ ... });

  return (
    <ReAnimated.ScrollView
      ref={scrollRef}
      onScroll={scrollHandler}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <HomeHeader />
      <CategoryGrid />
      <FeaturedDeals />
      <FlashSalesCarousel />
      <NearbyStores />
      <TrendingProducts />
    </ReAnimated.ScrollView>
  );
}
```

### 3. HomeHeader Component

```typescript
// app/(tabs)/index/components/HomeHeader.tsx

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StickySearchHeader from '@/components/homepage/StickySearchHeader';

interface HomeHeaderProps {
  userName?: string;
}

export default function HomeHeader({ userName }: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      <StickySearchHeader />
      {/* Greeting, location, etc */}
    </View>
  );
}
```

### 4. CategoryGrid Component

```typescript
// app/(tabs)/index/components/CategoryGrid.tsx

import React from 'react';
import { View, FlatList, Text } from 'react-native';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CategoryGridProps {
  categories: Category[];
  onPress: (id: string) => void;
}

export default function CategoryGrid({ categories, onPress }: CategoryGridProps) {
  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        numColumns={4}
        renderItem={({ item }) => (
          <CategoryItem item={item} onPress={onPress} />
        )}
        keyExtractor={item => item.id}
      />
    </View>
  );
}
```

---

## Benefits

| Metric | Before | After |
|--------|--------|-------|
| Main file | 2,007 lines | 300 lines |
| Component size | N/A | 200-400 lines each |
| Bundle impact | Full load | Lazy load |
| Maintainability | Low | High |
| Testability | Difficult | Easy |

---

## Implementation Steps

1. Create component directory structure
2. Extract each section into separate component
3. Move shared types to `types/home.ts`
4. Create loading skeleton for each component
5. Add lazy loading with `React.lazy()`
6. Add tests for each component
7. Verify in CI/CD

---

## Estimated Effort

| Component | Lines to Extract | Effort |
|-----------|-----------------|--------|
| HomeHeader | 200 | 2 hours |
| CategoryGrid | 300 | 3 hours |
| FeaturedDeals | 250 | 2 hours |
| FlashSalesCarousel | 200 | 2 hours |
| NearbyStores | 300 | 3 hours |
| TrendingProducts | 300 | 3 hours |
| **Total** | **1,550** | **~15 hours** |

---

**Status:** READY FOR IMPLEMENTATION  
**Priority:** HIGH  
**Owner:** Frontend Team
