import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '@/services/api/client';
import { showAlert } from '@/utils/alert';
import { Colors } from '@/constants/Colors';

const MAX_BODY_CHARS = 160;

const SAMPLE_VARS: Record<string, string> = {
  '{name}': 'Priya',
  '{coins}': '250',
  '{store}': 'Your Store',
  '{offer}': '20% OFF',
};

const VARIABLE_HINTS = ['{name}', '{coins}', '{store}', '{offer}'];

interface Template {
  _id: string;
  title: string;
  body: string;
  variables: string[];
  createdAt: string;
}

function renderPreview(body: string): string {
  let preview = body;
  for (const [key, val] of Object.entries(SAMPLE_VARS)) {
    preview = preview.split(key).join(val);
  }
  return preview;
}

interface TemplateCardProps {
  template: Template;
  onDelete: (id: string) => void;
  onUse: (id: string) => void;
}

function TemplateCard({ template, onDelete, onUse }: TemplateCardProps) {
  const preview = renderPreview(template.body);
  const date = new Date(template.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handleDelete = () => {
    Alert.alert('Delete Template', `Delete "${template.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(template._id) },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{template.title}</Text>
          <Text style={styles.cardDate}>{date}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.useBtn}
            onPress={() => onUse(template._id)}
            activeOpacity={0.8}
          >
            <Ionicons name="send-outline" size={14} color="#7C3AED" />
            <Text style={styles.useBtnText}>Use Template</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.previewBox}>
        <Text style={styles.previewLabel}>Preview</Text>
        <Text style={styles.previewText}>{preview}</Text>
      </View>

      {template.variables.length > 0 && (
        <View style={styles.varsRow}>
          {template.variables.map((v) => (
            <View key={v} style={styles.varChip}>
              <Text style={styles.varChipText}>{v}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function TemplatesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // New template form
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');

  const fetchTemplates = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const res = await apiClient.get<Template[]>('/api/merchant/marketing/templates');
      setTemplates(res.data ?? []);
    } catch {
      // silent on pull-to-refresh; initial failure shown via empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const detectedVariables = (body: string): string[] => {
    const found: string[] = [];
    for (const v of VARIABLE_HINTS) {
      if (body.includes(v)) found.push(v);
    }
    return found;
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      showAlert('Validation', 'Please enter a template title.');
      return;
    }
    if (!formBody.trim()) {
      showAlert('Validation', 'Please enter a message body.');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/merchant/marketing/templates', {
        title: formTitle.trim(),
        body: formBody.trim(),
      });
      setFormTitle('');
      setFormBody('');
      setShowForm(false);
      await fetchTemplates();
    } catch {
      showAlert('Error', 'Could not save template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/api/merchant/marketing/templates/${id}`);
      setTemplates((prev) => prev.filter((t) => t._id !== id));
    } catch {
      showAlert('Error', 'Could not delete template. Please try again.');
    }
  };

  const handleUse = (templateId: string) => {
    router.push(`/(dashboard)/broadcast?templateId=${templateId}`);
  };

  const insertVar = (v: string) => {
    setFormBody((prev) => prev + v);
  };

  const charCount = formBody.length;
  const charOver = charCount > MAX_BODY_CHARS;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1a3a52', '#2d5a7b']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Message Templates</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => setShowForm((v) => !v)}
          activeOpacity={0.8}
        >
          <Ionicons name={showForm ? 'close' : 'add'} size={20} color="#fff" />
          <Text style={styles.newBtnText}>{showForm ? 'Cancel' : 'New'}</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchTemplates(true)} />
        }
      >
        {/* New Template Form */}
        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formSectionTitle}>New Template</Text>

            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Welcome Offer"
              value={formTitle}
              onChangeText={setFormTitle}
              placeholderTextColor={Colors.light.textMuted}
            />

            <Text style={styles.fieldLabel}>Message Body</Text>
            <View style={styles.varHints}>
              {VARIABLE_HINTS.map((v) => (
                <TouchableOpacity key={v} style={styles.varHintChip} onPress={() => insertVar(v)}>
                  <Text style={styles.varHintText}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.textarea, charOver && styles.textareaOver]}
              placeholder="Hi {name}, visit us at {store} and earn {coins} coins..."
              value={formBody}
              onChangeText={setFormBody}
              placeholderTextColor={Colors.light.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={320}
            />
            <View style={styles.charCountRow}>
              <Text style={[styles.charCount, charOver && styles.charCountOver]}>
                {charCount}/{MAX_BODY_CHARS}
                {charOver ? '  (exceeds SMS limit)' : ''}
              </Text>
            </View>

            {/* Live preview */}
            {formBody.trim() ? (
              <View style={styles.livePreviewBox}>
                <Text style={styles.previewLabel}>Live Preview</Text>
                <Text style={styles.livePreviewText}>{renderPreview(formBody)}</Text>
                {detectedVariables(formBody).length > 0 && (
                  <View style={styles.varsRow}>
                    {detectedVariables(formBody).map((v) => (
                      <View key={v} style={styles.varChip}>
                        <Text style={styles.varChipText}>{v}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>Save Template</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Templates list */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2d5a7b" />
          </View>
        ) : templates.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={Colors.light.textMuted} />
            <Text style={styles.emptyText}>No templates yet</Text>
            <Text style={styles.emptySubtext}>Tap "New" to create your first message template</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {templates.map((t) => (
              <TemplateCard key={t._id} template={t} onDelete={handleDelete} onUse={handleUse} />
            ))}
          </View>
        )}
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
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight ?? 40) + 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  newBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  center: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.light.textMuted,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  listContainer: {
    gap: 12,
  },

  // Form
  formCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 10,
  },
  formSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.textHeading,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  varHints: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  varHintChip: {
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  varHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
  textarea: {
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.textHeading,
    borderWidth: 1,
    borderColor: Colors.light.border,
    minHeight: 100,
  },
  textareaOver: {
    borderColor: '#EF4444',
  },
  charCountRow: {
    alignItems: 'flex-end',
  },
  charCount: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  charCountOver: {
    color: '#EF4444',
    fontWeight: '600',
  },
  livePreviewBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 4,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // Template card
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 10,
  },
  cardHeader: {
    gap: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.textHeading,
    flex: 1,
  },
  cardDate: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  useBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  useBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  previewBox: {
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewText: {
    fontSize: 13,
    color: Colors.light.textHeading,
    lineHeight: 19,
  },
  livePreviewText: {
    fontSize: 13,
    color: '#166534',
    lineHeight: 19,
  },
  varsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  varChip: {
    backgroundColor: '#EDE9FE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  varChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },
});
