import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { I18nProvider, useI18n } from './i18n/context';
import { LanguageSelector } from './components/LanguageSelector';

function RootLayoutContent() {
  const { t, locale, setLocale } = useI18n();

  return (
    <>
      <Stack
        screenOptions={{
          headerRight: () => (
            <LanguageSelector
              currentLocale={locale}
              onLocaleChange={setLocale}
            />
          ),
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: t('dashboard.title'),
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            title: t('auth.signIn'),
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <I18nProvider>
      <RootLayoutContent />
    </I18nProvider>
  );
}
