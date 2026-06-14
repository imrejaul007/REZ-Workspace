import { ExpoRoot } from 'expo-router';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx = (require as unknown).context('./app');

function Root(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <ExpoRoot context={ctx} />
    </ErrorBoundary>
  );
}

export default Root;
