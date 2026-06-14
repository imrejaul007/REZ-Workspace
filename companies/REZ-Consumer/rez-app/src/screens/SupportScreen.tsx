/**
 * REZ Care - Support Screen
 *
 * Main support hub for the REZ Consumer App.
 * Integrates with REZ Care service for all support needs.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { rezCareClient, Ticket, FAQ } from '../services/support/rezCareClient';
import { logger } from '@/utils/logger';

interface SupportScreenProps {
  userId: string;
  onClose?: () => void;
}

type TabType = 'home' | 'tickets' | 'chat' | 'faq';

const SupportScreen: React.FC<SupportScreenProps> = ({ userId, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSelfService, setShowSelfService] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [userId]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, faqsRes] = await Promise.all([
        rezCareClient.getTickets(userId, { limit: 10 }),
        rezCareClient.getFAQs(),
      ]);
      setTickets(ticketsRes.tickets);
      setFaqs(faqsRes);
    } catch (error) {
      logger.error('[Support] Load failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(() => {
    loadInitialData();
  }, [userId]);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Help & Support</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for help..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => searchHelp()}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction} onPress={() => setShowSelfService(true)}>
          <Text style={styles.quickActionIcon}>💬</Text>
          <Text style={styles.quickActionText}>Chat with Us</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => setActiveTab('tickets')}>
          <Text style={styles.quickActionIcon}>📋</Text>
          <Text style={styles.quickActionText}>My Tickets</Text>
          {tickets.filter(t => t.status !== 'resolved').length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {tickets.filter(t => t.status !== 'resolved').length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => setActiveTab('faq')}>
          <Text style={styles.quickActionIcon}>❓</Text>
          <Text style={styles.quickActionText}>FAQ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHomeTab = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} />}
    >
      {/* Open Tickets Alert */}
      {tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length > 0 && (
        <TouchableOpacity
          style={styles.alertCard}
          onPress={() => setActiveTab('tickets')}
        >
          <View style={styles.alertIcon}>
            <Text>📋</Text>
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>
              {tickets.filter(t => t.status !== 'resolved').length} Open Ticket(s)
            </Text>
            <Text style={styles.alertSubtitle}>Tap to view your support tickets</Text>
          </View>
          <Text style={styles.alertArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* Category Grid */}
      <Text style={styles.sectionTitle}>How can we help?</Text>
      <View style={styles.categoryGrid}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.categoryCard}
            onPress={() => handleCategoryPress(cat.id)}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={styles.categoryLabel}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Popular Articles */}
      <Text style={styles.sectionTitle}>Popular Articles</Text>
      {faqs.slice(0, 5).map((faq) => (
        <TouchableOpacity key={faq.id} style={styles.articleItem}>
          <Text style={styles.articleIcon}>📄</Text>
          <View style={styles.articleContent}>
            <Text style={styles.articleQuestion}>{faq.question}</Text>
            <Text style={styles.articleCategory}>{faq.category}</Text>
          </View>
          <Text style={styles.articleArrow}>›</Text>
        </TouchableOpacity>
      ))}

      {/* Contact Options */}
      <Text style={styles.sectionTitle}>Other Ways to Reach Us</Text>
      <View style={styles.contactOptions}>
        <TouchableOpacity style={styles.contactCard}>
          <Text style={styles.contactIcon}>📧</Text>
          <Text style={styles.contactLabel}>Email</Text>
          <Text style={styles.contactValue}>support@rez.money</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactCard}>
          <Text style={styles.contactIcon}>💬</Text>
          <Text style={styles.contactLabel}>WhatsApp</Text>
          <Text style={styles.contactValue}>+91 98765 43210</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderTicketsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>My Tickets</Text>
        <TouchableOpacity
          style={styles.newTicketButton}
          onPress={() => setShowSelfService(true)}
        >
          <Text style={styles.newTicketButtonText}>+ New Ticket</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : tickets.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No tickets yet</Text>
          <Text style={styles.emptySubtitle}>
            Create a ticket if you need help with anything
          </Text>
          <TouchableOpacity
            style={styles.createTicketButton}
            onPress={() => setShowSelfService(true)}
          >
            <Text style={styles.createTicketButtonText}>Create Ticket</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.ticketId}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <View style={[styles.ticketStatus, getStatusStyle(item.status)]}>
                  <Text style={styles.ticketStatusText}>{item.status}</Text>
                </View>
                <Text style={styles.ticketId}>{item.ticketId}</Text>
              </View>
              <Text style={styles.ticketSubject}>{item.subject}</Text>
              <View style={styles.ticketFooter}>
                <Text style={styles.ticketCategory}>{item.category}</Text>
                <Text style={styles.ticketDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              {item.csatRating && (
                <View style={styles.csatBadge}>
                  <Text>⭐ {item.csatRating}/5</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

  const renderFAQTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search FAQs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={faqs.filter(f =>
          !searchQuery ||
          f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.faqItem}
            onPress={() => showFAQDetail(item)}
          >
            <View style={styles.faqContent}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Text style={styles.faqCategory}>{item.category}</Text>
            </View>
            <Text style={styles.faqArrow}>›</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>❓</Text>
            <Text style={styles.emptyTitle}>No FAQs found</Text>
          </View>
        }
      />
    </View>
  );

  const renderTabNav = () => (
    <View style={styles.tabNav}>
      {[
        { id: 'home', icon: '🏠', label: 'Home' },
        { id: 'tickets', icon: '📋', label: 'Tickets' },
        { id: 'faq', icon: '❓', label: 'FAQ' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.activeTab]}
          onPress={() => setActiveTab(tab.id as TabType)}
        >
          <Text style={styles.tabIcon}>{tab.icon}</Text>
          <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const searchHelp = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const articles = await rezCareClient.searchKB(searchQuery);
      if (articles.length > 0) {
        Alert.alert('Search Results', `Found ${articles.length} articles`);
      } else {
        setShowSelfService(true);
      }
    } catch (error) {
      setShowSelfService(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    setShowSelfService(true);
  };

  const showFAQDetail = (faq: FAQ) => {
    Alert.alert(faq.question, faq.answer, [
      { text: 'Helpful! 👍', onPress: () => {} },
      { text: 'Not Helpful 👎', onPress: () => {} },
      { text: 'Close', style: 'cancel' },
    ]);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'open': return styles.statusOpen;
      case 'assigned':
      case 'in_progress': return styles.statusInProgress;
      case 'resolved':
      case 'closed': return styles.statusResolved;
      default: return {};
    }
  };

  return (
    <View style={styles.container}>
      {renderHeader()}

      {activeTab === 'home' && renderHomeTab()}
      {activeTab === 'tickets' && renderTicketsTab()}
      {activeTab === 'faq' && renderFAQTab()}

      {renderTabNav()}

      {/* Self Service Modal */}
      <SelfServiceModal
        visible={showSelfService}
        onClose={() => setShowSelfService(false)}
        userId={userId}
        onTicketCreated={() => {
          setShowSelfService(false);
          setActiveTab('tickets');
          loadInitialData();
        }}
      />
    </View>
  );
};

// ============================================
// Self Service Modal
// ============================================

const SelfServiceModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  userId: string;
  onTicketCreated: (ticketId: string) => void;
}> = ({ visible, onClose, userId, onTicketCreated }) => {
  const [step, setStep] = useState<'category' | 'form' | 'success'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: 'order', label: 'Order Issue', icon: '📦', description: 'Problems with your order' },
    { id: 'payment', label: 'Payment', icon: '💳', description: 'Payment related issues' },
    { id: 'delivery', label: 'Delivery', icon: '🚚', description: 'Delivery problems' },
    { id: 'refund', label: 'Refund', icon: '💰', description: 'Request a refund' },
    { id: 'account', label: 'Account', icon: '👤', description: 'Account related issues' },
    { id: 'other', label: 'Other', icon: '❓', description: 'Other inquiries' },
  ];

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setStep('form');
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Required', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const ticket = await rezCareClient.createTicket({
        userId,
        category: selectedCategory,
        subject: subject.substring(0, 100),
        message,
        priority: 'medium',
      });
      setStep('success');
      onTicketCreated(ticket.ticketId);
    } catch (error) {
      Alert.alert('Error', 'Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('category');
    setSelectedCategory('');
    setSubject('');
    setMessage('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {step === 'category' && 'Select Category'}
            {step === 'form' && 'Describe Your Issue'}
            {step === 'success' && 'Ticket Created!'}
          </Text>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>

        {step === 'category' && (
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                onPress={() => handleCategorySelect(cat.id)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
                <Text style={styles.categoryDesc}>{cat.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 'form' && (
          <ScrollView style={styles.formContainer}>
            <Text style={styles.formLabel}>Subject</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Brief description of your issue"
              value={subject}
              onChangeText={setSubject}
              maxLength={100}
            />

            <Text style={styles.formLabel}>Details</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              placeholder="Please describe your issue in detail..."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Ticket</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}

        {step === 'success' && (
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>🎉</Text>
            <Text style={styles.successTitle}>Ticket Created!</Text>
            <Text style={styles.successSubtitle}>
              Our support team will respond within 24 hours.
            </Text>
            <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const categories = [
  { id: 'order', label: 'Order Issue', icon: '📦' },
  { id: 'payment', label: 'Payment', icon: '💳' },
  { id: 'delivery', label: 'Delivery', icon: '🚚' },
  { id: 'refund', label: 'Refund', icon: '💰' },
  { id: 'account', label: 'Account', icon: '👤' },
  { id: 'other', label: 'Other', icon: '❓' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  header: { backgroundColor: '#fff', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  closeButton: { padding: 8 },
  closeButtonText: { fontSize: 20, color: '#666' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 12, paddingHorizontal: 12, marginBottom: 16 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around' },
  quickAction: { alignItems: 'center', padding: 12, position: 'relative' },
  quickActionIcon: { fontSize: 24, marginBottom: 4 },
  quickActionText: { fontSize: 12, color: '#333' },
  badge: { position: 'absolute', top: 4, right: 4, backgroundColor: '#ff3b30', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  tabContent: { flex: 1 },
  tabNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e5ea', paddingBottom: 30 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#007AFF' },
  tabIcon: { fontSize: 20, marginBottom: 4 },
  tabLabel: { fontSize: 11, color: '#666' },
  activeTabLabel: { color: '#007AFF', fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginHorizontal: 16, marginTop: 24, marginBottom: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  categoryCard: { width: '30%', margin: '1.5%', backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  categoryIcon: { fontSize: 28, marginBottom: 8 },
  categoryLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  categoryDesc: { fontSize: 10, color: '#666', textAlign: 'center', marginTop: 4 },
  articleItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12 },
  articleIcon: { fontSize: 20, marginRight: 12 },
  articleContent: { flex: 1 },
  articleQuestion: { fontSize: 15, fontWeight: '500' },
  articleCategory: { fontSize: 12, color: '#666', marginTop: 2 },
  articleArrow: { fontSize: 20, color: '#ccc' },
  alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff3cd', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#ffc107' },
  alertIcon: { fontSize: 24, marginRight: 12 },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 15, fontWeight: '600' },
  alertSubtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  alertArrow: { fontSize: 24, color: '#ffc107' },
  contactOptions: { flexDirection: 'row', marginHorizontal: 16 },
  contactCard: { flex: 1, backgroundColor: '#fff', marginHorizontal: 4, padding: 16, borderRadius: 12, alignItems: 'center' },
  contactIcon: { fontSize: 24, marginBottom: 8 },
  contactLabel: { fontSize: 13, fontWeight: '600' },
  contactValue: { fontSize: 11, color: '#666', marginTop: 2 },
  tabHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  tabTitle: { fontSize: 20, fontWeight: 'bold' },
  newTicketButton: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  newTicketButtonText: { color: '#fff', fontWeight: '600' },
  ticketCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ticketStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusOpen: { backgroundColor: '#ff3b30' },
  statusInProgress: { backgroundColor: '#007AFF' },
  statusResolved: { backgroundColor: '#34c759' },
  ticketStatusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  ticketId: { fontSize: 11, color: '#999' },
  ticketSubject: { fontSize: 15, fontWeight: '500', marginBottom: 8 },
  ticketFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  ticketCategory: { fontSize: 12, color: '#666' },
  ticketDate: { fontSize: 12, color: '#999' },
  csatBadge: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 24 },
  createTicketButton: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  createTicketButtonText: { color: '#fff', fontWeight: '600' },
  loader: { marginTop: 40 },
  faqItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12 },
  faqContent: { flex: 1 },
  faqQuestion: { fontSize: 15, fontWeight: '500' },
  faqCategory: { fontSize: 12, color: '#007AFF', marginTop: 4 },
  faqArrow: { fontSize: 20, color: '#ccc' },
  modalContainer: { flex: 1, backgroundColor: '#f5f5f7' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e5ea', paddingTop: 60 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalClose: { fontSize: 24, color: '#666' },
  formContainer: { padding: 16 },
  formLabel: { fontSize: 15, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  formInput: { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#e5e5ea' },
  formTextArea: { minHeight: 120 },
  submitButton: { backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  submitButtonDisabled: { backgroundColor: '#ccc' },
  submitButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successIcon: { fontSize: 80, marginBottom: 24 },
  successTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  successSubtitle: { fontSize: 17, color: '#666', textAlign: 'center', marginBottom: 32 },
  doneButton: { backgroundColor: '#007AFF', paddingHorizontal: 48, paddingVertical: 16, borderRadius: 12 },
  doneButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});

export default SupportScreen;
