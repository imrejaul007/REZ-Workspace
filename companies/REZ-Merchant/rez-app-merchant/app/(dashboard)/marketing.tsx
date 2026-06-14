/**
 * Marketing — REZ Ads Manager
 *
 * Full self-serve Ads Manager with 7 advanced audience targeting modes:
 *   1. Segment     — all / recent / lapsed / high_value / stamp_card
 *   2. Location    — city / area / pincode / radius
 *   3. Interest    — coffee, electronics, fashion (derived from purchases)
 *   4. Birthday    — users with birthday in N days
 *   5. Purchase    — bought product/category in last N days
 *   6. Institution — Oxford College / hospital / office
 *   7. Keyword     — users who searched a term in REZ app
 *
 * Tabs: Create | Campaigns | Analytics | Search Ads
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Platform,
  Animated,
  Dimensions,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/DesignTokens';
import { apiClient } from '@/services/api/client';
import { showAlert } from '@/utils/alert';
import { useStore } from '@/contexts/StoreContext';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE = '/merchant/broadcasts';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'create' | 'campaigns' | 'analytics' | 'searchads';
type ChannelType = 'whatsapp' | 'push' | 'sms' | 'email' | 'in_app';
type ObjectiveType = 'awareness' | 'engagement' | 'sales' | 'win_back';
type TargetingMode =
  | 'segment'
  | 'location'
  | 'interest'
  | 'birthday'
  | 'purchase_history'
  | 'institution'
  | 'keyword';

interface AudienceFilter {
  segment: string;
  location?: { city?: string; area?: string; pincode?: string };
  interests?: string[];
  birthday?: { daysAhead: number };
  purchaseHistory?: { productKeywords?: string[]; withinDays: number };
  institution?: { name?: string; type?: string; area?: string };
  keyword?: { terms: string[]; withinDays?: number };
}

interface Campaign {
  _id: string;
  name: string;
  channel: ChannelType;
  status: string;
  audience: { segment: string; estimatedCount?: number };
  stats: { sent: number; delivered: number; opened: number; failed: number; converted?: number };
  createdAt: string;
  sentAt?: string;
  objective?: string;
}

interface KeywordBid {
  _id: string;
  keyword: string;
  headline: string;
  bidAmount: number;
  dailyBudget: number;
  impressions: number;
  clicks: number;
  totalSpent: number;
  isActive: boolean;
  matchType: 'exact' | 'broad' | 'phrase';
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CHANNELS: { key: ChannelType; label: string; icon: string; color: string; bg: string }[] = [
  { key: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp', color: '#fff', bg: '#25D366' },
  { key: 'push', label: 'Push', icon: 'notifications', color: '#fff', bg: '#7C3AED' },
  { key: 'sms', label: 'SMS', icon: 'chatbubble-ellipses', color: '#fff', bg: '#007AFF' },
  { key: 'email', label: 'Email', icon: 'mail', color: '#fff', bg: '#EA4335' },
  { key: 'in_app', label: 'In-App', icon: 'phone-portrait', color: '#fff', bg: '#FF9500' },
];

const OBJECTIVES: {
  key: ObjectiveType;
  label: string;
  icon: string;
  color: string;
  template: string;
}[] = [
  {
    key: 'awareness',
    label: 'Awareness',
    icon: 'megaphone',
    color: '#3B82F6',
    template:
      "👋 Hi {{name}}! Visit us at [Store] and enjoy exclusive REZ rewards. Come see what's new!",
  },
  {
    key: 'engagement',
    label: 'Engagement',
    icon: 'heart',
    color: '#EC4899',
    template:
      '💬 {{name}}, we miss you! Share your thoughts on your last visit and earn bonus REZ coins.',
  },
  {
    key: 'sales',
    label: 'Sales',
    icon: 'pricetag',
    color: '#10B981',
    template:
      '🔥 Flash deal for {{name}}! Get 20% OFF your next order today only. Use code REZ20 at checkout.',
  },
  {
    key: 'win_back',
    label: 'Win Back',
    icon: 'refresh-circle',
    color: '#F59E0B',
    template:
      "We miss you, {{name}}! It's been a while. Come back today and get ₹50 cashback on your next visit!",
  },
];

const TARGETING_MODES: {
  key: TargetingMode;
  label: string;
  icon: string;
  desc: string;
  color: string;
}[] = [
  {
    key: 'segment',
    label: 'Customer Segment',
    icon: 'people',
    desc: 'All, recent, lapsed, high-value',
    color: '#7C3AED',
  },
  {
    key: 'location',
    label: 'Location',
    icon: 'location',
    desc: 'City, area, pincode, radius',
    color: '#3B82F6',
  },
  {
    key: 'interest',
    label: 'Interests',
    icon: 'star',
    desc: 'Coffee, fashion, electronics…',
    color: '#10B981',
  },
  {
    key: 'birthday',
    label: 'Birthday',
    icon: 'gift',
    desc: 'Users with upcoming birthday',
    color: '#F59E0B',
  },
  {
    key: 'purchase_history',
    label: 'Purchase History',
    icon: 'bag',
    desc: 'Bought chicken / coffee in last 7 days',
    color: '#EF4444',
  },
  {
    key: 'institution',
    label: 'Institution',
    icon: 'school',
    desc: 'College, school, office, hospital',
    color: '#8B5CF6',
  },
  {
    key: 'keyword',
    label: 'Keyword Search',
    icon: 'search',
    desc: 'Users who searched "biryani"',
    color: '#06B6D4',
  },
];

const SEGMENTS = [
  { key: 'all', label: 'All Customers', icon: 'people-circle' },
  { key: 'recent', label: 'Recent (30 days)', icon: 'time' },
  { key: 'lapsed', label: 'Lapsed (31–90 days)', icon: 'hourglass' },
  { key: 'high_value', label: 'High Value (₹5K+)', icon: 'diamond' },
  { key: 'stamp_card', label: 'Stamp Card Holders', icon: 'card' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: '#6B7280',
  queued: '#F59E0B',
  sending: '#3B82F6',
  sent: '#10B981',
  failed: '#EF4444',
  cancelled: '#9CA3AF',
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function MarketingScreen() {
  const { activeStore } = useStore();
  const [tab, setTab] = useState<Tab>('create');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Create form state
  const [name, setName] = useState('');
  const [objective, setObjective] = useState<ObjectiveType>('awareness');
  const [channel, setChannel] = useState<ChannelType>('whatsapp');
  const [message, setMessage] = useState('');
  const [targetingMode, setTargetingMode] = useState<TargetingMode>('segment');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [estimatedCount, setEstimatedCount] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);

  // Location filters
  const [locCity, setLocCity] = useState('');
  const [locArea, setLocArea] = useState('');
  const [locPincode, setLocPincode] = useState('');
  const [availableLocations, setAvailableLocations] = useState<{ cities: unknown[]; areas: unknown[] }>({
    cities: [],
    areas: [],
  });

  // Interest filters
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [availableInterests, setAvailableInterests] = useState<
    { tag: string; userCount: number }[]
  >([]);

  // Birthday filter
  const [birthdayDaysAhead, setBirthdayDaysAhead] = useState('1');

  // Purchase history filters
  const [purchaseKeyword, setPurchaseKeyword] = useState('');
  const [purchaseDays, setPurchaseDays] = useState('7');

  // Institution filters
  const [institutionName, setInstitutionName] = useState('');
  const [institutionType, setInstitutionType] = useState('');
  const [institutionArea, setInstitutionArea] = useState('');

  // Keyword search filters
  const [searchKeyword, setSearchKeyword] = useState('');
  const [keywordDays, setKeywordDays] = useState('30');

  // Campaigns list
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [statsModalCampaign, setStatsModalCampaign] = useState<Campaign | null>(null);

  // Analytics
  const [analytics, setAnalytics] = useState<unknown>(null);

  // Search Ads
  const [keywordBids, setKeywordBids] = useState<KeywordBid[]>([]);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidKeyword, setBidKeyword] = useState('');
  const [bidHeadline, setBidHeadline] = useState('');
  const [bidAmount, setBidAmount] = useState('2');
  const [bidDailyBudget, setBidDailyBudget] = useState('100');
  const [bidMatchType, setBidMatchType] = useState<'exact' | 'broad' | 'phrase'>('broad');

  const estimateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const merchantId = activeStore?._id || activeStore?.merchantId;

  // ── Load data ───────────────────────────────────────────────────────────────

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    if (tab === 'campaigns') loadCampaigns();
    if (tab === 'analytics') loadAnalytics();
    if (tab === 'searchads') loadKeywordBids();
  }, [tab]);

  useEffect(() => {
    // Debounced audience estimate whenever targeting changes
    if (estimateTimer.current) clearTimeout(estimateTimer.current);
    estimateTimer.current = setTimeout(() => estimateAudience(), 600);
    return () => {
      if (estimateTimer.current) clearTimeout(estimateTimer.current);
    };
  }, [
    targetingMode,
    selectedSegment,
    locCity,
    locArea,
    locPincode,
    selectedInterests,
    birthdayDaysAhead,
    purchaseKeyword,
    purchaseDays,
    institutionName,
    institutionType,
    institutionArea,
    searchKeyword,
    keywordDays,
    channel,
  ]);

  async function loadFilterOptions() {
    try {
      const [interestsRes, locationsRes] = await Promise.allSettled([
        apiClient.get(`${BASE}/audience/interests`),
        apiClient.get(`${BASE}/audience/locations`),
      ]);
      if (interestsRes.status === 'fulfilled')
        setAvailableInterests(interestsRes.value.data?.interests || []);
      if (locationsRes.status === 'fulfilled')
        setAvailableLocations(locationsRes.value.data || { cities: [], areas: [] });
    } catch {
      /* silent */
    }
  }

  async function loadCampaigns() {
    try {
      setLoading(true);
      const res = await apiClient.get(`${BASE}/marketing/campaigns`);
      setCampaigns(res.data?.campaigns || []);
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalytics() {
    try {
      setLoading(true);
      const res = await apiClient.get(`${BASE}/marketing/analytics?days=30`);
      setAnalytics(res.data);
    } catch {
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadKeywordBids() {
    try {
      setLoading(true);
      const res = await apiClient.get(`${BASE}/keyword-bids`);
      setKeywordBids(res.data?.bids || []);
    } catch {
      setKeywordBids([]);
    } finally {
      setLoading(false);
    }
  }

  // ── Audience estimate ───────────────────────────────────────────────────────

  async function estimateAudience() {
    if (!merchantId) return;
    setEstimating(true);
    try {
      const filter = buildAudienceFilter();
      const res = await apiClient.post(`${BASE}/estimate-audience`, {
        merchantId,
        filter,
        channel,
      });
      setEstimatedCount(res.data?.data?.estimatedCount ?? res.data?.estimatedCount ?? null);
    } catch {
      setEstimatedCount(null);
    } finally {
      setEstimating(false);
    }
  }

  function buildAudienceFilter(): AudienceFilter {
    switch (targetingMode) {
      case 'location':
        return {
          segment: 'location',
          location: {
            city: locCity.trim() || undefined,
            area: locArea.trim() || undefined,
            pincode: locPincode.trim() || undefined,
          },
        };
      case 'interest':
        return { segment: 'interest', interests: selectedInterests };
      case 'birthday':
        return { segment: 'birthday', birthday: { daysAhead: parseInt(birthdayDaysAhead) || 1 } };
      case 'purchase_history':
        return {
          segment: 'purchase_history',
          purchaseHistory: {
            productKeywords: purchaseKeyword.trim() ? [purchaseKeyword.trim()] : undefined,
            withinDays: parseInt(purchaseDays) || 7,
          },
        };
      case 'institution':
        return {
          segment: 'institution',
          institution: {
            name: institutionName.trim() || undefined,
            type: institutionType || undefined,
            area: institutionArea.trim() || undefined,
          },
        };
      case 'keyword':
        return {
          segment: 'keyword',
          keyword: {
            terms: searchKeyword.trim() ? [searchKeyword.trim()] : [],
            withinDays: parseInt(keywordDays) || 30,
          },
        };
      default:
        return { segment: selectedSegment };
    }
  }

  // ── Launch campaign ─────────────────────────────────────────────────────────

  async function launchCampaign() {
    if (!name.trim()) return showAlert('Campaign name is required');
    if (!message.trim()) return showAlert('Message is required');

    const filter = buildAudienceFilter();

    setLoading(true);
    try {
      const createRes = await apiClient.post(`${BASE}/marketing/campaigns`, {
        merchantId,
        name: name.trim(),
        objective,
        channel,
        message: message.trim(),
        audience: filter,
      });

      const campaignId = createRes.data?._id;
      if (campaignId) {
        await apiClient.post(`${BASE}/marketing/campaigns/${campaignId}/launch`);
      }

      showAlert('Campaign launched! 🚀', 'Your message is being delivered to your audience.');
      setName('');
      setMessage('');
      setTab('campaigns');
      loadCampaigns();
    } catch (err) {
      showAlert('Launch failed', err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Create keyword bid ──────────────────────────────────────────────────────

  async function createBid() {
    if (!bidKeyword.trim() || !bidHeadline.trim())
      return showAlert('Keyword and headline required');

    setLoading(true);
    try {
      await apiClient.post(`${BASE}/keyword-bids`, {
        keyword: bidKeyword.trim(),
        headline: bidHeadline.trim(),
        bidAmount: parseFloat(bidAmount) || 2,
        dailyBudget: parseFloat(bidDailyBudget) || 100,
        matchType: bidMatchType,
      });
      showAlert('Search Ad created! 🎯');
      setShowBidForm(false);
      setBidKeyword('');
      setBidHeadline('');
      loadKeywordBids();
    } catch (err) {
      showAlert('Failed to create bid', err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderTargetingFilters = () => {
    switch (targetingMode) {
      case 'segment':
        return (
          <View style={s.filterSection}>
            <ThemedText style={s.filterLabel}>Select Segment</ThemedText>
            <View style={s.segmentGrid}>
              {SEGMENTS.map((seg) => (
                <TouchableOpacity
                  key={seg.key}
                  style={[s.segmentChip, selectedSegment === seg.key && s.segmentChipActive]}
                  onPress={() => setSelectedSegment(seg.key)}
                >
                  <Ionicons
                    name={seg.icon as unknown as keyof typeof Ionicons.glyphMap}
                    size={14}
                    color={selectedSegment === seg.key ? '#fff' : '#7C3AED'}
                  />
                  <ThemedText
                    style={[
                      s.segmentChipText,
                      selectedSegment === seg.key && s.segmentChipTextActive,
                    ]}
                  >
                    {seg.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'location':
        return (
          <View style={s.filterSection}>
            <ThemedText style={s.filterLabel}>Location Targeting</ThemedText>
            <TextInput
              style={s.input}
              placeholder="City (e.g. Bangalore)"
              value={locCity}
              onChangeText={setLocCity}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={s.input}
              placeholder="Area / Neighbourhood (e.g. BTM Layout)"
              value={locArea}
              onChangeText={setLocArea}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={s.input}
              placeholder="Pincode (e.g. 560068)"
              value={locPincode}
              onChangeText={setLocPincode}
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
            {availableLocations.areas.length > 0 && (
              <>
                <ThemedText style={[s.filterLabel, { marginTop: 8 }]}>Popular Areas</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={s.chipRow}>
                    {availableLocations.areas.slice(0, 10).map((a) => (
                      <TouchableOpacity
                        key={a.name}
                        style={s.suggestChip}
                        onPress={() => setLocArea(a.name)}
                      >
                        <ThemedText style={s.suggestChipText}>
                          {a.name} ({a.userCount})
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        );

      case 'interest':
        return (
          <View style={s.filterSection}>
            <ThemedText style={s.filterLabel}>Interest Tags</ThemedText>
            <ThemedText style={s.filterHint}>
              Select one or more interests derived from customer purchase patterns
            </ThemedText>
            <View style={s.interestGrid}>
              {(availableInterests.length > 0 ? availableInterests : DEFAULT_INTERESTS).map(
                (interest) => {
                  const tag = typeof interest === 'string' ? interest : interest.tag;
                  const count = typeof interest === 'object' ? interest.userCount : null;
                  const active = selectedInterests.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[s.interestChip, active && s.interestChipActive]}
                      onPress={() =>
                        setSelectedInterests((prev) =>
                          active ? prev.filter((t) => t !== tag) : [...prev, tag]
                        )
                      }
                    >
                      <ThemedText style={[s.interestChipText, active && s.interestChipTextActive]}>
                        {tag.replace(/_/g, ' ')}
                        {count ? ` (${count})` : ''}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>
          </View>
        );

      case 'birthday':
        return (
          <View style={s.filterSection}>
            <ThemedText style={s.filterLabel}>Birthday Targeting</ThemedText>
            <ThemedText style={s.filterHint}>Target users whose birthday is coming up</ThemedText>
            <View style={s.birthdayRow}>
              {['0', '1', '7', '30'].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[s.dayChip, birthdayDaysAhead === d && s.dayChipActive]}
                  onPress={() => setBirthdayDaysAhead(d)}
                >
                  <ThemedText
                    style={[s.dayChipText, birthdayDaysAhead === d && s.dayChipTextActive]}
                  >
                    {d === '0' ? 'Today' : d === '1' ? 'Tomorrow' : `In ${d} days`}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'purchase_history':
        return (
          <View style={s.filterSection}>
            <ThemedText style={s.filterLabel}>Purchase History</ThemedText>
            <TextInput
              style={s.input}
              placeholder="Product keyword (e.g. chicken, biryani, coffee)"
              value={purchaseKeyword}
              onChangeText={setPurchaseKeyword}
              placeholderTextColor="#9CA3AF"
            />
            <ThemedText style={[s.filterLabel, { marginTop: 10 }]}>Ordered within last</ThemedText>
            <View style={s.birthdayRow}>
              {['3', '7', '14', '30', '60'].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[s.dayChip, purchaseDays === d && s.dayChipActive]}
                  onPress={() => setPurchaseDays(d)}
                >
                  <ThemedText style={[s.dayChipText, purchaseDays === d && s.dayChipTextActive]}>
                    {d}d
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'institution':
        return (
          <View style={s.filterSection}>
            <ThemedText style={s.filterLabel}>Institution Targeting</ThemedText>
            <TextInput
              style={s.input}
              placeholder="Institution name (e.g. Oxford College)"
              value={institutionName}
              onChangeText={setInstitutionName}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={s.input}
              placeholder="Area (e.g. Koramangala)"
              value={institutionArea}
              onChangeText={setInstitutionArea}
              placeholderTextColor="#9CA3AF"
            />
            <ThemedText style={[s.filterLabel, { marginTop: 8 }]}>Type</ThemedText>
            <View style={s.birthdayRow}>
              {['college', 'school', 'office', 'hospital'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[s.dayChip, institutionType === t && s.dayChipActive]}
                  onPress={() => setInstitutionType((prev) => (prev === t ? '' : t))}
                >
                  <ThemedText style={[s.dayChipText, institutionType === t && s.dayChipTextActive]}>
                    {t}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'keyword':
        return (
          <View style={s.filterSection}>
            <ThemedText style={s.filterLabel}>Keyword Search Targeting</ThemedText>
            <ThemedText style={s.filterHint}>
              Target users who searched this term in REZ app
            </ThemedText>
            <TextInput
              style={s.input}
              placeholder="Search term (e.g. biryani, coffee, salon)"
              value={searchKeyword}
              onChangeText={setSearchKeyword}
              placeholderTextColor="#9CA3AF"
            />
            <ThemedText style={[s.filterLabel, { marginTop: 10 }]}>Searched within last</ThemedText>
            <View style={s.birthdayRow}>
              {['7', '14', '30', '60'].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[s.dayChip, keywordDays === d && s.dayChipActive]}
                  onPress={() => setKeywordDays(d)}
                >
                  <ThemedText style={[s.dayChipText, keywordDays === d && s.dayChipTextActive]}>
                    {d}d
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
    }
  };

  // ── Tab: Create ─────────────────────────────────────────────────────────────

  const renderCreate = () => (
    <ScrollView contentContainerStyle={s.tabContent} showsVerticalScrollIndicator={false}>
      {/* Message Templates shortcut */}
      <TouchableOpacity
        style={s.templatesLink}
        onPress={() => router.push('/marketing/templates')}
        activeOpacity={0.8}
      >
        <View style={s.templatesLinkIcon}>
          <Ionicons name="document-text-outline" size={18} color="#7C3AED" />
        </View>
        <View style={s.templatesLinkText}>
          <ThemedText style={s.templatesLinkTitle}>Message Templates</ThemedText>
          <ThemedText style={s.templatesLinkSub}>
            Create and reuse saved message templates
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </TouchableOpacity>

      {/* Campaign Name */}
      <View style={s.card}>
        <ThemedText style={s.cardTitle}>Campaign Name</ThemedText>
        <TextInput
          style={s.input}
          placeholder="e.g. Weekend Coffee Special"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Objective */}
      <View style={s.card}>
        <ThemedText style={s.cardTitle}>Objective</ThemedText>
        <View style={s.objectiveGrid}>
          {OBJECTIVES.map((obj) => (
            <TouchableOpacity
              key={obj.key}
              style={[
                s.objectiveCard,
                objective === obj.key && {
                  borderColor: obj.color,
                  borderWidth: 2,
                  backgroundColor: obj.color + '10',
                },
              ]}
              onPress={() => {
                setObjective(obj.key);
                if (!message) setMessage(obj.template);
              }}
            >
              <Ionicons
                name={obj.icon as unknown as keyof typeof Ionicons.glyphMap}
                size={20}
                color={objective === obj.key ? obj.color : '#9CA3AF'}
              />
              <ThemedText style={[s.objectiveLabel, objective === obj.key && { color: obj.color }]}>
                {obj.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Channel */}
      <View style={s.card}>
        <ThemedText style={s.cardTitle}>Channel</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.channelRow}>
            {CHANNELS.map((ch) => (
              <TouchableOpacity
                key={ch.key}
                style={[
                  s.channelCard,
                  channel === ch.key && { borderColor: ch.bg, borderWidth: 2 },
                ]}
                onPress={() => setChannel(ch.key)}
              >
                <View style={[s.channelIcon, { backgroundColor: ch.bg }]}>
                  <Ionicons name={ch.icon as unknown as keyof typeof Ionicons.glyphMap} size={18} color={ch.color} />
                </View>
                <ThemedText
                  style={[
                    s.channelLabel,
                    channel === ch.key && { color: ch.bg, fontWeight: '700' },
                  ]}
                >
                  {ch.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Audience Targeting */}
      <View style={s.card}>
        <ThemedText style={s.cardTitle}>Audience Targeting</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={s.chipRow}>
            {TARGETING_MODES.map((mode) => (
              <TouchableOpacity
                key={mode.key}
                style={[s.modeChip, targetingMode === mode.key && { backgroundColor: mode.color }]}
                onPress={() => setTargetingMode(mode.key)}
              >
                <Ionicons
                  name={mode.icon as unknown as keyof typeof Ionicons.glyphMap}
                  size={13}
                  color={targetingMode === mode.key ? '#fff' : '#6B7280'}
                />
                <ThemedText
                  style={[
                    s.modeChipText,
                    targetingMode === mode.key && { color: '#fff', fontWeight: '600' },
                  ]}
                >
                  {mode.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {renderTargetingFilters()}

        {/* Audience estimate pill */}
        <View style={s.estimatePill}>
          {estimating ? (
            <ActivityIndicator size="small" color="#7C3AED" />
          ) : (
            <Ionicons name="people" size={14} color="#7C3AED" />
          )}
          <ThemedText style={s.estimateText}>
            {estimating
              ? 'Estimating…'
              : estimatedCount !== null
                ? `~${estimatedCount.toLocaleString()} people will receive this`
                : 'Calculating reach…'}
          </ThemedText>
        </View>
      </View>

      {/* Message */}
      <View style={s.card}>
        <ThemedText style={s.cardTitle}>Message</ThemedText>
        <ThemedText style={s.filterHint}>
          Use {'{{name}}'} to personalise with customer name
        </ThemedText>
        <TextInput
          style={[s.input, s.messageInput]}
          placeholder="Write your campaign message…"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={5}
          placeholderTextColor="#9CA3AF"
          textAlignVertical="top"
        />
        <ThemedText style={s.charCount}>{message.length} / 4096</ThemedText>
      </View>

      {/* Preview */}
      {message.length > 0 && channel === 'whatsapp' && (
        <View style={s.card}>
          <ThemedText style={s.cardTitle}>WhatsApp Preview</ThemedText>
          <View style={s.waPreviewContainer}>
            <View style={s.waHeader}>
              <View style={s.waAvatar}>
                <Ionicons name="storefront" size={16} color="#fff" />
              </View>
              <View>
                <ThemedText style={s.waStoreName}>{activeStore?.name || 'Your Store'}</ThemedText>
                <ThemedText style={s.waOnline}>Online</ThemedText>
              </View>
            </View>
            <View style={s.waBody}>
              <View style={s.waBubble}>
                <ThemedText style={s.waBubbleText}>{message}</ThemedText>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Launch */}
      <TouchableOpacity style={s.launchBtn} onPress={launchCampaign} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="rocket" size={18} color="#fff" />
            <ThemedText style={s.launchBtnText}>
              Launch Campaign{estimatedCount ? ` · ${estimatedCount.toLocaleString()} reach` : ''}
            </ThemedText>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  // ── Tab: Campaigns ──────────────────────────────────────────────────────────

  const renderCampaigns = () => (
    <ScrollView
      contentContainerStyle={s.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await loadCampaigns();
            setRefreshing(false);
          }}
        />
      }
    >
      {/* Offline Ads entry point */}
      <TouchableOpacity
        style={s.automationBanner}
        onPress={() => router.push('/offline-ads')}
        activeOpacity={0.85}
      >
        <View style={[s.automationBannerIcon, { backgroundColor: '#fef3c7' }]}>
          <Ionicons name="megaphone" size={20} color="#d97706" />
        </View>
        <View style={s.automationBannerText}>
          <ThemedText style={s.automationBannerTitle}>Offline Ads</ThemedText>
          <ThemedText style={s.automationBannerSub}>
            Rickshaw, bus, hoarding, billboard ads with QR codes
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
      </TouchableOpacity>

      {/* Automations entry point */}
      <TouchableOpacity
        style={s.automationBanner}
        onPress={() => router.push('/automation')}
        activeOpacity={0.85}
      >
        <View style={s.automationBannerIcon}>
          <Ionicons name="flash" size={20} color="#6366f1" />
        </View>
        <View style={s.automationBannerText}>
          <ThemedText style={s.automationBannerTitle}>Automations</ThemedText>
          <ThemedText style={s.automationBannerSub}>
            Set-and-forget rules: rebooking, birthday, review requests
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
      </TouchableOpacity>

      {loading && campaigns.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#7C3AED" />
      ) : campaigns.length === 0 ? (
        <View style={s.emptyState}>
          <Ionicons name="megaphone-outline" size={48} color="#D1D5DB" />
          <ThemedText style={s.emptyText}>No campaigns yet</ThemedText>
          <ThemedText style={s.emptySubtext}>
            Launch your first campaign from the Create tab
          </ThemedText>
        </View>
      ) : (
        campaigns.map((c) => (
          <TouchableOpacity
            key={c._id}
            style={s.campaignCard}
            onPress={() => setStatsModalCampaign(c)}
          >
            <View style={s.campaignCardHeader}>
              <View style={s.campaignMeta}>
                <ThemedText style={s.campaignName}>{c.name}</ThemedText>
                <ThemedText style={s.campaignSub}>
                  {CHANNELS.find((ch) => ch.key === c.channel)?.label || c.channel} ·{' '}
                  {c.audience?.segment || 'all'}
                </ThemedText>
              </View>
              <View
                style={[
                  s.statusBadge,
                  { backgroundColor: (STATUS_COLORS[c.status] || '#6B7280') + '18' },
                ]}
              >
                <ThemedText
                  style={[s.statusBadgeText, { color: STATUS_COLORS[c.status] || '#6B7280' }]}
                >
                  {c.status}
                </ThemedText>
              </View>
            </View>
            <View style={s.miniStats}>
              <View style={s.miniStat}>
                <ThemedText style={s.miniStatVal}>{c.stats?.sent || 0}</ThemedText>
                <ThemedText style={s.miniStatLabel}>Sent</ThemedText>
              </View>
              <View style={s.miniStat}>
                <ThemedText style={s.miniStatVal}>{c.stats?.delivered || 0}</ThemedText>
                <ThemedText style={s.miniStatLabel}>Delivered</ThemedText>
              </View>
              <View style={s.miniStat}>
                <ThemedText style={s.miniStatVal}>{c.stats?.opened || 0}</ThemedText>
                <ThemedText style={s.miniStatLabel}>Opened</ThemedText>
              </View>
              <View style={s.miniStat}>
                <ThemedText style={s.miniStatVal}>{c.stats?.converted || 0}</ThemedText>
                <ThemedText style={s.miniStatLabel}>Converted</ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  // ── Tab: Analytics ──────────────────────────────────────────────────────────

  const renderAnalytics = () => (
    <ScrollView
      contentContainerStyle={s.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await loadAnalytics();
            setRefreshing(false);
          }}
        />
      }
    >
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#7C3AED" />
      ) : !analytics ? (
        <View style={s.emptyState}>
          <Ionicons name="bar-chart-outline" size={48} color="#D1D5DB" />
          <ThemedText style={s.emptyText}>No analytics yet</ThemedText>
        </View>
      ) : (
        <>
          <View style={s.analyticsGrid}>
            {[
              {
                label: 'Total Campaigns',
                val: analytics.totalCampaigns,
                icon: 'megaphone',
                color: '#7C3AED',
              },
              {
                label: 'Total Reach',
                val: analytics.totalReach?.toLocaleString(),
                icon: 'people',
                color: '#3B82F6',
              },
              {
                label: 'Avg Delivery',
                val: `${analytics.avgDeliveryRate || 0}%`,
                icon: 'checkmark-circle',
                color: '#10B981',
              },
              {
                label: 'Avg Open Rate',
                val: `${analytics.avgOpenRate || 0}%`,
                icon: 'eye',
                color: '#F59E0B',
              },
            ].map((stat) => (
              <View key={stat.label} style={s.analyticsCard}>
                <View style={[s.analyticsIcon, { backgroundColor: stat.color + '18' }]}>
                  <Ionicons name={stat.icon as unknown as keyof typeof Ionicons.glyphMap} size={18} color={stat.color} />
                </View>
                <ThemedText style={[s.analyticsVal, { color: stat.color }]}>{stat.val}</ThemedText>
                <ThemedText style={s.analyticsLabel}>{stat.label}</ThemedText>
              </View>
            ))}
          </View>

          <View style={s.card}>
            <ThemedText style={s.cardTitle}>Performance Insights</ThemedText>
            <View style={s.insightRow}>
              <Ionicons name="trophy" size={16} color="#F59E0B" />
              <ThemedText style={s.insightText}>
                Best channel:{' '}
                <ThemedText style={s.insightHighlight}>{analytics.topChannel}</ThemedText>
              </ThemedText>
            </View>
            <View style={s.insightRow}>
              <Ionicons name="people" size={16} color="#7C3AED" />
              <ThemedText style={s.insightText}>
                Best audience:{' '}
                <ThemedText style={s.insightHighlight}>
                  {(analytics.topSegment || '').replace(/_/g, ' ')}
                </ThemedText>
              </ThemedText>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );

  // ── Tab: Search Ads ─────────────────────────────────────────────────────────

  const renderSearchAds = () => (
    <ScrollView
      contentContainerStyle={s.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await loadKeywordBids();
            setRefreshing(false);
          }}
        />
      }
    >
      <View style={s.card}>
        <View style={s.searchAdHeader}>
          <View>
            <ThemedText style={s.cardTitle}>Search Ads</ThemedText>
            <ThemedText style={s.filterHint}>
              Show your store when users search for keywords in REZ
            </ThemedText>
          </View>
          <TouchableOpacity style={s.addBidBtn} onPress={() => setShowBidForm(true)}>
            <Ionicons name="add" size={16} color="#fff" />
            <ThemedText style={s.addBidBtnText}>New Ad</ThemedText>
          </TouchableOpacity>
        </View>

        {showBidForm && (
          <View style={s.bidForm}>
            <ThemedText style={[s.filterLabel, { marginTop: 0 }]}>Keyword to bid on</ThemedText>
            <TextInput
              style={s.input}
              placeholder="e.g. coffee, biryani, salon"
              value={bidKeyword}
              onChangeText={setBidKeyword}
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
            />
            <ThemedText style={s.filterLabel}>Ad Headline (80 chars max)</ThemedText>
            <TextInput
              style={s.input}
              placeholder="Best Coffee in BTM — Order Now"
              value={bidHeadline}
              onChangeText={setBidHeadline}
              placeholderTextColor="#9CA3AF"
              maxLength={80}
            />
            <View style={s.bidRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <ThemedText style={s.filterLabel}>Bid ₹/click</ThemedText>
                <TextInput
                  style={s.input}
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={s.filterLabel}>Daily budget ₹</ThemedText>
                <TextInput
                  style={s.input}
                  value={bidDailyBudget}
                  onChangeText={setBidDailyBudget}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
            <ThemedText style={s.filterLabel}>Match Type</ThemedText>
            <View style={s.birthdayRow}>
              {(['broad', 'phrase', 'exact'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[s.dayChip, bidMatchType === m && s.dayChipActive]}
                  onPress={() => setBidMatchType(m)}
                >
                  <ThemedText style={[s.dayChipText, bidMatchType === m && s.dayChipTextActive]}>
                    {m}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.bidFormActions}>
              <TouchableOpacity style={s.cancelBidBtn} onPress={() => setShowBidForm(false)}>
                <ThemedText style={s.cancelBidBtnText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBidBtn} onPress={createBid} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={s.saveBidBtnText}>Create Ad</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {keywordBids.length === 0 && !loading ? (
        <View style={s.emptyState}>
          <Ionicons name="search-outline" size={48} color="#D1D5DB" />
          <ThemedText style={s.emptyText}>No Search Ads yet</ThemedText>
          <ThemedText style={s.emptySubtext}>
            Create a keyword bid to appear in REZ search results
          </ThemedText>
        </View>
      ) : (
        keywordBids.map((bid) => (
          <View key={bid._id} style={s.campaignCard}>
            <View style={s.campaignCardHeader}>
              <View style={s.campaignMeta}>
                <View style={s.bidKeywordRow}>
                  <ThemedText style={s.campaignName}>"{bid.keyword}"</ThemedText>
                  <View
                    style={[
                      s.statusBadge,
                      { backgroundColor: bid.isActive ? '#10B98118' : '#6B728018' },
                    ]}
                  >
                    <ThemedText
                      style={[s.statusBadgeText, { color: bid.isActive ? '#10B981' : '#6B7280' }]}
                    >
                      {bid.isActive ? 'Active' : 'Paused'}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={s.campaignSub}>{bid.headline}</ThemedText>
                <ThemedText style={s.campaignSub}>
                  ₹{bid.bidAmount}/click · ₹{bid.dailyBudget}/day · {bid.matchType}
                </ThemedText>
              </View>
            </View>
            <View style={s.miniStats}>
              <View style={s.miniStat}>
                <ThemedText style={s.miniStatVal}>{bid.impressions}</ThemedText>
                <ThemedText style={s.miniStatLabel}>Impressions</ThemedText>
              </View>
              <View style={s.miniStat}>
                <ThemedText style={s.miniStatVal}>{bid.clicks}</ThemedText>
                <ThemedText style={s.miniStatLabel}>Clicks</ThemedText>
              </View>
              <View style={s.miniStat}>
                <ThemedText style={s.miniStatVal}>
                  {bid.impressions > 0 ? ((bid.clicks / bid.impressions) * 100).toFixed(1) : 0}%
                </ThemedText>
                <ThemedText style={s.miniStatLabel}>CTR</ThemedText>
              </View>
              <View style={s.miniStat}>
                <ThemedText style={s.miniStatVal}>₹{bid.totalSpent?.toFixed(0) || 0}</ThemedText>
                <ThemedText style={s.miniStatLabel}>Spent</ThemedText>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  // ── Stats modal ─────────────────────────────────────────────────────────────

  const renderStatsModal = () => {
    if (!statsModalCampaign) return null;
    const c = statsModalCampaign;
    const sent = c.stats?.sent || 0;
    const delivered = c.stats?.delivered || 0;
    const opened = c.stats?.opened || 0;
    const converted = c.stats?.converted || 0;
    const deliveryRate = sent > 0 ? Math.round((delivered / sent) * 100) : 0;
    const openRate = delivered > 0 ? Math.round((opened / delivered) * 100) : 0;
    const convRate = sent > 0 ? Math.round((converted / sent) * 100) : 0;

    return (
      <Modal
        visible
        transparent
        animationType="slide"
        onRequestClose={() => setStatsModalCampaign(null)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <ThemedText style={s.modalTitle}>{c.name}</ThemedText>
              <TouchableOpacity onPress={() => setStatsModalCampaign(null)}>
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>
            {[
              { label: 'Sent', val: sent, pct: null, color: '#7C3AED' },
              { label: 'Delivered', val: delivered, pct: deliveryRate, color: '#3B82F6' },
              { label: 'Opened', val: opened, pct: openRate, color: '#10B981' },
              { label: 'Converted', val: converted, pct: convRate, color: '#F59E0B' },
              { label: 'Failed', val: c.stats?.failed || 0, pct: null, color: '#EF4444' },
            ].map((stat) => (
              <View key={stat.label} style={s.statRow}>
                <ThemedText style={s.statRowLabel}>{stat.label}</ThemedText>
                <View style={s.statRowRight}>
                  <ThemedText style={[s.statRowVal, { color: stat.color }]}>
                    {stat.val.toLocaleString()}
                  </ThemedText>
                  {stat.pct !== null && <ThemedText style={s.statRowPct}>{stat.pct}%</ThemedText>}
                </View>
              </View>
            ))}
          </View>
        </View>
      </Modal>
    );
  };

  // ── Main render ─────────────────────────────────────────────────────────────

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'create', label: 'Create', icon: 'add-circle' },
    { key: 'campaigns', label: 'Campaigns', icon: 'megaphone' },
    { key: 'analytics', label: 'Analytics', icon: 'bar-chart' },
    { key: 'searchads', label: 'Search Ads', icon: 'search' },
  ];

  return (
    <ThemedView style={s.container}>
      {/* Header */}
      <LinearGradient colors={['#1a0533', '#2d1155'] as const} style={s.header}>
        <View style={s.headerRow}>
          <View>
            <ThemedText style={s.headerTitle}>Ads Manager</ThemedText>
            <ThemedText style={s.headerSub}>REZ Marketing Platform</ThemedText>
          </View>
          <View style={s.betaBadge}>
            <ThemedText style={s.betaText}>BETA</ThemedText>
          </View>
        </View>

        {/* Tab bar */}
        <View style={s.tabBar}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[s.tabItem, tab === t.key && s.tabItemActive]}
              onPress={() => setTab(t.key)}
            >
              <Ionicons
                name={t.icon as unknown as keyof typeof Ionicons.glyphMap}
                size={15}
                color={tab === t.key ? '#fff' : 'rgba(255,255,255,0.5)'}
              />
              <ThemedText style={[s.tabLabel, tab === t.key && s.tabLabelActive]}>
                {t.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {tab === 'create' && renderCreate()}
        {tab === 'campaigns' && renderCampaigns()}
        {tab === 'analytics' && renderAnalytics()}
        {tab === 'searchads' && renderSearchAds()}
      </View>

      {renderStatsModal()}
    </ThemedView>
  );
}

// ── Default interests (shown when marketing service has no data yet) ───────────

const DEFAULT_INTERESTS = [
  'coffee',
  'fast_food',
  'biryani',
  'pizza',
  'non_veg',
  'south_indian_food',
  'beverages',
  'desserts',
  'bakery',
  'vegan',
  'electronics',
  'fashion',
  'footwear',
  'beauty',
  'salon',
  'fitness',
  'sports',
  'pharmacy',
  'groceries',
  'recharge',
];

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingTop: Platform.OS === 'ios' ? 54 : 36, paddingBottom: 0, paddingHorizontal: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  betaBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  betaText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 1 },

  tabBar: { flexDirection: 'row', gap: 4, marginBottom: 1 },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabItemActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  tabLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  tabLabelActive: { color: '#fff' },

  tabContent: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 },

  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#111827',
    marginBottom: 10,
  },
  messageInput: { height: 110, paddingTop: 11 },
  charCount: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: -4 },

  objectiveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  objectiveCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  objectiveLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', textAlign: 'center' },

  channelRow: { flexDirection: 'row', gap: 8 },
  channelCard: {
    alignItems: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 72,
  },
  channelIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280' },

  chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modeChipText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },

  filterSection: { marginTop: 4 },
  filterLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 8 },
  filterHint: { fontSize: 11, color: '#9CA3AF', marginBottom: 10, marginTop: -4 },

  segmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  segmentChipActive: { backgroundColor: '#7C3AED' },
  segmentChipText: { fontSize: 12, fontWeight: '600', color: '#7C3AED' },
  segmentChipTextActive: { color: '#fff' },

  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  interestChipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  interestChipText: { fontSize: 12, fontWeight: '500', color: '#374151' },
  interestChipTextActive: { color: '#fff', fontWeight: '600' },

  birthdayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  dayChipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  dayChipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  dayChipTextActive: { color: '#fff' },

  suggestChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    marginRight: 6,
  },
  suggestChipText: { fontSize: 11, color: '#7C3AED', fontWeight: '600' },

  estimatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  estimateText: { fontSize: 13, fontWeight: '600', color: '#7C3AED', flex: 1 },

  waPreviewContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  waHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#128C7E',
  },
  waAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waStoreName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  waOnline: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  waBody: { backgroundColor: '#ECE5DD', padding: 12, minHeight: 80 },
  waBubble: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderTopLeftRadius: 2,
    padding: 10,
    maxWidth: '80%',
    elevation: 1,
  },
  waBubbleText: { fontSize: 14, color: '#111827', lineHeight: 20 },

  launchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
  },
  launchBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Automation banner
  automationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ede9fe',
    gap: 12,
  },
  automationBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  automationBannerText: { flex: 1 },
  automationBannerTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  automationBannerSub: { fontSize: 12, color: '#6b7280' },

  campaignCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  campaignCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  campaignMeta: { flex: 1, marginRight: 12 },
  campaignName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  campaignSub: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  miniStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  miniStat: { alignItems: 'center', flex: 1 },
  miniStatVal: { fontSize: 16, fontWeight: '700', color: '#111827' },
  miniStatLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },

  analyticsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 },
  analyticsCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  analyticsIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  analyticsVal: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  analyticsLabel: { fontSize: 11, color: '#9CA3AF', textAlign: 'center' },
  insightRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  insightText: { fontSize: 13, color: '#374151' },
  insightHighlight: { fontWeight: '700', color: '#7C3AED' },

  searchAdHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addBidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addBidBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  bidForm: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  bidRow: { flexDirection: 'row' },
  bidKeywordRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  bidFormActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBidBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelBidBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  saveBidBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
  },
  saveBidBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySubtext: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 30 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827', flex: 1 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statRowLabel: { fontSize: 14, color: '#374151', fontWeight: '500' },
  statRowRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statRowVal: { fontSize: 18, fontWeight: '700' },
  statRowPct: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },

  // Message Templates link
  templatesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  templatesLinkIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  templatesLinkText: { flex: 1, gap: 2 },
  templatesLinkTitle: { fontSize: 14, fontWeight: '700', color: '#7C3AED' },
  templatesLinkSub: { fontSize: 12, color: '#9CA3AF' },
});
