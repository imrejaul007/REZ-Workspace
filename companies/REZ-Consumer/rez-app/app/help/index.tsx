import { withErrorBoundary } from '@/utils/withErrorBoundary';
// Help & Support Main Page
// Central hub for user assistance and support

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
  Platform,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { showToast } from '@/components/common/ToastManager';
import supportApi from '@/services/supportApi';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  route: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  isExpanded?: boolean;
}

interface HelpCategory {
  id: string;
  title: string;
  icon: string;
  iconColor: string;
  itemCount: number;
  route: string;
}

function HelpPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  // Support ticket form state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const handleBackPress = () => {
    // eslint-disable-next-line no-unused-expressions
    router.canGoBack() ? router.back() : router.replace('/(tabs)');
  };

  const handleFAQPress = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const quickActions: QuickAction[] = [
    {
      id: 'chat',
      title: 'Live Chat',
      description: 'Get instant help from our support team',
      icon: 'chatbubble-ellipses',
      iconColor: Colors.success,
      route: '/help/chat',
    },
    {
      id: 'call',
      title: 'Call Support',
      description: 'Speak directly with a support agent',
      icon: 'call',
      iconColor: Colors.info,
      route: '/help/call',
    },
    {
      id: 'email',
      title: 'Email Us',
      description: 'Send us a detailed message',
      icon: 'mail',
      iconColor: Colors.brand.purpleLight,
      route: '/help/email',
    },
    {
      id: 'feedback',
      title: 'Send Feedback',
      description: 'Share your thoughts and suggestions',
      icon: 'star',
      iconColor: Colors.warning,
      route: '/help/feedback',
    },
  ];

  const helpCategories: HelpCategory[] = [
    {
      id: 'orders',
      title: 'Orders & Delivery',
      icon: 'bag-handle',
      iconColor: Colors.success,
      itemCount: 12,
      route: '/help/orders',
    },
    {
      id: 'payments',
      title: 'Payments & Refunds',
      icon: 'card',
      iconColor: Colors.info,
      itemCount: 8,
      route: '/help/payments',
    },
    {
      id: 'account',
      title: 'Account & Profile',
      icon: 'person',
      iconColor: Colors.brand.purpleLight,
      itemCount: 6,
      route: '/help/account',
    },
    {
      id: 'technical',
      title: 'Technical Issues',
      icon: 'settings',
      iconColor: Colors.error,
      itemCount: 10,
      route: '/help/technical',
    },
    {
      id: 'features',
      title: 'App Features',
      icon: 'apps',
      iconColor: Colors.warning,
      itemCount: 15,
      route: '/help/features',
    },
    {
      id: 'policies',
      title: 'Policies & Terms',
      icon: 'document-text',
      iconColor: colors.text.tertiary,
      itemCount: 5,
      route: '/help/policies',
    },
  ];

  const popularFAQs: FAQItem[] = [
    {
      id: 'faq1',
      question: 'How do I earn coins?',
      answer:
        'You earn REZ coins by scanning the QR code at participating stores during checkout. Each eligible purchase gives you cashback in REZ coins — typically a percentage of your bill. You can also earn coins by completing challenges, referring friends, and through bonus zone offers.',
      category: 'coins',
    },
    {
      id: 'faq2',
      question: 'When do my coins expire?',
      answer:
        "REZ coins never expire — they stay in your wallet indefinitely. Promo coins expire after 90 days and Privé coins expire after 12 months. You can check expiry details for each coin type in the Wallet section. You'll receive reminder notifications as expiring coins approach their expiry date.",
      category: 'coins',
    },
    {
      id: 'faq3',
      question: 'How do I redeem coins?',
      answer:
        'You can redeem your REZ coins at checkout in unknown participating store. Simply show your QR code or enter your REZ ID at the counter. The conversion rate is 1 coin = ₹1.00, so 100 coins = ₹100 off your bill. Go to the Redeem Coins section in your Wallet to see your available balance.',
      category: 'coins',
    },
    {
      id: 'faq4',
      question: "Why didn't I get cashback?",
      answer:
        "Cashback is awarded when you check in at a store using the QR code within the eligible time window (typically during your visit). Common reasons for missing cashback: the store may not yet be listed as a REZ partner, the check-in was outside the store's eligible hours, or there was a network issue during scanning. If you believe cashback was missed in error, contact our support team with your visit details.",
      category: 'coins',
    },
    {
      id: 'faq5',
      question: 'How does group buy work?',
      answer:
        'Group Buy lets you pool purchases with friends to unlock higher discounts that are only available when buying together. Create or join a group buy from the Group Buy section, share the link with friends, and once the minimum number of participants is reached, everyone gets the discounted price. Coins earned from group buys follow the same rules as regular purchases.',
      category: 'features',
    },
    {
      id: 'faq6',
      question: 'What is REZ Premium?',
      answer:
        'REZ Premium is our subscription plan at ₹99/month that gives you 2x coins on every purchase, access to exclusive member-only deals, no ads, priority customer support, and early access to new features. You can subscribe or manage your Premium membership from the Premium section in your profile.',
      category: 'features',
    },
  ];

  const handleTicketSubmit = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      showToast({
        type: 'warning',
        message: 'Please enter both a subject and a message.',
      });
      return;
    }
    setTicketSubmitting(true);
    try {
      const response = await supportApi.createTicket({
        subject: ticketSubject.trim(),
        category: 'other',
        message: ticketMessage.trim(),
      });
      if (response.success) {
        setTicketSuccess(true);
        setTicketSubject('');
        setTicketMessage('');
      } else {
        showToast({
          type: 'error',
          message: 'Failed to submit your request. Please try again.',
        });
      }
    } catch {
      showToast({
        type: 'error',
        message: 'Something went wrong. Please try again later.',
      });
    } finally {
      setTicketSubmitting(false);
    }
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:support@rez.money').catch(() => {
      showToast({
        type: 'error',
        message: 'Unable to open email client.',
      });
    });
  };

  const filteredFAQs = popularFAQs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderQuickAction = (action: QuickAction) => (
    <Pressable
      key={action.id}
      style={styles.quickAction}
      onPress={() => router.push(action.route as unknown as string)}
      accessibilityLabel={`${action.title}. ${action.description}`}
      accessibilityRole="button"
      accessibilityHint="Double tap to access this support option"
    >
      <View style={[styles.quickActionIcon, { backgroundColor: action.iconColor + '15' }]}>
        <Ionicons name={action.icon as unknown} size={24} color={action.iconColor} />
      </View>
      <ThemedText style={styles.quickActionTitle}>{action.title}</ThemedText>
      <ThemedText style={styles.quickActionDescription}>{action.description}</ThemedText>
    </Pressable>
  );

  const renderHelpCategory = (category: HelpCategory) => (
    <Pressable
      key={category.id}
      style={styles.helpCategory}
      onPress={() => router.push(category.route as unknown as string)}
      accessibilityLabel={`${category.title} category. ${category.itemCount} articles available`}
      accessibilityRole="button"
      accessibilityHint="Double tap to browse articles in this category"
    >
      <View style={styles.categoryLeft}>
        <View style={[styles.categoryIcon, { backgroundColor: category.iconColor + '15' }]}>
          <Ionicons name={category.icon as unknown} size={20} color={category.iconColor} />
        </View>

        <View style={styles.categoryText}>
          <ThemedText style={styles.categoryTitle}>{category.title}</ThemedText>
          <ThemedText style={styles.categoryCount}>{category.itemCount} articles</ThemedText>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
    </Pressable>
  );

  const renderFAQItem = (faq: FAQItem) => {
    const isExpanded = expandedFAQ === faq.id;
    return (
      <Pressable
        key={faq.id}
        style={styles.faqItem}
        onPress={() => handleFAQPress(faq.id)}
        accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} FAQ: ${faq.question}`}
        accessibilityRole="button"
        accessibilityHint="Double tap to view answer"
        accessibilityState={{ expanded: isExpanded }}
      >
        <View style={styles.faqHeader}>
          <ThemedText style={styles.faqQuestion}>{faq.question}</ThemedText>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.text.tertiary} />
        </View>

        {isExpanded && (
          <View style={styles.faqAnswer} accessibilityLabel={`Answer: ${faq.answer}`} accessibilityRole="text">
            <ThemedText style={styles.faqAnswerText}>{faq.answer}</ThemedText>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.brand.purpleLight} translucent={false} />

      {/* Header */}
      <LinearGradient colors={[Colors.brand.purpleLight, colors.brand.purpleMedium] as const} style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable
            style={styles.backButton}
            onPress={handleBackPress}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            accessibilityHint="Double tap to return to previous screen"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>

          <ThemedText style={styles.headerTitle}>Help & Support</ThemedText>

          <View style={styles.headerRight} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.text.tertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            accessibilityLabel="Search help articles"
            accessibilityHint="Enter keywords to search for help articles"
            accessibilityRole="search"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              accessibilityLabel="Clear search"
              accessibilityRole="button"
              accessibilityHint="Double tap to clear search text"
            >
              <Ionicons name="close" size={18} color={colors.text.tertiary} />
            </Pressable>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Get Quick Help</ThemedText>
          <View style={styles.quickActions}>{quickActions.map(renderQuickAction)}</View>
        </View>

        {/* Help Categories */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Browse by Category</ThemedText>
          <View style={styles.helpCategories}>{helpCategories.map(renderHelpCategory)}</View>
        </View>

        {/* Popular FAQs */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            {searchQuery ? `Search Results (${filteredFAQs.length})` : 'Popular Questions'}
          </ThemedText>
          <View style={styles.faqList}>{filteredFAQs.map(renderFAQItem)}</View>

          {filteredFAQs.length === 0 && searchQuery && (
            <View style={styles.noResults}>
              <Ionicons name="search" size={48} color={colors.border.default} />
              <ThemedText style={styles.noResultsTitle}>No results found</ThemedText>
              <ThemedText style={styles.noResultsText}>
                Try searching with different keywords or browse our help categories above.
              </ThemedText>
            </View>
          )}
        </View>

        {/* Contact Support Ticket Form */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Contact Support</ThemedText>
          {ticketSuccess ? (
            <View style={styles.ticketSuccess}>
              <Ionicons name="checkmark-circle" size={40} color={Colors.success} />
              <ThemedText style={styles.ticketSuccessTitle}>Message Sent!</ThemedText>
              <ThemedText style={styles.ticketSuccessText}>We&apos;ll respond within 24 hours.</ThemedText>
              <Pressable
                style={styles.ticketSuccessReset}
                onPress={() => setTicketSuccess(false)}
                accessibilityRole="button"
                accessibilityLabel="Submit another request"
              >
                <ThemedText style={styles.ticketSuccessResetText}>Submit Another Request</ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.ticketForm}>
              <TextInput
                style={styles.ticketInput}
                placeholder="Subject"
                placeholderTextColor={colors.text.tertiary}
                value={ticketSubject}
                onChangeText={setTicketSubject}
                returnKeyType="next"
                accessibilityLabel="Support ticket subject"
                accessibilityHint="Enter the subject of your support request"
              />
              <TextInput
                style={[styles.ticketInput, styles.ticketTextarea]}
                placeholder="Describe your issue..."
                placeholderTextColor={colors.text.tertiary}
                value={ticketMessage}
                onChangeText={(text) => setTicketMessage(text.slice(0, 500))}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                accessibilityLabel="Support ticket message"
                accessibilityHint="Describe your issue in detail, maximum 500 characters"
              />
              <ThemedText style={styles.charCount}>{ticketMessage.length}/500</ThemedText>
              <Pressable
                style={[styles.submitButton, ticketSubmitting && styles.submitButtonDisabled]}
                onPress={handleTicketSubmit}
                disabled={ticketSubmitting}
                accessibilityLabel="Submit support request"
                accessibilityRole="button"
                accessibilityState={{ disabled: ticketSubmitting }}
              >
                {ticketSubmitting ? (
                  <ActivityIndicator size="small" color={colors.text.inverse} />
                ) : (
                  <ThemedText style={styles.submitButtonText}>Submit Request</ThemedText>
                )}
              </Pressable>
            </View>
          )}
        </View>

        {/* Email Us */}
        <View style={styles.emailSection}>
          <ThemedText style={styles.emailLabel}>Or email us directly:</ThemedText>
          <Pressable
            onPress={handleEmailPress}
            accessibilityLabel="Email support at support@rez.money"
            accessibilityRole="link"
            accessibilityHint="Double tap to open your email app"
          >
            <ThemedText style={styles.emailLink}>support@rez.money</ThemedText>
          </Pressable>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 20 : 0,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    height: 48,
  },
  searchIcon: {
    marginRight: Spacing.md,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyLarge,
    color: colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: Spacing.base,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  quickAction: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  quickActionTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  quickActionDescription: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Help Categories
  helpCategories: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  helpCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.secondary,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  categoryText: {
    flex: 1,
  },
  categoryTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 2,
  },
  categoryCount: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
  },

  // FAQ List
  faqList: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.background.secondary,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
  },
  faqQuestion: {
    flex: 1,
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.secondary,
    marginRight: Spacing.md,
  },
  faqAnswer: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },
  faqAnswerText: {
    ...Typography.body,
    color: colors.text.tertiary,
    lineHeight: 20,
  },

  // No Results
  noResults: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  noResultsTitle: {
    ...Typography.h4,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  noResultsText: {
    ...Typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Support Ticket Form
  ticketForm: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: Spacing.md,
  },
  ticketInput: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: colors.text.secondary,
    backgroundColor: colors.background.secondary,
  },
  ticketTextarea: {
    minHeight: 120,
    paddingTop: Spacing.md,
  },
  charCount: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'right',
    marginTop: -Spacing.sm,
  },
  submitButton: {
    backgroundColor: Colors.brand.purpleLight,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.text.inverse,
    ...Typography.bodyLarge,
    fontWeight: '600' as const,
  },

  // Ticket Success
  ticketSuccess: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: Spacing.md,
  },
  ticketSuccessTitle: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  ticketSuccessText: {
    ...Typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  ticketSuccessReset: {
    marginTop: Spacing.sm,
  },
  ticketSuccessResetText: {
    ...Typography.body,
    color: Colors.brand.purpleLight,
    fontWeight: '600',
  },

  // Email Section
  emailSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  emailLabel: {
    ...Typography.body,
    color: colors.text.tertiary,
  },
  emailLink: {
    ...Typography.body,
    color: Colors.brand.purpleLight,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  bottomSpace: {
    height: 20,
  },
});
export default withErrorBoundary(HelpPage, 'HelpIndex');
