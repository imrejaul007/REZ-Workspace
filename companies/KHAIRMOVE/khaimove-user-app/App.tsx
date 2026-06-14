// KHAIRMOVE User App - Entry Point
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppErrorBoundary } from './src/components/ErrorBoundary';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AppErrorBoundary>
      <>
        <StatusBar style="light" />
        <AppNavigator />
      </>
    </AppErrorBoundary>
  );
}
