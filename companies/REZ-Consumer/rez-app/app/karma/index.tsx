/**
 * Karma Index — redirect to home
 */
import { Redirect } from 'expo-router';

export default function KarmaIndex() {
  return <Redirect href="/karma/home" />;
}
