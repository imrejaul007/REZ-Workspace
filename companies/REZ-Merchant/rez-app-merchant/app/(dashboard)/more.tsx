import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { StoreSelector } from '@/components/stores/StoreSelector';
import { Colors } from '@/constants/Colors';
import { useMerchantCapabilities, MerchantCapabilities } from '@/hooks/useMerchantCapabilities';
import { useMerchantMode } from '@/hooks/useMerchantMode';
import {
  getVisibleFeatures,
  type FeatureKey,
} from '@/utils/verticalFeatures';

/** Keys of MerchantCapabilities whose value is strictly boolean */
type BoolCapKey = {
  [K in keyof MerchantCapabilities]: MerchantCapabilities[K] extends boolean ? K : never;
}[keyof MerchantCapabilities];

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  route: string;
  badge?: string;
  /** If set, item is only shown when capabilities[showIf] is true */
  showIf?: BoolCapKey;
  /** If set, item is hidden when the current merchant mode's feature set
   *  (per vertical) does NOT include this feature. Items without a
   *  modeGate always show — migration is per-item opt-in so existing
   *  sections don't silently disappear. */
  modeGate?: FeatureKey;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const TYPE_BADGE_COLOR: Record<MerchantCapabilities['merchantType'], string> = {
  food: '#D97706',
  service: '#7C3AED',
  consultation: '#0EA5E9',
  retail: '#16A34A',
  travel: '#EC4899',
  general: '#6B7280',
};

export default function MoreScreen() {
  const router = useRouter();
  const { activeStore } = useStore();
  const { logout } = useAuth();
  const caps = useMerchantCapabilities();
  const { mode: merchantMode } = useMerchantMode();

  // Resolve visible features for this merchant's vertical + mode.
  // Vertical heuristic: category slug | name | merchantType. When the store
  // doesn't yet have a category loaded (cold-boot, unauthenticated peek),
  // we fall back to 'general' — which gives the widest feature set in
  // verticalFeatures.ts so we never hide something the user actually has.
  const categoryHint =
    (activeStore?.category as { slug?: string; name?: string } | null | undefined)?.slug ||
    (activeStore?.category as { slug?: string; name?: string } | null | undefined)?.name ||
    caps.merchantType ||
    'general';
  const visibleFeatureSet = React.useMemo(
    () => new Set<FeatureKey>(getVisibleFeatures(categoryHint, merchantMode)),
    [categoryHint, merchantMode],
  );

  const creatorAnalyticsRoute = activeStore?._id
    ? `/stores/${activeStore._id}/creator-analytics`
    : '/stores';

  const loyaltyProgramRoute = activeStore?._id
    ? `/stores/${activeStore._id}/loyalty-program`
    : '/stores';

  const SECTIONS: MenuSection[] = [
    {
      title: 'Orders & Service',
      items: [
        {
          id: 'kds',
          title: 'Kitchen Display',
          subtitle: 'Real-time order tracking for kitchen staff',
          icon: 'restaurant',
          iconBg: '#FEF3C7',
          iconColor: '#D97706',
          route: '/kds',
          badge: 'KDS',
          showIf: 'hasKitchenDisplay',
        },
        {
          id: 'dine-in',
          title: 'Dine-In Tables',
          subtitle: 'Manage table orders and billing',
          icon: 'grid',
          iconBg: '#F0FDF4',
          iconColor: '#16A34A',
          route: '/dine-in',
          showIf: 'hasDineIn',
        },
        {
          id: 'appointments',
          title: 'Appointments',
          subtitle: 'Schedule and manage customer appointments',
          icon: 'time-outline',
          iconBg: '#EFF6FF',
          iconColor: '#3B82F6',
          route: '/appointments',
          badge: 'NEW',
          showIf: 'hasAppointments',
        },
      ],
    },
    {
      title: 'Point of Sale',
      items: [
        {
          id: 'pos',
          title: 'POS — Sell Now',
          subtitle: 'Quick checkout, QR payments & bill generation',
          icon: 'storefront',
          iconBg: '#EDE9FE',
          iconColor: '#7C3AED',
          route: '/pos',
          badge: 'POS',
        },
        {
          id: 'pos-quick',
          title: 'Quick Bill',
          subtitle: 'Enter amount and generate payment QR instantly',
          icon: 'flash',
          iconBg: '#F5F3FF',
          iconColor: '#6366F1',
          route: '/pos/quick-bill',
        },
      ],
    },
    {
      title: 'Store Management',
      items: [
        {
          id: 'stores',
          title: 'My Stores',
          subtitle: 'Manage stores, settings & details',
          icon: 'storefront',
          iconBg: '#EFF6FF',
          iconColor: '#3B82F6',
          route: '/stores',
        },
        {
          id: 'brand-dashboard',
          title: 'Brand Dashboard',
          subtitle: 'Manage multi-outlet chains, push menus, consolidated analytics',
          icon: 'business-outline' as const,
          iconBg: '#F5F3FF',
          iconColor: '#7C3AED',
          route: '/brand',
          badge: 'NEW',
        },
        {
          id: 'visits',
          title: 'Visits',
          subtitle: 'Track customer visits & check-ins',
          icon: 'calendar',
          iconBg: '#ECFDF5',
          iconColor: '#10B981',
          route: '/(dashboard)/visits',
        },
        {
          id: 'table-bookings',
          title: 'Table Bookings',
          subtitle: 'View reservations across all stores',
          icon: 'restaurant',
          iconBg: '#FEF3C7',
          iconColor: '#D97706',
          route: '/all-table-bookings',
          showIf: 'hasTableBookings',
        },
        {
          id: 'categories',
          title: 'Business Categories',
          subtitle: 'Manage product & service categories',
          icon: 'grid',
          iconBg: '#F0FDFA',
          iconColor: '#14B8A6',
          route: '/categories',
        },
      ],
    },
    {
      title: 'Finance',
      items: [
        {
          id: 'try-trials',
          title: 'ReZ TRY Trials',
          subtitle: 'Create & manage trial offers',
          icon: 'star-outline',
          iconBg: '#FDF4FF',
          iconColor: '#8B5CF6',
          route: '/(dashboard)/try-trials',
          badge: 'NEW',
        },
        {
          id: 'try-analytics',
          title: 'TRY Analytics',
          subtitle: 'View trial performance metrics',
          icon: 'bar-chart-outline',
          iconBg: '#FDF4FF',
          iconColor: '#8B5CF6',
          route: '/try/merchant/analytics',
          badge: 'NEW',
        },
        {
          id: 'payments',
          title: 'In-Store Payments',
          subtitle: 'View payment history & transactions',
          icon: 'cash',
          iconBg: '#ECFDF5',
          iconColor: '#10B981',
          route: '/(dashboard)/payments',
        },
        {
          id: 'cashback',
          title: 'Cashback',
          subtitle: 'Manage cashback offers & redemptions',
          icon: 'gift',
          iconBg: '#FEF2F2',
          iconColor: '#EF4444',
          route: '/(dashboard)/cashback',
        },
        {
          id: 'wallet',
          title: 'Wallet',
          subtitle: 'View balance, transactions & payouts',
          icon: 'wallet',
          iconBg: '#EFF6FF',
          iconColor: '#3B82F6',
          route: '/(dashboard)/wallet',
        },
        {
          id: 'market-intelligence',
          title: 'Market Intelligence',
          subtitle: 'Benchmarking, trends & competitor insights',
          icon: 'analytics',
          iconBg: '#F0FDF4',
          iconColor: '#10B981',
          route: '/market',
          badge: 'NEW',
        },
        {
          id: 'coins',
          title: 'Coins',
          subtitle: 'Manage branded & ReZ coin rewards',
          icon: 'sparkles',
          iconBg: '#FFFBEB',
          iconColor: '#F59E0B',
          route: '/(dashboard)/coins',
          modeGate: 'loyalty',
        },
        {
          id: 'deals',
          title: 'Deals',
          subtitle: 'Create and manage deals & offers',
          icon: 'ticket',
          iconBg: '#FDF4FF',
          iconColor: '#A855F7',
          route: '/(dashboard)/deals',
          modeGate: 'discounts',
        },
        {
          id: 'dynamic-pricing',
          title: 'Dynamic Pricing',
          subtitle: 'Create time-based price adjustments',
          icon: 'pricetag',
          iconBg: '#EDE9FE',
          iconColor: '#7C3AED',
          route: '/(dashboard)/dynamic-pricing',
          modeGate: 'products',
        },
        {
          id: 'payouts',
          title: 'Payouts',
          subtitle: 'Request payouts and view payout history',
          icon: 'cash-outline',
          iconBg: '#ECFDF5',
          iconColor: '#059669',
          route: '/payouts',
          badge: 'NEW',
        },
        {
          id: 'export-reports',
          title: 'Export Reports',
          subtitle: 'Download transactions, customers & payouts as CSV',
          icon: 'download-outline',
          iconBg: '#EEF2FF',
          iconColor: '#6366F1',
          route: '/reports/export',
          badge: 'NEW',
          modeGate: 'reports',
        },
        {
          id: 'disputes',
          title: 'Disputes',
          subtitle: 'View and respond to customer disputes',
          icon: 'flag',
          iconBg: '#FEF2F2',
          iconColor: '#EF4444',
          route: '/disputes',
        },
      ],
    },
    {
      title: 'Marketing & Creators',
      items: [
        {
          id: 'ads-manager',
          title: 'Ads Manager',
          subtitle: 'Create & run WhatsApp, push & SMS campaigns',
          icon: 'megaphone',
          iconBg: '#F0FDF4',
          iconColor: '#16A34A',
          route: '/(dashboard)/marketing',
          badge: 'NEW',
          modeGate: 'marketing',
        },
        {
          id: 'creator-picks',
          title: 'Creator Picks',
          subtitle: 'Review & approve creator product picks',
          icon: 'star',
          iconBg: '#F5F3FF',
          iconColor: '#8B5CF6',
          route: creatorAnalyticsRoute,
          badge: 'NEW',
          modeGate: 'marketing',
        },
        {
          id: 'events',
          title: 'Events',
          subtitle: 'Create and manage events',
          icon: 'megaphone',
          iconBg: '#FDF4FF',
          iconColor: '#A855F7',
          route: '/events',
        },
        {
          id: 'social-impact',
          title: 'Social Impact',
          subtitle: 'Manage social impact initiatives',
          icon: 'heart',
          iconBg: '#FDF2F8',
          iconColor: '#EC4899',
          route: '/social-impact',
        },
        {
          id: 'bonus-campaigns',
          title: 'Bonus Campaigns',
          subtitle: 'View active platform bonus campaigns',
          icon: 'gift',
          iconBg: '#FEF3C7',
          iconColor: '#D97706',
          route: '/(dashboard)/bonus-campaigns',
          badge: 'NEW',
        },
        {
          id: 'campaign-simulator',
          title: 'Campaign Simulator',
          subtitle: 'Calculate ROI before launching campaigns',
          icon: 'calculator',
          iconBg: '#F0FDF4',
          iconColor: '#16A34A',
          route: '/(dashboard)/campaign-simulator',
          badge: 'NEW',
        },
        {
          id: 'integrations',
          title: 'System Integrations',
          subtitle: 'Connect POS, PMS, booking & inventory systems',
          icon: 'git-branch',
          iconBg: '#EDE9FE',
          iconColor: '#7C3AED',
          route: '/(dashboard)/integrations',
          badge: 'NEW',
        },
      ],
    },
    {
      title: 'Growth & Loyalty',
      items: [
        {
          id: 'broadcast',
          title: 'Broadcast Campaigns',
          subtitle: 'Send SMS, WhatsApp & push to customers',
          icon: 'megaphone',
          iconBg: '#FEF3C7',
          iconColor: '#D97706',
          route: '/(dashboard)/broadcast',
          badge: 'NEW',
          modeGate: 'broadcast',
        },
        {
          id: 'push-broadcast',
          title: 'Send Notification',
          subtitle: 'Push to all REZ Now web subscribers instantly',
          icon: 'megaphone-outline',
          iconBg: '#F0FDF4',
          iconColor: '#059669',
          route: '/(dashboard)/broadcast',
          badge: 'NEW',
          modeGate: 'broadcast',
        },
        {
          id: 'crm',
          title: 'Customer CRM',
          subtitle: 'Search customers, view profiles & add tags',
          icon: 'people',
          iconBg: '#EFF6FF',
          iconColor: '#3B82F6',
          route: '/crm',
          badge: 'NEW',
          modeGate: 'broadcast',
        },
        {
          id: 'campaign-roi',
          title: 'Campaign ROI',
          subtitle: 'See return on every coin campaign',
          icon: 'trending-up',
          iconBg: '#F0FDF4',
          iconColor: '#16A34A',
          route: '/(dashboard)/campaign-roi',
          badge: 'NEW',
          modeGate: 'analytics',
        },
        {
          id: 'stamp-cards',
          title: 'Stamp Cards',
          subtitle: 'Create punch-card loyalty programs',
          icon: 'card',
          iconBg: '#FDF4FF',
          iconColor: '#A855F7',
          route: '/stamp-cards',
          badge: 'NEW',
          modeGate: 'loyalty',
        },
        {
          id: 'loyalty-program',
          title: 'Loyalty Program',
          subtitle: 'Configure tiers, points & rewards',
          icon: 'ribbon',
          iconBg: '#FDF4FF',
          iconColor: '#7C3AED',
          route: loyaltyProgramRoute,
          badge: 'NEW',
          modeGate: 'loyalty',
        },
        {
          id: 'punch-cards',
          title: 'Punch Card Programs',
          subtitle: 'Reward customers after N visits with a free item or discount',
          icon: 'gift',
          iconBg: '#EEF2FF',
          iconColor: '#6366F1',
          route: '/loyalty/punch-cards',
          badge: 'NEW',
          modeGate: 'loyalty',
        },
        {
          id: 'discount-builder',
          title: 'Discount Builder',
          subtitle: 'Create % off or fixed-amount discount rules with spend thresholds',
          icon: 'pricetags',
          iconBg: '#FFF7ED',
          iconColor: '#EA580C',
          route: '/discounts',
          badge: 'NEW',
        },
        {
          id: 'aggregator-orders',
          title: 'Aggregator Orders',
          subtitle: 'View Swiggy, Zomato & Dunzo orders',
          icon: 'bicycle',
          iconBg: '#FFF7ED',
          iconColor: '#EA580C',
          route: '/(dashboard)/aggregator-orders',
          badge: 'NEW',
          showIf: 'hasAggregatorOrders',
        },
        {
          id: 'post-purchase',
          title: 'Post-Purchase Rules',
          subtitle: 'Auto-send follow-ups after every sale to bring customers back',
          icon: 'repeat',
          iconBg: '#ECFDF5',
          iconColor: '#059669',
          route: '/(dashboard)/post-purchase',
          badge: 'NEW',
        },
        {
          id: 'corporate',
          title: 'Corporate Rewards',
          subtitle: 'Distribute coins to employees as benefits, incentives & perks',
          icon: 'business',
          iconBg: '#EDE9FE',
          iconColor: '#7C3AED',
          route: '/(dashboard)/corporate',
          badge: 'NEW',
        },
        {
          id: 'campaign-rules',
          title: 'Campaign Rules',
          subtitle: 'Define how campaigns trigger and distribute rewards',
          icon: 'git-pull-request',
          iconBg: '#EFF6FF',
          iconColor: '#3B82F6',
          route: '/(dashboard)/campaign-rules',
          badge: 'NEW',
        },
        {
          id: 'create-offer',
          title: 'Create Offer',
          subtitle: 'Design and launch targeted offers for your customers',
          icon: 'add-circle',
          iconBg: '#F0FDF4',
          iconColor: '#16A34A',
          route: '/(dashboard)/create-offer',
          badge: 'NEW',
        },
        {
          id: 'growth',
          title: 'Growth Dashboard',
          subtitle: 'Track customer acquisition, retention & lifetime value',
          icon: 'trending-up',
          iconBg: '#FDF4FF',
          iconColor: '#8B5CF6',
          route: '/(dashboard)/growth',
          badge: 'NEW',
        },
      ],
    },
    {
      title: 'Operations',
      items: [
        {
          id: 'live-orders',
          title: 'Live Orders',
          subtitle: 'Real-time pending and preparing order dashboard',
          icon: 'time-outline',
          iconBg: '#FEF3C7',
          iconColor: '#D97706',
          route: '/orders/live',
          badge: 'LIVE',
        },
        {
          id: 'recipes',
          title: 'Recipe Costing',
          subtitle: 'Calculate food cost % per dish',
          icon: 'nutrition',
          iconBg: '#FEF3C7',
          iconColor: '#D97706',
          route: '/recipes',
          badge: 'NEW',
          showIf: 'hasRecipeCosting',
          modeGate: 'recipes',
        },
        {
          id: 'waste-tracking',
          title: 'Waste Tracking',
          subtitle: 'Log daily waste and reduce food cost',
          icon: 'trash',
          iconBg: '#FEF2F2',
          iconColor: '#DC2626',
          route: '/analytics/waste',
          badge: 'NEW',
          showIf: 'hasWasteTracking',
          modeGate: 'recipes',
        },
        {
          id: 'shift-management',
          title: 'Shift Management',
          subtitle: 'Open and close POS cash shifts',
          icon: 'time',
          iconBg: '#F0FDF4',
          iconColor: '#16A34A',
          route: '/pos/shift-open',
          badge: 'NEW',
        },
        {
          id: 'waiter-mode',
          title: 'Waiter Mode',
          subtitle: 'Restricted floor-staff ordering interface',
          icon: 'person',
          iconBg: '#EFF6FF',
          iconColor: '#3B82F6',
          route: '/dine-in/waiter-mode',
          badge: 'NEW',
          showIf: 'hasWaiterMode',
        },
        {
          id: 'combo-products',
          title: 'Combo Products',
          subtitle: 'Create bundle deals with savings',
          icon: 'gift',
          iconBg: '#FDF4FF',
          iconColor: '#A855F7',
          route: '/products/combo',
          badge: 'NEW',
        },
        {
          id: 'bundles',
          title: 'Combo Bundles',
          subtitle: 'Create discounted item bundles to increase AOV',
          icon: 'cube',
          iconBg: '#EDE9FE',
          iconColor: '#7C3AED',
          route: '/(dashboard)/bundles',
          badge: 'NEW',
        },
      ],
    },
    {
      title: 'Analytics',
      items: [
        {
          id: 'food-cost',
          title: 'Food Cost Report',
          subtitle: 'Margin analysis across all dishes',
          icon: 'pie-chart',
          iconBg: '#FEF3C7',
          iconColor: '#D97706',
          route: '/analytics/food-cost',
          badge: 'NEW',
          showIf: 'hasFoodCostReport',
          modeGate: 'recipes',
        },
        {
          id: 'nps-dashboard',
          title: 'NPS Dashboard',
          subtitle: 'Customer satisfaction score & feedback',
          icon: 'star',
          iconBg: '#FFFBEB',
          iconColor: '#F59E0B',
          route: '/analytics/nps',
          badge: 'NEW',
        },
        {
          id: 'expense-tracker',
          title: 'Expense Tracker',
          subtitle: 'Log and analyse operational costs',
          icon: 'receipt',
          iconBg: '#F0FDF4',
          iconColor: '#16A34A',
          route: '/analytics/expenses',
          badge: 'NEW',
        },
        {
          id: 'menu-engineering',
          title: 'Menu Engineering',
          subtitle: 'Identify star, puzzle, plowdog & dog menu items',
          icon: 'restaurant-outline',
          iconBg: '#FFF7ED',
          iconColor: '#EA580C',
          route: '/analytics/menu-engineering',
          badge: 'NEW',
          showIf: 'hasMenuEngineering',
        },
        {
          id: 'aov-analytics',
          title: 'AOV Analytics',
          subtitle: 'Track average order value trends & upsell performance',
          icon: 'trending-up',
          iconBg: '#EDE9FE',
          iconColor: '#7C3AED',
          route: '/(dashboard)/aov-analytics',
          badge: 'NEW',
        },
        {
          id: 'cohort-retention',
          title: 'Cohort Retention',
          subtitle: 'See how many new customers return week by week',
          icon: 'repeat',
          iconBg: '#D1FAE5',
          iconColor: '#059669',
          route: '/analytics/cohorts',
          badge: 'NEW',
        },
        {
          id: 'customer-segments',
          title: 'Customer Segments',
          subtitle: 'High value, at-risk, and new user segments',
          icon: 'people-circle-outline',
          iconBg: '#EDE9FE',
          iconColor: '#7C3AED',
          route: '/customers/segments',
          badge: 'NEW',
        },
        {
          id: 'revenue-goals',
          title: 'Revenue Goals',
          subtitle: 'Set and track monthly revenue & visit targets',
          icon: 'flag-outline',
          iconBg: '#F3E8FF',
          iconColor: '#7C3AED',
          route: '/goals',
          badge: 'NEW',
        },
      ],
    },
    {
      title: 'Finance & Plans',
      items: [
        {
          id: 'gift-cards',
          title: 'Gift Cards',
          subtitle: 'Issue and track store gift cards',
          icon: 'gift',
          iconBg: '#FDF4FF',
          iconColor: '#A855F7',
          route: '/gift-cards',
          badge: 'NEW',
        },
        {
          id: 'subscription-plans',
          title: 'Subscription Plans',
          subtitle: 'Manage your REZ plan and billing',
          icon: 'ribbon',
          iconBg: '#EFF6FF',
          iconColor: '#3B82F6',
          route: '/(dashboard)/subscription-plans',
          badge: 'NEW',
        },
        {
          id: 'khata',
          title: 'Khata (Credit Book)',
          subtitle: 'Track customer dues and credits',
          icon: 'book',
          iconBg: '#FEF3C7',
          iconColor: '#D97706',
          route: '/khata',
          badge: 'NEW',
        },
        {
          id: 'settlements',
          title: 'Settlements',
          subtitle: 'View payouts and reconciliation',
          icon: 'cash',
          iconBg: '#F0FDF4',
          iconColor: '#16A34A',
          route: '/settlements',
          badge: 'NEW',
        },
      ],
    },
    {
      title: 'Team & Security',
      items: [
        {
          id: 'team',
          title: 'Team',
          subtitle: 'Manage team members & permissions',
          icon: 'people-circle',
          iconBg: '#EDE9FE',
          iconColor: '#7C3AED',
          route: '/(dashboard)/team',
          modeGate: 'team',
        },
        {
          id: 'staff-rota',
          title: 'Staff Rota',
          subtitle: 'Plan and manage staff schedules and shifts',
          icon: 'calendar-outline',
          iconBg: '#F0FDF4',
          iconColor: '#16A34A',
          route: '/team/rota',
          badge: 'NEW',
          showIf: 'hasStaffRota',
          modeGate: 'team',
        },
        {
          id: 'store-profile',
          title: 'Store Profile',
          subtitle: 'Edit store name, logo, description & contact info',
          icon: 'storefront-outline',
          iconBg: '#EDE9FE',
          iconColor: '#7C3AED',
          route: '/settings/profile',
          badge: 'NEW',
        },
        {
          id: 'staff-management',
          title: 'Staff Management',
          subtitle: 'Invite cashiers & managers, manage access',
          icon: 'person-circle-outline',
          iconBg: '#FEF3C7',
          iconColor: '#D97706',
          route: '/settings/staff',
          badge: 'NEW',
        },
        {
          id: 'audit',
          title: 'Audit Log',
          subtitle: 'View security & activity logs',
          icon: 'shield-checkmark',
          iconBg: '#DBEAFE',
          iconColor: '#2563EB',
          route: '/(dashboard)/audit',
          modeGate: 'reports',
        },
        {
          id: 'support-tickets',
          title: 'Support Tickets',
          subtitle: 'View & reply to support conversations',
          icon: 'chatbubbles',
          iconBg: '#FEF3C7',
          iconColor: '#D97706',
          route: '/tickets',
        },
      ],
    },
    {
      title: 'Business Tools',
      items: [
        {
          id: 'qr-hub',
          title: 'QR Hub',
          subtitle: 'Unified dashboard for all QR codes',
          icon: 'apps',
          iconBg: '#6366F1',
          iconColor: '#6366F1',
          route: '/(dashboard)/qr-hub',
          badge: 'NEW',
        },
        {
          id: 'qr-generator',
          title: 'QR Code Generator',
          subtitle: 'Generate and share your store check-in QR code',
          icon: 'qr-code-outline',
          iconBg: '#F0FDF4',
          iconColor: '#16A34A',
          route: '/qr-generator',
        },
        {
          id: 'qr-checkin',
          title: 'Store QR Checkin',
          subtitle: 'Show QR for customers to scan and earn coins — no POS needed',
          icon: 'qr-code' as const,
          iconBg: '#F0FDF4',
          iconColor: '#16A34A',
          route: '/qr-checkin',
          badge: 'NEW',
        },
        {
          id: 'scan-trial-qr',
          title: 'Scan Trial QR',
          subtitle: 'Scan & verify trial completions',
          icon: 'qr-code-outline',
          iconBg: '#FDF4FF',
          iconColor: '#8B5CF6',
          route: '/try/merchant/scanner',
        },
        {
          id: 'khata-tools',
          title: 'Khata',
          subtitle: 'Manage customer credit book & payments',
          icon: 'book-outline',
          iconBg: '#F0FDF4',
          iconColor: '#16A34A',
          route: '/khata',
        },
        {
          id: 'documents',
          title: 'Documents',
          subtitle: 'Invoices, labels, packing slips & exports',
          icon: 'document-text-outline',
          iconBg: '#EEF2FF',
          iconColor: '#6366F1',
          route: '/documents',
        },
        {
          id: 'suppliers',
          title: 'Suppliers',
          subtitle: 'Manage supplier contacts & details',
          icon: 'business',
          iconBg: '#EDE9FE',
          iconColor: '#7C3AED',
          route: '/suppliers',
          showIf: 'hasSuppliers',
        },
        {
          id: 'purchase-orders',
          title: 'Purchase Orders',
          subtitle: 'Track & manage purchase orders',
          icon: 'document',
          iconBg: '#EEF2FF',
          iconColor: '#6366F1',
          route: '/purchase-orders',
          showIf: 'hasPurchaseOrders',
          modeGate: 'purchase-orders',
        },
        {
          id: 'services',
          title: 'Services',
          subtitle: 'Manage travel & service listings',
          icon: 'briefcase',
          iconBg: '#F0F9FF',
          iconColor: '#0EA5E9',
          route: '/services',
          showIf: 'hasServiceListing',
        },
        {
          id: 'reports',
          title: 'Reports & Exports',
          subtitle: 'Download business data & reports',
          icon: 'document-text',
          iconBg: '#EEF2FF',
          iconColor: '#6366F1',
          route: '/(dashboard)/reports',
          modeGate: 'reports',
        },
        {
          id: 'business-hours',
          title: 'Business Hours',
          subtitle: 'Set open/close times for each day of the week',
          icon: 'time-outline',
          iconBg: '#F0FDF4',
          iconColor: '#059669',
          route: '/settings/business-hours',
          badge: 'NEW',
        },
        {
          id: 'printer-settings',
          title: 'Printer Settings',
          subtitle: 'Configure receipt and label printers',
          icon: 'print-outline',
          iconBg: '#F1F5F9',
          iconColor: '#475569',
          route: '/settings/printer',
          badge: 'NEW',
        },
        {
          id: 'notifications',
          title: 'Notifications',
          subtitle: 'View alerts & manage preferences',
          icon: 'notifications',
          iconBg: '#FEF2F2',
          iconColor: '#EF4444',
          route: '/notifications',
        },
        {
          id: 'product-catalog',
          title: 'Product Catalog',
          subtitle: 'Manage products, pricing, stock & categories',
          icon: 'cube-outline',
          iconBg: '#EEF2FF',
          iconColor: '#6366F1',
          route: '/catalog',
          badge: 'NEW',
        },
        {
          id: 'inventory-alerts',
          title: 'Inventory Alerts',
          subtitle: 'View low stock and out-of-stock products',
          icon: 'alert-circle-outline',
          iconBg: '#FFF7ED',
          iconColor: '#EA580C',
          route: '/inventory/alerts',
          badge: 'NEW',
        },
        {
          id: 'my-locations',
          title: 'My Locations',
          subtitle: 'Manage and switch between store locations',
          icon: 'location-outline',
          iconBg: '#EFF6FF',
          iconColor: '#3B82F6',
          route: '/stores/locations',
          badge: 'NEW',
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#1a3a52', '#2d5a7b']} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>More Options</Text>
            <View
              style={[styles.typeBadge, { backgroundColor: TYPE_BADGE_COLOR[caps.merchantType] }]}
            >
              <Text style={styles.typeBadgeText}>{caps.merchantTypeLabel}</Text>
            </View>
          </View>
          <View style={styles.storeSelectorWrap}>
            <StoreSelector compact />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => {
            // Capability gate (unchanged): item hidden if showIf is set and
            // the merchant's plan doesn't include the capability.
            if (item.showIf && !caps[item.showIf]) return false;
            // Mode gate: item hidden when modeGate is set and the current
            // merchant mode's feature set doesn't include that feature.
            // Items without modeGate always show (opt-in migration).
            if (item.modeGate && !visibleFeatureSet.has(item.modeGate)) return false;
            return true;
          });
          if (visibleItems.length === 0) return null;
          return (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionCards}>
                {visibleItems.map((item, iIdx) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.menuCard,
                      iIdx === visibleItems.length - 1 && styles.menuCardLast,
                    ]}
                    onPress={() => router.push(item.route)}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.menuIcon, { backgroundColor: item.iconBg }]}>
                      <Ionicons name={item.icon} size={22} color={item.iconColor} />
                    </View>
                    <View style={styles.menuText}>
                      <View style={styles.menuTitleRow}>
                        <Text style={styles.menuTitle}>{item.title}</Text>
                        {item.badge && (
                          <View style={styles.menuBadge}>
                            <Text style={styles.menuBadgeText}>{item.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.6}>
          <View style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          </View>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 40) + 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  storeSelectorWrap: {
    flexShrink: 0,
    maxWidth: '50%',
  },
  headerLeft: {
    flex: 1,
    flexShrink: 1,
    gap: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.card,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionCards: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },

  // Menu card
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.backgroundTertiary,
  },
  menuCardLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    marginLeft: 14,
  },
  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  menuBadge: {
    backgroundColor: '#8B5CF6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  menuBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.card,
    letterSpacing: 0.5,
  },
  menuSubtitle: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.error,
    marginLeft: 14,
  },
});
