'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/lib/store/cartStore';
import StoreImage from '@/components/ui/StoreImage';
import { MenuItem as MenuItemType } from '@/lib/types';
import { formatINR } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';
import SearchHighlight from '@/components/menu/SearchHighlight';
import { useTrack } from '@/lib/analytics/events';
import CustomizationModal from '@/components/menu/CustomizationModal';
import { useMenuSocket } from '@/lib/socket/MenuSocketProvider';
import SeasonalBadge from '@/components/menu/SeasonalBadge';
import DishGallery from '@/components/menu/DishGallery';

interface MenuItemProps {
  item: MenuItemType;
  addLabel?: string;
  searchQuery?: string;
  storeSlug?: string;
  /** Show expanded details (nutrition, allergens, etc.) */
  expanded?: boolean;
  /** Show pairing suggestions inline */
  showPairings?: boolean;
  /** Show ingredient breakdown inline */
  showIngredients?: boolean;
}

const ALLERGEN_ICONS: Record<string, string> = {
  gluten: '🌾',
  dairy: '🥛',
  nuts: '🥜',
  eggs: '🥚',
  soy: '🫘',
  shellfish: '🦐',
  fish: '🐟',
  peanuts: '🥜',
};

const DIETARY_ICONS: Record<string, { icon: string; label: string; className: string }> = {
  isVegan: { icon: '🌱', label: 'Vegan', className: 'bg-green-100 text-green-700' },
  isGlutenFree: { icon: '🌾', label: 'GF', className: 'bg-amber-100 text-amber-700' },
  isHalal: { icon: '☪️', label: 'Halal', className: 'bg-emerald-100 text-emerald-700' },
  isKosher: { icon: '✡️', label: 'Kosher', className: 'bg-purple-100 text-purple-700' },
  isJain: { icon: '🙏', label: 'Jain', className: 'bg-orange-100 text-orange-700' },
};

export default function MenuItem({
  item,
  addLabel = 'Add',
  searchQuery = '',
  storeSlug,
  expanded = false,
  showPairings = false,
  showIngredients = false,
}: MenuItemProps) {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const resolvedStoreSlug = useCartStore((s) => s.storeSlug) ?? storeSlug;
  const track = useTrack();

  const [modalOpen, setModalOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(item.isAvailable);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedPortion, setSelectedPortion] = useState<string | null>(
    item.portionSizes?.[0]?.id ?? null
  );

  const { subscribeAvailability } = useMenuSocket();

  useEffect(() => {
    const unsubscribe = subscribeAvailability(item.id, (_itemId, available) => {
      setIsAvailable(available);
    });
    return unsubscribe;
  }, [item.id, subscribeAvailability]);

  useEffect(() => {
    setIsAvailable(item.isAvailable);
  }, [item.isAvailable]);

  const hasCustomizations = (item.customizations?.length ?? 0) > 0;
  const cartItem = hasCustomizations
    ? undefined
    : items.find((i) => i.itemId === item.id && Object.keys(i.customizations).length === 0);
  const qty = cartItem?.quantity ?? 0;

  // Calculate price with portion size modifier
  const selectedPortionData = item.portionSizes?.find((p) => p.id === selectedPortion);
  const portionModifier = selectedPortionData?.priceModifier ?? 0;
  const displayPrice = item.price + portionModifier;

  // Get dietary icons
  const activeDietary = Object.entries(item.dietary ?? {})
    .filter(([, active]) => active)
    .map(([key]) => key);

  function handleAdd() {
    if (!isAvailable) return;

    if (hasCustomizations || selectedPortion) {
      setModalOpen(true);
      return;
    }

    addItem({
      itemId: item.id,
      name: item.name,
      price: item.price,
      basePrice: item.price,
      customizations: {},
      customizationTotal: 0,
      isVeg: item.isVeg,
    });
    track({
      event: 'add_to_cart',
      storeSlug: resolvedStoreSlug ?? undefined,
      properties: {
        itemId: item.id,
        itemName: item.name,
        price: item.price,
        storeSlug: resolvedStoreSlug,
      },
    });
  }

  function handleModalAddToCart(
    menuItem: MenuItemType,
    quantity: number,
    selectedCustomizations: Record<string, string[]>,
    customizationTotal: number,
  ) {
    const totalPrice = displayPrice + customizationTotal;
    for (let i = 0; i < quantity; i++) {
      addItem({
        itemId: menuItem.id,
        name: menuItem.name,
        price: totalPrice,
        basePrice: menuItem.price,
        customizations: selectedCustomizations,
        customizationTotal,
        isVeg: menuItem.isVeg,
      });
    }
    track({
      event: 'add_to_cart',
      storeSlug: resolvedStoreSlug ?? undefined,
      properties: {
        itemId: menuItem.id,
        itemName: menuItem.name,
        price: totalPrice,
        storeSlug: resolvedStoreSlug,
      },
    });
    setModalOpen(false);
  }

  const hasBadges = item.badge || item.isSeasonal || item.isChefSpecial || item.isPopular;
  const hasDietary = activeDietary.length > 0;
  const hasAllergens = (item.allergens?.length ?? 0) > 0;
  const hasNutrition = !!item.nutrition;
  const hasPortions = (item.portionSizes?.length ?? 0) > 0;
  const hasGallery = item.image || item.imageHd;

  return (
    <>
      <article
        role="article"
        aria-label={item.name}
        className={cn(
          'bg-white rounded-xl border border-gray-100 overflow-hidden',
          !isAvailable && 'opacity-60',
          expanded && 'shadow-sm'
        )}
      >
        <div className="flex gap-3 p-3">
          {/* Left: Text content */}
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            {hasBadges && (
              <div className="flex flex-wrap gap-1 mb-1.5">
                <SeasonalBadge
                  isSeasonal={item.isSeasonal}
                  isChefSpecial={item.isChefSpecial}
                  isPopular={item.isPopular}
                  badge={item.badge}
                  badgeVariant={item.badgeVariant}
                />
                {item.rating && item.rating >= 4 && (
                  <span className="inline-flex items-center gap-0.5 text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                    <span>⭐</span> {item.rating.toFixed(1)}
                  </span>
                )}
              </div>
            )}

            {/* Title row */}
            <div className="flex items-center gap-1.5 mb-1">
              <span
                aria-label={item.isVeg ? 'Vegetarian' : 'Non-vegetarian'}
                className={cn(
                  'w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0',
                  item.isVeg ? 'border-green-600' : 'border-red-600'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn('w-2 h-2 rounded-full', item.isVeg ? 'bg-green-600' : 'bg-red-600')}
                />
              </span>
              {(item.spicyLevel ?? 0) > 0 && (
                <span role="img" aria-label={`Spice level ${item.spicyLevel}`} className="text-xs">
                  {'🌶'.repeat(item.spicyLevel ?? 0)}
                </span>
              )}
              <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                <SearchHighlight text={item.name} query={searchQuery} />
              </h3>
              {!isAvailable && (
                <span className="flex-shrink-0 text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full leading-none">
                  Unavailable
                </span>
              )}
            </div>

            {/* Dietary badges */}
            {hasDietary && (
              <div className="flex flex-wrap gap-1 mb-1.5">
                {activeDietary.map((key) => {
                  const config = DIETARY_ICONS[key];
                  if (!config) return null;
                  return (
                    <span
                      key={key}
                      className={cn('inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium', config.className)}
                      title={config.label}
                    >
                      {config.icon} {config.label}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Description */}
            {item.description && (
              <p className="text-xs text-gray-500 line-clamp-2">
                <SearchHighlight text={item.description} query={searchQuery} />
              </p>
            )}

            {/* Nutrition preview */}
            {hasNutrition && !expanded && (
              <button
                onClick={() => setDetailsOpen(!detailsOpen)}
                className="mt-1.5 text-[10px] text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>📊</span>
                <span>
                  {item.nutrition!.calories} cal
                  {item.nutrition!.protein && ` • ${item.nutrition!.protein}g protein`}
                </span>
              </button>
            )}

            {/* Price row */}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-sm font-bold text-gray-900">{formatINR(displayPrice)}</span>
              {item.originalPrice && item.originalPrice > item.price && (
                <span
                  aria-label={`Original price ${formatINR(item.originalPrice)}`}
                  className="text-xs text-gray-400 line-through"
                >
                  {formatINR(item.originalPrice)}
                </span>
              )}
              {item.prepTime && (
                <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                  <span>⏱</span> {item.prepTime} min
                </span>
              )}
            </div>
          </div>

          {/* Right: Image + Add button */}
          <div className="flex flex-col items-end justify-between gap-2 flex-shrink-0">
            {item.image && (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                <StoreImage
                  src={item.image}
                  alt={item.name}
                  width={80}
                  height={80}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            )}
            {isAvailable ? (
              hasCustomizations || hasPortions ? (
                <button
                  onClick={() => setModalOpen(true)}
                  aria-label={`Add ${item.name} to cart`}
                  className="px-4 py-1.5 bg-white border-2 border-indigo-600 text-indigo-600 text-sm font-bold rounded-lg hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {addLabel}
                </button>
              ) : qty === 0 ? (
                <button
                  onClick={handleAdd}
                  aria-label={`Add ${item.name} to cart`}
                  className="px-4 py-1.5 bg-white border-2 border-indigo-600 text-indigo-600 text-sm font-bold rounded-lg hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {addLabel}
                </button>
              ) : (
                <div
                  role="group"
                  aria-label={`${item.name} quantity`}
                  className="flex items-center gap-2 bg-indigo-600 rounded-lg px-1"
                >
                  <button
                    onClick={() => updateQuantity(item.id, qty - 1)}
                    aria-label={`Remove ${item.name} from cart`}
                    className="w-7 h-7 text-white font-bold text-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 focus:ring-offset-indigo-600 rounded"
                  >
                    <span aria-hidden="true">−</span>
                  </button>
                  <span
                    aria-live="polite"
                    aria-atomic="true"
                    aria-label={`${qty} in cart`}
                    className="text-white font-bold text-sm w-4 text-center"
                  >
                    {qty}
                  </span>
                  <button
                    onClick={handleAdd}
                    aria-label={`Add ${item.name} to cart`}
                    className="w-7 h-7 text-white font-bold text-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 focus:ring-offset-indigo-600 rounded"
                  >
                    <span aria-hidden="true">+</span>
                  </button>
                </div>
              )
            ) : (
              <button
                disabled
                aria-label={`${item.name} is unavailable`}
                className="px-4 py-1.5 bg-gray-100 border-2 border-gray-200 text-gray-400 text-sm font-bold rounded-lg cursor-not-allowed"
              >
                Sold Out
              </button>
            )}
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="border-t border-gray-100 p-3 space-y-3">
            {/* Allergens warning */}
            {hasAllergens && (
              <div className="flex items-start gap-2 bg-red-50 rounded-lg p-2">
                <span className="text-red-500">⚠️</span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-red-700 mb-1">Contains:</p>
                  <div className="flex flex-wrap gap-1">
                    {item.allergens!.map((allergen) => (
                      <span
                        key={allergen}
                        className="inline-flex items-center gap-0.5 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full"
                      >
                        {ALLERGEN_ICONS[allergen] ?? '⚠️'} {allergen}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Nutrition facts */}
            {hasNutrition && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <span>📊</span> Nutrition Facts (per serving)
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {item.nutrition!.calories && (
                    <div className="bg-white rounded p-1.5">
                      <span className="block text-sm font-bold text-gray-900">{item.nutrition!.calories}</span>
                      <span className="text-[10px] text-gray-500">Calories</span>
                    </div>
                  )}
                  {item.nutrition!.protein && (
                    <div className="bg-white rounded p-1.5">
                      <span className="block text-sm font-bold text-gray-900">{item.nutrition!.protein}g</span>
                      <span className="text-[10px] text-gray-500">Protein</span>
                    </div>
                  )}
                  {item.nutrition!.carbs && (
                    <div className="bg-white rounded p-1.5">
                      <span className="block text-sm font-bold text-gray-900">{item.nutrition!.carbs}g</span>
                      <span className="text-[10px] text-gray-500">Carbs</span>
                    </div>
                  )}
                  {item.nutrition!.fat && (
                    <div className="bg-white rounded p-1.5">
                      <span className="block text-sm font-bold text-gray-900">{item.nutrition!.fat}g</span>
                      <span className="text-[10px] text-gray-500">Fat</span>
                    </div>
                  )}
                  {item.nutrition!.fiber && (
                    <div className="bg-white rounded p-1.5">
                      <span className="block text-sm font-bold text-gray-900">{item.nutrition!.fiber}g</span>
                      <span className="text-[10px] text-gray-500">Fiber</span>
                    </div>
                  )}
                  {item.nutrition!.sodium && (
                    <div className="bg-white rounded p-1.5">
                      <span className="block text-sm font-bold text-gray-900">{item.nutrition!.sodium}mg</span>
                      <span className="text-[10px] text-gray-500">Sodium</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Portion sizes */}
            {hasPortions && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1.5">Portion Size</p>
                <div className="flex flex-wrap gap-2">
                  {item.portionSizes!.map((portion) => {
                    const isSelected = selectedPortion === portion.id;
                    const modifier = portion.priceModifier;
                    const adjustedPrice = item.price + modifier;
                    return (
                      <button
                        key={portion.id}
                        onClick={() => setSelectedPortion(portion.id)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg border text-sm font-medium transition-all',
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        )}
                      >
                        {portion.label}
                        <span className="ml-1 text-xs text-gray-400">{formatINR(adjustedPrice)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cooking method */}
            {item.cookingMethod && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>🔥</span>
                <span className="font-medium">{item.cookingMethod}</span>
              </div>
            )}

            {/* Story */}
            {item.story && (
              <div className="bg-amber-50 rounded-lg p-2">
                <p className="text-[10px] font-medium text-amber-800 mb-0.5">📜 {item.story}</p>
              </div>
            )}

            {/* Pairing suggestions preview */}
            {showPairings && item.pairings && item.pairings.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1.5">🍷 Goes well with</p>
                <div className="flex flex-wrap gap-1">
                  {item.pairings.slice(0, 3).map((pairing, idx) => (
                    <span key={idx} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                      {pairing.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expand/collapse toggle for non-expanded items with details */}
        {(hasAllergens || hasNutrition || hasPortions) && !expanded && (
          <button
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="w-full py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 transition-colors border-t border-gray-100 flex items-center justify-center gap-1"
          >
            <span>{detailsOpen ? 'Show less' : 'Show details'}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={cn('w-3 h-3 transition-transform', detailsOpen && 'rotate-180')}
            >
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
            </svg>
          </button>
        )}
      </article>

      {/* Gallery Modal */}
      {hasGallery && (
        <DishGallery
          imageHd={item.imageHd}
          image={item.image}
          name={item.name}
          videoUrl={item.videoUrl}
          className="mt-3"
        />
      )}

      {hasCustomizations && (
        <CustomizationModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          item={item}
          onAddToCart={handleModalAddToCart}
        />
      )}
    </>
  );
}
