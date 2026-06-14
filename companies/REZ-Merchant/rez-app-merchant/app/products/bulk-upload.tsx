import React, { useState } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { platformAlertSimple } from '@/utils/platformAlert';

interface ParsedRow {
  name: string;
  price: number;
  category: string;
  description: string;
  error?: string;
}

interface ImportResult {
  imported: number;
  failed: number;
  errors: Array<{ index: number; name: string; reason: string }>;
}

const EXAMPLE_CSV = `name,price,category,description
Grilled Chicken Burger,199,Burgers,Juicy chicken with lettuce
Mango Lassi,89,Beverages,Fresh mango yoghurt drink
Paneer Tikka,249,Starters,`;

function parseCSV(raw: string): ParsedRow[] {
  const lines = raw
    .trim()
    .split('\n')
    .filter((l) => l.trim() !== '');
  if (lines.length === 0) return [];

  // Detect if first line is a header
  const firstLower = lines[0].toLowerCase();
  const hasHeader = firstLower.includes('name') && firstLower.includes('price');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const cols = line.split(',');
    const name = (cols[0] ?? '').trim();
    const priceRaw = (cols[1] ?? '').trim();
    const category = (cols[2] ?? '').trim();
    const description = (cols[3] ?? '').trim();

    const price = parseFloat(priceRaw);
    let error: string | undefined;
    if (!name) error = 'Name is required';
    else if (isNaN(price) || price <= 0) error = 'Price must be a number > 0';

    return { name, price: isNaN(price) ? 0 : price, category, description, error };
  });
}

export default function BulkUploadScreen() {
  const [csvText, setCsvText] = useState('');
  const [parsed, setParsed] = useState<ParsedRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const validRows = parsed ? parsed.filter((r) => !r.error) : [];
  const invalidRows = parsed ? parsed.filter((r) => r.error) : [];

  const handleParse = () => {
    if (!csvText.trim()) {
      platformAlertSimple('Empty', 'Paste CSV data first');
      return;
    }
    const rows = parseCSV(csvText);
    if (rows.length === 0) {
      platformAlertSimple('No Data', 'Could not parse unknown rows from the pasted text');
      return;
    }
    setParsed(rows);
    setResult(null);
  };

  const handleClear = () => {
    setCsvText('');
    setParsed(null);
    setResult(null);
  };

  const handleImport = async () => {
    if (validRows.length === 0) {
      platformAlertSimple('Nothing to Import', 'Fix validation errors before importing');
      return;
    }

    setImporting(true);
    setResult(null);
    try {
      const payload = validRows.map((r) => ({
        name: r.name,
        price: r.price,
        ...(r.category ? { category: r.category } : {}),
        ...(r.description ? { description: r.description } : {}),
      }));

      const res = await apiClient.post<unknown>('merchant/products/bulk-import', { products: payload });
      const d = res.data ?? res;

      const importResult: ImportResult = {
        imported: d.imported ?? 0,
        failed: d.failed ?? 0,
        errors: d.errors ?? [],
      };
      setResult(importResult);

      if (importResult.imported > 0) {
        platformAlertSimple(
          'Import Complete',
          `${importResult.imported} product${importResult.imported !== 1 ? 's' : ''} imported successfully.${importResult.failed > 0 ? ` ${importResult.failed} failed.` : ''}`
        );
        if (importResult.failed === 0) {
          setCsvText('');
          setParsed(null);
        }
      } else {
        platformAlertSimple('Import Failed', 'No products were imported. Check errors below.');
      }
    } catch (err) {
      logger.error('BulkUpload import error:', err);
      platformAlertSimple('Error', err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          Bulk Product Upload
        </ThemedText>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.light.info} />
            <ThemedText style={styles.infoText}>
              Paste CSV data with columns: name, price, category, description
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.exampleBtn}
            onPress={() => {
              setCsvText(EXAMPLE_CSV);
              setParsed(null);
              setResult(null);
            }}
          >
            <Ionicons name="copy-outline" size={16} color={Colors.light.primary} />
            <ThemedText style={styles.exampleBtnText}>Load example CSV</ThemedText>
          </TouchableOpacity>
        </View>

        {/* CSV Input */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Paste CSV Data</ThemedText>
          <TextInput
            style={styles.textArea}
            value={csvText}
            onChangeText={(t) => {
              setCsvText(t);
              setParsed(null);
              setResult(null);
            }}
            multiline
            numberOfLines={8}
            placeholder={'name,price,category,description\nProduct A,99,Food,Description here'}
            placeholderTextColor={Colors.light.textSecondary}
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.inputActions}>
            <TouchableOpacity
              style={styles.parseBtn}
              onPress={handleParse}
              disabled={!csvText.trim()}
            >
              <Ionicons name="list-outline" size={16} color="#fff" />
              <ThemedText style={styles.parseBtnText}>Parse & Preview</ThemedText>
            </TouchableOpacity>
            {csvText.trim() !== '' && (
              <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                <Ionicons name="close-outline" size={18} color={Colors.light.destructive} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Preview Table */}
        {parsed !== null && (
          <View style={styles.section}>
            <View style={styles.previewHeader}>
              <ThemedText style={styles.sectionTitle}>
                Preview ({parsed.length} row{parsed.length !== 1 ? 's' : ''})
              </ThemedText>
              <View style={styles.previewBadges}>
                {validRows.length > 0 && (
                  <View style={[styles.badge, { backgroundColor: '#E8F5E9' }]}>
                    <ThemedText style={[styles.badgeText, { color: '#2E7D32' }]}>
                      {validRows.length} valid
                    </ThemedText>
                  </View>
                )}
                {invalidRows.length > 0 && (
                  <View style={[styles.badge, { backgroundColor: '#FEECEC' }]}>
                    <ThemedText style={[styles.badgeText, { color: Colors.light.destructive }]}>
                      {invalidRows.length} error
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>

            {/* Column headers */}
            <View style={styles.tableHead}>
              <ThemedText style={[styles.th, { flex: 2 }]}>Name</ThemedText>
              <ThemedText style={[styles.th, { width: 60 }]}>Price</ThemedText>
              <ThemedText style={[styles.th, { flex: 1 }]}>Category</ThemedText>
              <ThemedText style={[styles.th, { width: 80 }]}>Status</ThemedText>
            </View>

            {parsed.map((row, idx) => (
              <View
                key={idx}
                style={[styles.tableRow, row.error ? styles.tableRowError : styles.tableRowOk]}
              >
                <ThemedText style={[styles.td, { flex: 2 }]} numberOfLines={1}>
                  {row.name || '(empty)'}
                </ThemedText>
                <ThemedText style={[styles.td, { width: 60 }]}>
                  {row.price > 0 ? row.price : '—'}
                </ThemedText>
                <ThemedText style={[styles.td, { flex: 1 }]} numberOfLines={1}>
                  {row.category || '—'}
                </ThemedText>
                <View style={{ width: 80, alignItems: 'center' }}>
                  {row.error ? (
                    <View style={styles.errorPill}>
                      <ThemedText style={styles.errorPillText} numberOfLines={1}>
                        {row.error}
                      </ThemedText>
                    </View>
                  ) : (
                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                  )}
                </View>
              </View>
            ))}

            {/* Import Button */}
            {validRows.length > 0 && (
              <TouchableOpacity
                style={[styles.importBtn, importing && styles.importBtnDisabled]}
                onPress={handleImport}
                disabled={importing}
              >
                {importing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                )}
                <ThemedText style={styles.importBtnText}>
                  {importing
                    ? 'Importing...'
                    : `Import ${validRows.length} Product${validRows.length !== 1 ? 's' : ''}`}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Import Result */}
        {result !== null && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Import Result</ThemedText>
            <View style={styles.resultRow}>
              <View style={[styles.resultCard, { borderColor: '#4CAF50' }]}>
                <ThemedText style={[styles.resultNum, { color: '#2E7D32' }]}>
                  {result.imported}
                </ThemedText>
                <ThemedText style={styles.resultLabel}>Imported</ThemedText>
              </View>
              <View style={[styles.resultCard, { borderColor: Colors.light.destructive }]}>
                <ThemedText style={[styles.resultNum, { color: Colors.light.destructive }]}>
                  {result.failed}
                </ThemedText>
                <ThemedText style={styles.resultLabel}>Failed</ThemedText>
              </View>
            </View>
            {result.errors.length > 0 && (
              <View style={styles.resultErrors}>
                <ThemedText style={styles.resultErrorsTitle}>
                  Errors ({result.errors.length})
                </ThemedText>
                {result.errors.map((e, i) => (
                  <View key={i} style={styles.resultErrorItem}>
                    <Ionicons name="warning-outline" size={14} color={Colors.light.destructive} />
                    <ThemedText style={styles.resultErrorText}>
                      Row {e.index + 1} &quot;{e.name}&quot;: {e.reason}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '600', color: Colors.light.text },
  scroll: { flex: 1 },
  section: {
    backgroundColor: Colors.light.background,
    marginBottom: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  exampleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  exampleBtnText: { fontSize: 13, color: Colors.light.primary, fontWeight: '500' },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundSecondary,
    minHeight: 130,
    fontFamily: 'monospace',
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  parseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingVertical: 11,
    borderRadius: 8,
  },
  parseBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  clearBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  // Preview table
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  previewBadges: { flexDirection: 'row', gap: 6 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  tableHead: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  th: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tableRowOk: { backgroundColor: 'transparent' },
  tableRowError: { backgroundColor: '#FEF2F2' },
  td: { fontSize: 13, color: Colors.light.text },
  errorPill: {
    backgroundColor: '#FEECEC',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  errorPillText: { fontSize: 9, color: Colors.light.destructive, fontWeight: '500' },
  importBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2E7D32',
    paddingVertical: 13,
    borderRadius: 8,
  },
  importBtnDisabled: { opacity: 0.6 },
  importBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  // Result
  resultRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  resultCard: {
    flex: 1,
    padding: 14,
    borderWidth: 2,
    borderRadius: 10,
    alignItems: 'center',
    gap: 4,
  },
  resultNum: { fontSize: 28, fontWeight: '700' },
  resultLabel: { fontSize: 12, color: Colors.light.textSecondary },
  resultErrors: { gap: 6 },
  resultErrorsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 6,
  },
  resultErrorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
  },
  resultErrorText: { flex: 1, fontSize: 12, color: Colors.light.text, lineHeight: 16 },
});
