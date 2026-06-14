'use client';

import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

interface FAQSectionProps {
  faqs: FAQItem[];
  /** Optional title for the FAQ section */
  title?: string;
  /** Enable search functionality */
  searchable?: boolean;
  /** Enable category filtering */
  categorized?: boolean;
  className?: string;
}

function AccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  const contentId = `faq-content-${item.id}`;
  const headingId = `faq-heading-${item.id}`;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <h3 id={headingId}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
        >
          <span className="font-medium text-gray-900 text-sm">{item.question}</span>
          <svg
            className={cn(
              'w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </h3>
      <div
        id={contentId}
        role="region"
        aria-labelledby={headingId}
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-96' : 'max-h-0'
        )}
      >
        <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">
          {item.answer}
        </div>
      </div>
    </div>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search questions..."
        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        aria-label="Search FAQ questions"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function FAQSection({
  faqs,
  title = 'Frequently Asked Questions',
  searchable = true,
  categorized = false,
  className,
}: FAQSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    if (!categorized) return [];
    const cats = new Set(faqs.map((faq) => faq.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [faqs, categorized]);

  // Filter FAQs based on search and category
  const filteredFaqs = useMemo(() => {
    let result = faqs;

    // Filter by category
    if (activeCategory) {
      result = result.filter((faq) => faq.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (faq) =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query)
      );
    }

    return result;
  }, [faqs, searchQuery, activeCategory]);

  const handleToggle = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  if (faqs.length === 0) {
    return null;
  }

  return (
    <section className={cn('py-8 px-4', className)} aria-labelledby="faq-heading">
      <div className="max-w-3xl mx-auto">
        <h2 id="faq-heading" className="text-xl font-bold text-gray-900 mb-4">
          {title}
        </h2>

        {/* Search */}
        {searchable && (
          <div className="mb-4">
            <SearchInput value={searchQuery} onChange={setSearchQuery} />
          </div>
        )}

        {/* Category Pills */}
        {categorized && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeCategory === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        {searchQuery && (
          <p className="text-sm text-gray-500 mb-4">
            {filteredFaqs.length === 0
              ? 'No matching questions found'
              : `${filteredFaqs.length} question${filteredFaqs.length !== 1 ? 's' : ''} found`}
          </p>
        )}

        {/* FAQ List */}
        {filteredFaqs.length > 0 ? (
          <div className="space-y-2">
            {filteredFaqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                item={faq}
                isOpen={openId === faq.id}
                onToggle={() => handleToggle(faq.id)}
              />
            ))}
          </div>
        ) : (
          !searchQuery && (
            <div className="text-center py-8">
              <p className="text-gray-500">No questions available</p>
            </div>
          )
        )}

        {/* Contact CTA */}
        <div className="mt-8 p-4 bg-indigo-50 rounded-xl text-center">
          <p className="text-sm text-indigo-700">
            Still have questions?{' '}
            <button
              type="button"
              className="font-semibold underline hover:no-underline"
              onClick={() => {
                // This would typically open a contact form or link to support
                window.location.href = 'mailto:support@rez.money';
              }}
            >
              Contact us
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}
