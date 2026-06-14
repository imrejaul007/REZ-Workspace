// @ts-nocheck
import { useLocalSearchParams, Redirect } from 'expo-router';

const SLUG_MAP: Record<string, string> = {
  'food-dining': '/MainCategory/food-dining',
  cafes: '/MainCategory/food-dining',
  shopping: '/(tabs)/categories',
  'health-wellness': '/MainCategory/healthcare',
  entertainment: '/MainCategory/entertainment',
  'beauty-salon': '/MainCategory/beauty-wellness',
  fitness: '/MainCategory/fitness-sports',
  education: '/MainCategory/education-learning',
};

export default function CategoryRedirect() {
  const { slug } = useLocalSearchParams<unknown>();
  const target = SLUG_MAP[slug ?? ''] ?? '/(tabs)/categories';
  return <Redirect href={target as unknown} />;
}
