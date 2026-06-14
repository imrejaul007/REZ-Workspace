import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { languages, Language } from '../i18n';

interface LanguageSelectorProps {
  currentLocale: Language;
  onLocaleChange: (locale: Language) => void;
}

export function LanguageSelector({
  currentLocale,
  onLocaleChange,
}: LanguageSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const currentLanguage = languages.find((l) => l.code === currentLocale);

  const handleSelect = (code: Language) => {
    onLocaleChange(code);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.selectorText}>
          {currentLanguage?.name || 'English'}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Language</Text>
            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    item.code === currentLocale && styles.languageItemSelected,
                  ]}
                  onPress={() => handleSelect(item.code as Language)}
                >
                  <Text
                    style={[
                      styles.languageText,
                      item.code === currentLocale &&
                        styles.languageTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  selectorText: {
    fontSize: 14,
    marginRight: 6,
  },
  arrow: {
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    width: '80%',
    maxWidth: 300,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  languageItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  languageItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  languageText: {
    fontSize: 16,
  },
  languageTextSelected: {
    color: '#1976d2',
    fontWeight: '600',
  },
});
