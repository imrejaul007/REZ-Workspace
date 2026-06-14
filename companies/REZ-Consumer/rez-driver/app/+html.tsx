import { ScrollView, StyleSheet } from 'react-native';
import { HTML } from 'react-native-render-html';

// Basic HTML template for web support
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>REZ Driver</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #F2F2F7;
      color: #1A1A1A;
      overflow-x: hidden;
    }
    #root {
      min-height: 100vh;
    }
    /* Loading spinner */
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      flex-direction: column;
    }
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #E5E5EA;
      border-top-color: #007AFF;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    .loading-text {
      margin-top: 16px;
      color: #8E8E93;
      font-size: 14px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    /* Fallback message for native-only features */
    .native-notice {
      background: #FFF9E6;
      padding: 12px 16px;
      text-align: center;
      font-size: 13px;
      color: #FF9500;
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading REZ Driver...</div>
    </div>
  </div>
  <script>
    // Redirect to native app if installed
    var isStandalone = window.navigator.standalone ||
                       window.matchMedia('(display-mode: standalone)').matches;
    if (!isStandalone) {
      // Show install prompt logic could go here
    }
  </script>
</body>
</html>
`;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      horizontal
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
});

export default function HtmlPage() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.webContent}
    >
      <Html content={htmlContent} />
    </ScrollView>
  );
}

function Html({ content }: { content: string }) {
  return <HTML source={{ html: content }} />;
}
