/**
 * MerchantPromotionToolkit
 * Phase 3.2 — Merchant-Driven Growth
 *
 * Lets the merchant generate shareable/printable promotional assets:
 * - QR poster (merchant's REZ QR code with branding)
 * - Table tent card template
 * - "Scan to save" sticker design
 *
 * Each template renders as a View that can be captured via ViewShot
 * and shared/saved with expo-sharing.
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

import { ThemedText } from '@/components/ThemedText';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { BRAND } from '@/constants/brand';
import { platformAlertSimple } from '@/utils/platformAlert';

const { width: SW } = Dimensions.get('window');

type TemplateId = 'qr_poster' | 'table_tent' | 'sticker';

interface Template {
  id: TemplateId;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  gradient: [string, string];
}

const TEMPLATES: Template[] = [
  {
    id: 'qr_poster',
    title: 'QR Poster',
    subtitle: 'A4 printable poster with your QR code',
    icon: 'qr-code',
    color: '#7c3aed',
    gradient: ['#7c3aed', '#a78bfa'],
  },
  {
    id: 'table_tent',
    title: 'Table Tent',
    subtitle: 'Folded card for countertops',
    icon: 'card',
    color: '#0ea5e9',
    gradient: ['#0284c7', '#38bdf8'],
  },
  {
    id: 'sticker',
    title: 'Scan & Save Sticker',
    subtitle: 'Circular sticker for doors & menus',
    icon: 'albums',
    color: '#10b981',
    gradient: ['#059669', '#34d399'],
  },
];

// ---------------------------------------------------------------------------
// Template Renderers
// ---------------------------------------------------------------------------
function QRPosterPreview({ storeName, qrValue }: { storeName: string; qrValue: string }) {
  return (
    <View style={previewStyles.posterContainer}>
      <LinearGradient colors={['#7c3aed', '#4c1d95']} style={previewStyles.posterHeader}>
        <Text style={previewStyles.posterBrand}>{BRAND.APP_NAME}</Text>
        <Text style={previewStyles.posterTagline}>Save on every spend</Text>
      </LinearGradient>
      <View style={previewStyles.posterBody}>
        <Text style={previewStyles.posterStoreName}>{storeName}</Text>
        <Text style={previewStyles.posterInstruction}>Scan to earn cashback on your purchase</Text>
        <View style={previewStyles.posterQR}>
          <QRCode value={qrValue} size={120} />
        </View>
        <View style={previewStyles.posterSteps}>
          {['Scan QR', 'Earn Coins', 'Save More'].map((step, i) => (
            <View key={step} style={previewStyles.posterStep}>
              <View style={previewStyles.posterStepNum}>
                <Text style={previewStyles.posterStepNumText}>{i + 1}</Text>
              </View>
              <Text style={previewStyles.posterStepText}>{step}</Text>
            </View>
          ))}
        </View>
        <Text style={previewStyles.posterFooter}>rezpay.in • Download the REZ app</Text>
      </View>
    </View>
  );
}

function TableTentPreview({ storeName, qrValue }: { storeName: string; qrValue: string }) {
  return (
    <View style={previewStyles.tentContainer}>
      {/* Front panel */}
      <LinearGradient colors={['#0284c7', '#38bdf8']} style={previewStyles.tentFront}>
        <Text style={previewStyles.tentEmoji}>💰</Text>
        <Text style={previewStyles.tentHeading}>Earn cashback here!</Text>
        <Text style={previewStyles.tentSub}>Pay with {BRAND.APP_NAME} and save on every visit</Text>
      </LinearGradient>
      {/* Back panel */}
      <View style={previewStyles.tentBack}>
        <Text style={previewStyles.tentStoreName}>{storeName}</Text>
        <View style={previewStyles.tentQR}>
          <QRCode value={qrValue} size={90} />
        </View>
        <Text style={previewStyles.tentScanText}>Scan to earn REZ coins</Text>
        <Text style={previewStyles.tentFooter}>rezpay.in</Text>
      </View>
    </View>
  );
}

function StickerPreview({ storeName, qrValue }: { storeName: string; qrValue: string }) {
  return (
    <View style={previewStyles.stickerOuter}>
      <LinearGradient colors={['#059669', '#34d399']} style={previewStyles.stickerCircle}>
        <Text style={previewStyles.stickerBrand}>{BRAND.APP_NAME}</Text>
        <View style={previewStyles.stickerQR}>
          <QRCode value={qrValue} size={80} color="#1e293b" backgroundColor="#fff" />
        </View>
        <Text style={previewStyles.stickerCta}>SCAN TO SAVE</Text>
        <Text style={previewStyles.stickerStoreName} numberOfLines={1}>
          {storeName}
        </Text>
      </LinearGradient>
    </View>
  );
}

const previewStyles = StyleSheet.create({
  // QR Poster
  posterContainer: {
    width: SW - 80,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  posterHeader: { paddingVertical: 16, alignItems: 'center' },
  posterBrand: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  posterTagline: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  posterBody: { backgroundColor: '#fff', padding: 20, alignItems: 'center' },
  posterStoreName: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  posterInstruction: { fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 16 },
  posterQR: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  posterSteps: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  posterStep: { alignItems: 'center', flex: 1 },
  posterStepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  posterStepNumText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  posterStepText: { fontSize: 12, color: '#475569', textAlign: 'center' },
  posterFooter: { fontSize: 11, color: '#94a3b8' },

  // Table Tent
  tentContainer: { width: SW - 80, borderRadius: 12, overflow: 'hidden' },
  tentFront: { paddingVertical: 20, paddingHorizontal: 24, alignItems: 'center' },
  tentEmoji: { fontSize: 36, marginBottom: 8 },
  tentHeading: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  tentSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  tentBack: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#e2e8f0',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  tentStoreName: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  tentQR: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 },
  tentScanText: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  tentFooter: { fontSize: 11, color: '#94a3b8' },

  // Sticker
  stickerOuter: { alignItems: 'center' },
  stickerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  stickerBrand: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6,
  },
  stickerQR: {
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 8,
    marginBottom: 6,
  },
  stickerCta: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 2 },
  stickerStoreName: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginTop: 2,
    maxWidth: 140,
    textAlign: 'center',
  },
});

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function MerchantPromotionToolkit() {
  const { activeStore } = useStore();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('qr_poster');
  const [generating, setGenerating] = useState(false);
  const previewRef = useRef<View>(null);

  const storeName = activeStore?.name ?? 'Your Store';
  const storeId = activeStore?._id ?? 'store';
  const qrValue = `https://app.rezpay.in/store/${storeId}`;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Attempt ViewShot capture; gracefully falls back to share text
      let imageUri: string | null = null;
      try {
        const ViewShot = require('react-native-view-shot');
        if (previewRef.current) {
          imageUri = await ViewShot.captureRef(previewRef.current, {
            format: 'png',
            quality: 0.95,
          });
        }
      } catch {
        // ViewShot not available or capture failed — use text fallback
      }

      if (imageUri) {
        await Share.share({
          url: imageUri,
          message: `${storeName} is on ${BRAND.APP_NAME}! Scan to earn cashback. ${qrValue}`,
        });
      } else {
        // Text fallback
        await Share.share({
          message:
            `${storeName} now accepts ${BRAND.APP_NAME}!\n` +
            `Scan our QR code to earn cashback on every visit.\n` +
            `${qrValue}`,
        });
      }
    } catch (err) {
      if (err?.message !== 'User did not share') {
        platformAlertSimple('Error', 'Could not generate image');
      }
    } finally {
      setGenerating(false);
    }
  };

  const activeTemplate = TEMPLATES.find((t) => t.id === selectedTemplate)!;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={activeTemplate.gradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(dashboard)'))}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Promotion Toolkit</ThemedText>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Template selector tabs */}
        <View style={styles.templateTabs}>
          {TEMPLATES.map((tmpl) => (
            <TouchableOpacity
              key={tmpl.id}
              style={[styles.templateTab, selectedTemplate === tmpl.id && styles.templateTabActive]}
              onPress={() => setSelectedTemplate(tmpl.id)}
              accessibilityLabel={`Select ${tmpl.title} template`}
            >
              <Ionicons
                name={tmpl.icon as unknown as keyof typeof Ionicons.glyphMap}
                size={18}
                color={selectedTemplate === tmpl.id ? tmpl.color : Colors.light.textMuted}
              />
              <ThemedText
                style={[
                  styles.templateTabText,
                  selectedTemplate === tmpl.id && { color: tmpl.color },
                ]}
              >
                {tmpl.title}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <ThemedText style={styles.templateSubtitle}>{activeTemplate.subtitle}</ThemedText>

        {/* Preview */}
        <View style={styles.previewContainer} ref={previewRef} collapsable={false}>
          {selectedTemplate === 'qr_poster' && (
            <QRPosterPreview storeName={storeName} qrValue={qrValue} />
          )}
          {selectedTemplate === 'table_tent' && (
            <TableTentPreview storeName={storeName} qrValue={qrValue} />
          )}
          {selectedTemplate === 'sticker' && (
            <StickerPreview storeName={storeName} qrValue={qrValue} />
          )}
        </View>

        {/* Generate / Share CTA */}
        <TouchableOpacity
          style={[styles.generateBtn, { opacity: generating ? 0.7 : 1 }]}
          onPress={handleGenerate}
          disabled={generating}
          accessibilityLabel="Generate and share promotional material"
        >
          <LinearGradient
            colors={activeTemplate.gradient}
            style={styles.generateGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {generating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="share" size={22} color="#fff" />
            )}
            <Text style={styles.generateText}>
              {generating ? 'Generating...' : 'Share / Download'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Tips */}
        <View style={styles.tipsBox}>
          <ThemedText style={styles.tipsTitle}>Tips for more customers</ThemedText>
          {[
            'Place the QR poster near your entrance or counter',
            'Use table tents to remind seated customers',
            'Add the sticker to your menu or window',
            'Mention REZ cashback when customers pay',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color="#7c3aed" />
              <ThemedText style={styles.tipText}>{tip}</ThemedText>
            </View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: { padding: 16, alignItems: 'center' },

  templateTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    padding: 4,
    gap: 4,
    marginBottom: 8,
    alignSelf: 'stretch',
  },
  templateTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  templateTabActive: {
    backgroundColor: '#f3e8ff',
  },
  templateTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textMuted,
  },
  templateSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  previewContainer: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'stretch',
  },

  generateBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  generateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  generateText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  tipsBox: {
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    padding: 16,
    alignSelf: 'stretch',
    gap: 10,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tipText: { flex: 1, fontSize: 13, color: Colors.light.textSecondary, lineHeight: 18 },
});
