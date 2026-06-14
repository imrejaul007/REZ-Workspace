import type { Metadata } from 'next';
import SearchResultsClient from './SearchResultsClient';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `"${q}" — Search · REZ Now` : 'Search Stores · REZ Now',
    description: 'Find restaurants, cafes, bakeries and more near you on REZ Now.',
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = typeof q === 'string' ? q : '';

  return <SearchResultsClient q={query} />;
}
