// @ts-nocheck
/**
 * BrowseCategoryGrid Component
 * Premium 2-column grid layout for category cards — fashion-ready.
 * Cards are equal height, responsive width, icon centred, text truncated.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageSourcePropType,
  Dimensions,
  Platform,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CategoryGridItem, BrowseCategoryGridProps } from '@/types/categoryTypes';
import { colors } from '@/constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
// 3-column grid: full width minus outer padding (16*2) minus two gaps (10*2) divided by 3
const COLUMN_GAP = 10;
const OUTER_PADDING = 32; // 16 left + 16 right
const CARD_WIDTH = (SCREEN_WIDTH - OUTER_PADDING - COLUMN_GAP * 2) / 3;
// Icon size: fixed small for compact look
const ICON_SIZE = Math.min(CARD_WIDTH - 16, 64);
// Max visible rows before "See All"
const MAX_VISIBLE_ROWS = 3;

// Map category IDs to local asset images
const CATEGORY_IMAGES: Record<string, ImageSourcePropType> = {
  // Food & Dining
  'cafes': require('@/assets/category-icons/FOOD-DINING/Cafes.png'),
  'cafe': require('@/assets/category-icons/FOOD-DINING/Cafes.png'),
  'qsr-fast-food': require('@/assets/category-icons/FOOD-DINING/QSR-Fast-food.png'),
  'fast-food': require('@/assets/category-icons/FOOD-DINING/QSR-Fast-food.png'),
  'family-restaurants': require('@/assets/category-icons/FOOD-DINING/Family-restaurants.png'),
  'family-restaurant': require('@/assets/category-icons/FOOD-DINING/Family-restaurants.png'),
  'fine-dining': require('@/assets/category-icons/FOOD-DINING/Fine-dining.png'),
  'ice-cream-dessert': require('@/assets/category-icons/FOOD-DINING/Ice-cream-dessert.png'),
  'ice-cream': require('@/assets/category-icons/FOOD-DINING/Ice-cream-dessert.png'),
  'bakery-confectionery': require('@/assets/category-icons/FOOD-DINING/Bakery-confectionery.png'),
  'bakery': require('@/assets/category-icons/FOOD-DINING/Bakery-confectionery.png'),
  'cloud-kitchens': require('@/assets/category-icons/FOOD-DINING/Cloud-kitchens.png'),
  'cloud-kitchen': require('@/assets/category-icons/FOOD-DINING/Cloud-kitchens.png'),
  'street-food': require('@/assets/category-icons/FOOD-DINING/Street-food.png'),
  // Grocery & Essentials
  'dairy': require('@/assets/category-icons/GROCERY-ESSENTIALS/Dairy.png'),
  'dairy-eggs': require('@/assets/category-icons/GROCERY-ESSENTIALS/Dairy.png'),
  'fresh-vegetables': require('@/assets/category-icons/GROCERY-ESSENTIALS/Fresh-vegetables.png'),
  'fruits-veggies': require('@/assets/category-icons/GROCERY-ESSENTIALS/Fresh-vegetables.png'),
  'fruits': require('@/assets/category-icons/GROCERY-ESSENTIALS/Fresh-vegetables.png'),
  'veggies': require('@/assets/category-icons/GROCERY-ESSENTIALS/Fresh-vegetables.png'),
  'kirana-stores': require('@/assets/category-icons/GROCERY-ESSENTIALS/Kirana-Stores.png'),
  'kirana': require('@/assets/category-icons/GROCERY-ESSENTIALS/Kirana-Stores.png'),
  'supermarkets': require('@/assets/category-icons/GROCERY-ESSENTIALS/Supermarkets.png'),
  'supermarket': require('@/assets/category-icons/GROCERY-ESSENTIALS/Supermarkets.png'),
  'meat-fish': require('@/assets/category-icons/GROCERY-ESSENTIALS/Meat-fish.png'),
  'packaged-goods': require('@/assets/category-icons/GROCERY-ESSENTIALS/Packaged-goods.png'),
  'water-cans': require('@/assets/category-icons/GROCERY-ESSENTIALS/water-cans.png'),
  // Beauty & Wellness
  'salons': require('@/assets/category-icons/BEAUTY-WELLNESS/Salons.png'),
  'salon': require('@/assets/category-icons/BEAUTY-WELLNESS/Salons.png'),
  'spa-massage': require('@/assets/category-icons/BEAUTY-WELLNESS/Spa-massage.png'),
  'spa': require('@/assets/category-icons/BEAUTY-WELLNESS/Spa-massage.png'),
  'beauty-services': require('@/assets/category-icons/BEAUTY-WELLNESS/Beauty-services.png'),
  'cosmetology': require('@/assets/category-icons/BEAUTY-WELLNESS/Cosmetics.png'),
  'skincare-cosmetics': require('@/assets/category-icons/BEAUTY-WELLNESS/Skincare-cosmetics.png'),
  'dermatology': require('@/assets/category-icons/BEAUTY-WELLNESS/Dermatology.png'),
  'nail-studios': require('@/assets/category-icons/BEAUTY-WELLNESS/nail.png'),
  'nails': require('@/assets/category-icons/BEAUTY-WELLNESS/nail.png'),
  'grooming-men': require('@/assets/category-icons/BEAUTY-WELLNESS/Men-grooming.png'),
  'men-grooming': require('@/assets/category-icons/BEAUTY-WELLNESS/Men-grooming.png'),
  // Fitness & Sports
  'gyms': require('@/assets/category-icons/FITNESS-SPORTS/Gyms.png'),
  'crossfit': require('@/assets/category-icons/FITNESS-SPORTS/CrossFit.png'),
  'yoga': require('@/assets/category-icons/FITNESS-SPORTS/Yoga.png'),
  'zumba': require('@/assets/category-icons/FITNESS-SPORTS/Zumba.png'),
  'martial-arts': require('@/assets/category-icons/FITNESS-SPORTS/Martial-arts.png'),
  'sports-academies': require('@/assets/category-icons/FITNESS-SPORTS/Sports-academies.png'),
  'sportswear': require('@/assets/category-icons/FITNESS-SPORTS/Sportswear.png'),
  // Healthcare
  'clinics': require('@/assets/category-icons/HEALTHCARE/Clinics.png'),
  'dental': require('@/assets/category-icons/HEALTHCARE/Dental.png'),
  'diagnostics': require('@/assets/category-icons/HEALTHCARE/Diagnostics.png'),
  'home-nursing': require('@/assets/category-icons/HEALTHCARE/Home-nursing.png'),
  'pharmacy': require('@/assets/category-icons/HEALTHCARE/Pharmacy.png'),
  'physiotherapy': require('@/assets/category-icons/HEALTHCARE/Physiotherapy.png'),
  'vision-eyewear': require('@/assets/category-icons/HEALTHCARE/Vision-eyewear.png'),
  // Fashion (icons in Shopping/ directory)
  'footwear': require('@/assets/category-icons/Shopping/footwear.png'),
  'bags-accessories': require('@/assets/category-icons/Shopping/Bags.png'),
  'jewelry': require('@/assets/category-icons/Shopping/Jewelry.png'),
  'local-brands': require('@/assets/category-icons/Shopping/Local-brands.png'),
  'watches': require('@/assets/category-icons/Shopping/Watches.png'),
  'mobile-accessories': require('@/assets/category-icons/Shopping/Mobile-accessories.png'),
  'fashion-general': require('@/assets/category-icons/Shopping/Fashion.png'),
  'electronics-general': require('@/assets/category-icons/Shopping/Electronics.png'),
  // Education & Learning
  'coaching-centers': require('@/assets/category-icons/EDUCATION-LEARNING/Coaching-center.png'),
  'language-training': require('@/assets/category-icons/EDUCATION-LEARNING/Language-training.png'),
  'music-dance-classes': require('@/assets/category-icons/EDUCATION-LEARNING/Music-dance-classes.png'),
  'skill-development': require('@/assets/category-icons/EDUCATION-LEARNING/Skill-development.png'),
  'vocational': require('@/assets/category-icons/EDUCATION-LEARNING/Vocational.png'),
  // Home Services
  'ac-repair': require('@/assets/category-icons/HOME-SERVICES/AC-repair.png'),
  'cleaning': require('@/assets/category-icons/HOME-SERVICES/Cleaning.png'),
  'electrical': require('@/assets/category-icons/HOME-SERVICES/Electrical.png'),
  'home-tutors': require('@/assets/category-icons/HOME-SERVICES/Home-tutors.png'),
  'house-shifting': require('@/assets/category-icons/HOME-SERVICES/House-shifting.png'),
  'laundry-dry-cleaning': require('@/assets/category-icons/HOME-SERVICES/Laundry-dry-cleaning.png'),
  'pest-control': require('@/assets/category-icons/HOME-SERVICES/Pest-control.png'),
  'plumbing': require('@/assets/category-icons/HOME-SERVICES/Plumbing.png'),
  // Travel & Experiences
  'activities': require('@/assets/category-icons/TRAVEL-EXPERIENCES/Activities.png'),
  'airport-services': require('@/assets/category-icons/TRAVEL-EXPERIENCES/Airport-services.png'),
  'bike-rentals': require('@/assets/category-icons/TRAVEL-EXPERIENCES/Bike-rentals.png'),
  'hotels': require('@/assets/category-icons/TRAVEL-EXPERIENCES/Hotels.png'),
  'intercity-travel': require('@/assets/category-icons/TRAVEL-EXPERIENCES/Intercity-travel.png'),
  'taxis': require('@/assets/category-icons/TRAVEL-EXPERIENCES/taxis.png'),
  'tours': require('@/assets/category-icons/TRAVEL-EXPERIENCES/Tours.png'),
  'weekend-getaways': require('@/assets/category-icons/TRAVEL-EXPERIENCES/Weekend-getaways.png'),
  // Entertainment
  'amusement-parks': require('@/assets/category-icons/ENTERTAINMENT/Amusement-parks.png'),
  'festivals': require('@/assets/category-icons/ENTERTAINMENT/Festivals.png'),
  'gaming-cafes': require('@/assets/category-icons/ENTERTAINMENT/Gaming-cafes.png'),
  'live-events': require('@/assets/category-icons/ENTERTAINMENT/Live-events.png'),
  'movies': require('@/assets/category-icons/ENTERTAINMENT/Movies.png'),
  'vr-ar-experiences': require('@/assets/category-icons/ENTERTAINMENT/Virtual-reality.png'),
  'workshops': require('@/assets/category-icons/ENTERTAINMENT/Workshops.png'),
  // Financial & Lifestyle
  'bill-payments': require('@/assets/category-icons/FINANCIAL-LIFESTYLE/Bill-payments.png'),
  'broadband': require('@/assets/category-icons/FINANCIAL-LIFESTYLE/Broadband.png'),
  'cable-ott': require('@/assets/category-icons/FINANCIAL-LIFESTYLE/OTT.png'),
  'donations': require('@/assets/category-icons/FINANCIAL-LIFESTYLE/Donations.png'),
  'gold-savings': require('@/assets/category-icons/FINANCIAL-LIFESTYLE/Gold-savings.png'),
  'insurance': require('@/assets/category-icons/FINANCIAL-LIFESTYLE/Insurance.png'),
  'mobile-recharge': require('@/assets/category-icons/FINANCIAL-LIFESTYLE/Mobile-recharge.png'),
  // Electronics
  'accessories': require('@/assets/category-icons/ELECTRONICS/Accessories.png'),
  'audio-headphones': require('@/assets/category-icons/ELECTRONICS/Audio-headphones.png'),
  'cameras': require('@/assets/category-icons/ELECTRONICS/Cameras.png'),
  'gaming': require('@/assets/category-icons/ELECTRONICS/Gaming.png'),
  'laptops': require('@/assets/category-icons/ELECTRONICS/Laptops.png'),
  'mobile-phones': require('@/assets/category-icons/ELECTRONICS/Mobile-phones.png'),
  'smartwatches': require('@/assets/category-icons/ELECTRONICS/Smartwatches.png'),
  'televisions': require('@/assets/category-icons/ELECTRONICS/Televisions.png'),
};

// Fallback Ionicons for categories without PNG assets
const CATEGORY_ICON_FALLBACK: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  'meat-fish': { name: 'fish-outline', color: colors.error },
  'packaged-goods': { name: 'cube-outline', color: colors.warningScale[400] },
  'organic': { name: 'leaf-outline', color: colors.success },
  'beverages': { name: 'beer-outline', color: colors.brand.purpleLight },
  'snacks': { name: 'fast-food-outline', color: colors.brand.orange },
  'frozen': { name: 'snow-outline', color: colors.infoScale[400] },
  'baby-care': { name: 'happy-outline', color: colors.brand.pink },
  'pet-supplies': { name: 'paw-outline', color: colors.brand.purpleMedium },
  'cleaning': { name: 'sparkles-outline', color: colors.tealGreen },
  // Beauty & Wellness fallbacks
  'skincare': { name: 'sparkles-outline', color: colors.warningScale[400] },
  'skincare-cosmetics': { name: 'flask-outline', color: colors.brand.pink },
  'makeup': { name: 'color-palette-outline', color: colors.error },
  'haircare': { name: 'cut-outline', color: colors.infoScale[400] },
  'hair-care': { name: 'cut-outline', color: colors.infoScale[400] },
  'bridal': { name: 'heart-outline', color: '#F43F5E' },
  'bridal-services': { name: 'heart-outline', color: '#F43F5E' },
  'wellness': { name: 'leaf-outline', color: colors.successScale[400] },
  'ayurveda': { name: 'leaf-outline', color: colors.success },
  'perfumes': { name: 'flower-outline', color: colors.brand.purpleMedium },
  // Fitness & Sports fallbacks
  'gyms': { name: 'barbell-outline', color: colors.brand.orange },
  'crossfit': { name: 'flame-outline', color: colors.error },
  'yoga': { name: 'body-outline', color: colors.brand.purpleLight },
  'zumba': { name: 'musical-notes-outline', color: colors.brand.pink },
  'martial-arts': { name: 'hand-right-outline', color: colors.slateGray },
  'sports-academies': { name: 'trophy-outline', color: colors.success },
  'sportswear': { name: 'shirt-outline', color: colors.infoScale[400] },
  // Healthcare fallbacks
  'pharmacy': { name: 'medkit-outline', color: '#0EA5E9' },
  'clinics': { name: 'fitness-outline', color: colors.brand.sky },
  'diagnostics': { name: 'pulse-outline', color: '#0EA5E9' },
  'dental': { name: 'happy-outline', color: '#38BDF8' },
  'physiotherapy': { name: 'body-outline', color: colors.brand.sky },
  'home-nursing': { name: 'home-outline', color: '#0EA5E9' },
  'vision-eyewear': { name: 'eye-outline', color: '#38BDF8' },
  // Fashion fallbacks
  'footwear': { name: 'footsteps-outline', color: colors.brand.purpleMedium },
  'bags-accessories': { name: 'bag-outline', color: '#C084FC' },
  'mobile-accessories': { name: 'headset-outline', color: colors.brand.purple },
  'watches': { name: 'watch-outline', color: colors.brand.purpleMedium },
  'jewelry': { name: 'diamond-outline', color: '#C084FC' },
  'local-brands': { name: 'storefront-outline', color: colors.brand.purple },
  // Education fallbacks
  'coaching-centers': { name: 'book-outline', color: colors.brand.indigo },
  'skill-development': { name: 'bulb-outline', color: '#818CF8' },
  'music-dance-classes': { name: 'musical-notes-outline', color: colors.brand.indigo },
  'art-craft': { name: 'color-palette-outline', color: '#818CF8' },
  'vocational': { name: 'construct-outline', color: '#4F46E5' },
  'language-training': { name: 'language-outline', color: colors.brand.indigo },
  // Home Services fallbacks
  'ac-repair': { name: 'snow-outline', color: colors.warningScale[400] },
  'plumbing': { name: 'water-outline', color: colors.warningScale[700] },
  'electrical': { name: 'flash-outline', color: colors.warningScale[400] },
  'house-shifting': { name: 'cube-outline', color: colors.warningScale[400] },
  'laundry-dry-cleaning': { name: 'shirt-outline', color: colors.warningScale[700] },
  'home-tutors': { name: 'school-outline', color: colors.warningScale[400] },
  'pest-control': { name: 'bug-outline', color: colors.warningScale[700] },
  // Travel fallbacks
  'hotels': { name: 'bed-outline', color: colors.brand.cyan },
  'intercity-travel': { name: 'bus-outline', color: colors.cyanDark },
  'taxis': { name: 'car-outline', color: colors.brand.cyan },
  'bike-rentals': { name: 'bicycle-outline', color: '#22D3EE' },
  'weekend-getaways': { name: 'sunny-outline', color: colors.brand.cyan },
  'tours': { name: 'map-outline', color: colors.cyanDark },
  'activities': { name: 'rocket-outline', color: colors.brand.cyan },
  'airport-services': { name: 'airplane-outline', color: colors.cyanDark },
  // Entertainment fallbacks
  'movies': { name: 'film-outline', color: colors.brand.purpleLight },
  'live-events': { name: 'mic-outline', color: colors.brand.purple },
  'festivals': { name: 'balloon-outline', color: colors.brand.purpleLight },
  'amusement-parks': { name: 'happy-outline', color: colors.brand.purpleSoft },
  'gaming-cafes': { name: 'game-controller-outline', color: colors.brand.purple },
  'vr-ar-experiences': { name: 'glasses-outline', color: colors.brand.purpleLight },
  'workshops': { name: 'build-outline', color: colors.brand.purple },
  // Financial fallbacks
  'bill-payments': { name: 'receipt-outline', color: colors.tealGreen },
  'mobile-recharge': { name: 'phone-portrait-outline', color: '#0D9488' },
  'broadband': { name: 'wifi-outline', color: colors.tealGreen },
  'cable-ott': { name: 'tv-outline', color: '#2DD4BF' },
  'gold-savings': { name: 'diamond-outline', color: '#0D9488' },
  'donations': { name: 'heart-outline', color: colors.tealGreen },
  // Electronics fallbacks
  'mobile-phones': { name: 'phone-portrait-outline', color: colors.infoScale[400] },
  'laptops': { name: 'laptop-outline', color: colors.brand.blue },
  'televisions': { name: 'tv-outline', color: colors.infoScale[400] },
  'cameras': { name: 'camera-outline', color: colors.infoScale[400] },
  'audio-headphones': { name: 'headset-outline', color: colors.brand.blue },
  'gaming': { name: 'game-controller-outline', color: colors.infoScale[400] },
  'accessories': { name: 'hardware-chip-outline', color: colors.infoScale[400] },
  'smartwatches': { name: 'watch-outline', color: colors.brand.blue },
};

interface CategoryCardProps {
  category: CategoryGridItem;
  onPress: (category: CategoryGridItem) => void;
  countLabel?: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onPress, countLabel = 'items' }) => {
  const icon = category.icon || '🍽️';
  const color = category.color || colors.neutral[500];

  // Priority: 1) Backend image URL, 2) Hardcoded local asset, 3) Ionicons fallback
  const backendImage = category.image ? { uri: category.image } : null;
  const localImage = CATEGORY_IMAGES[category.slug ?? ''] || CATEGORY_IMAGES[category.id] || null;
  const imageSource = backendImage || localImage;

  const iconFallback = !imageSource
    ? (CATEGORY_ICON_FALLBACK[category.id] || (category.slug ? CATEGORY_ICON_FALLBACK[category.slug] : undefined))
    : undefined;

  const accentColor = iconFallback?.color || color;

  return (
    <Pressable
      style={styles.card}
      onPress={() => onPress(category)}
    >
      {/* Icon area — fixed square size, always centred */}
      <View style={styles.iconArea}>
        {imageSource ? (
          <>
            <CachedImage
              source={imageSource as unknown}
              style={styles.itemImage}
              contentFit="contain"
              cachePolicy="memory-disk"
              recyclingKey={category.id}
            />
            <LinearGradient
              colors={['transparent', `${accentColor}28`]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              pointerEvents="none"
            />
          </>
        ) : iconFallback ? (
          <LinearGradient
            colors={[`${iconFallback.color}15`, `${iconFallback.color}2E`]}
            style={styles.gradientFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={iconFallback.name} size={28} color={iconFallback.color} />
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={[`${color}12`, `${color}26`]}
            style={styles.gradientFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.iconEmoji}>{icon}</Text>
          </LinearGradient>
        )}

        {/* Item count badge — top-right corner */}
        {category.itemCount !== undefined && category.itemCount > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{category.itemCount}+</Text>
          </View>
        )}
      </View>

      {/* Text block — always renders, same min-height so rows stay even */}
      <View style={styles.textBlock}>
        <Text style={styles.categoryName} numberOfLines={1}>
          {category.name}
        </Text>
        {category.itemCount !== undefined && category.itemCount > 0 && (
          <Text style={styles.itemCount} numberOfLines={1}>
            {category.itemCount}+
          </Text>
        )}
      </View>
    </Pressable>
  );
};

const BrowseCategoryGrid: React.FC<BrowseCategoryGridProps> = ({
  categories,
  title = 'Browse Categories',
  onCategoryPress,
  itemCountLabel = 'items',
}) => {
  const router = useRouter();
  const [showAll, setShowAll] = React.useState(false);

  const handleCategoryPress = (category: CategoryGridItem) => {
    if (onCategoryPress) {
      onCategoryPress(category);
    } else {
      router.push(`/category/${category.id}`);
    }
  };

  // Guard: don't render empty grid
  if (!categories || categories.length === 0) {
    return null;
  }

  // Group into rows of 3
  const allRows: CategoryGridItem[][] = [];
  for (let i = 0; i < categories.length; i += 3) {
    allRows.push(categories.slice(i, i + 3));
  }

  const visibleRows = showAll ? allRows : allRows.slice(0, MAX_VISIBLE_ROWS);
  const hasMore = allRows.length > MAX_VISIBLE_ROWS;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.titleAccent} />
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <Text style={styles.headerCount}>{categories.length} categories</Text>
      </View>

      {/* Grid — 3-column rows */}
      <View style={styles.grid}>
        {visibleRows.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onPress={handleCategoryPress}
                countLabel={itemCountLabel}
              />
            ))}
            {/* Fill empty cells in last row */}
            {row.length === 2 && <View style={styles.cardPlaceholder} />}
            {row.length === 1 && (
              <>
                <View style={styles.cardPlaceholder} />
                <View style={styles.cardPlaceholder} />
              </>
            )}
          </View>
        ))}
      </View>

      {/* See All / See Less toggle */}
      {hasMore && (
        <Pressable style={styles.seeAllButton} onPress={() => setShowAll(v => !v)}>
          <Text style={styles.seeAllText}>{showAll ? 'See Less' : `See All (${categories.length})`}</Text>
          <Ionicons name={showAll ? 'chevron-up' : 'chevron-down'} size={14} color="#A855F7" />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Fashion purple accent bar
  titleAccent: {
    width: 3,
    height: 16,
    backgroundColor: '#A855F7',
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  headerCount: {
    fontSize: 11,
    color: colors.neutral[500],
    fontWeight: '500',
  },

  // Outer grid — column of rows
  grid: {
    paddingHorizontal: 16,
    gap: COLUMN_GAP,
  },
  // Each row is a horizontal trio
  row: {
    flexDirection: 'row',
    gap: COLUMN_GAP,
  },

  // Individual card — compact 3-column card
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
    }),
  },

  // Empty placeholder card to fill odd row
  cardPlaceholder: {
    width: CARD_WIDTH,
  },

  // Square icon/image area — compact
  iconArea: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F8F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  gradientFill: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: '72%',
    height: '72%',
  },
  iconEmoji: {
    fontSize: 28,
    textAlign: 'center',
  },

  // Item count badge — overlaid top-right
  countBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: 'rgba(168,85,247,0.85)',
  },
  countBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#fff',
  },

  // Text block below icon
  textBlock: {
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 8,
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[900],
    textAlign: 'center',
    lineHeight: 15,
  },
  itemCount: {
    fontSize: 10,
    color: '#A855F7',
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '500',
  },

  // See All button
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A855F720',
    backgroundColor: '#A855F708',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A855F7',
  },
});

export default React.memo(BrowseCategoryGrid);
