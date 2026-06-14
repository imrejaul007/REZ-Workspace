interface SearchHighlightProps {
  text: string;
  query: string;
}

/**
 * Renders text with all matching query segments wrapped in <mark> tags.
 * Matching is case-insensitive. Falls back to plain text when query is empty
 * or produces no match.
 * NW-MED-032: Use a regex with global flag to highlight ALL occurrences, not just the first.
 *
 * Example:
 *   <SearchHighlight text="Chicken Tikka Masala" query="a" />
 *   → <span>Chicken Tikk<span class="bg-yellow-200">a</span> M<span class="bg-yellow-200">a</span>s<span class="bg-yellow-200">a</span>l<span class="bg-yellow-200">a</span></span>
 */
export default function SearchHighlight({ text, query }: SearchHighlightProps) {
  if (!query.trim()) {
    return <span>{text}</span>;
  }

  const needle = query.trim();
  // Escape regex special characters in the search query
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');

  // Split on matches to get [before, match, after, match, after, ...]
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">{part}</mark>
          : part,
      )}
    </span>
  );
}
