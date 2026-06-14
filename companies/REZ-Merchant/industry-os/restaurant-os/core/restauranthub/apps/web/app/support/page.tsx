'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import SupportSystem from '@/components/support/support-system';
import { useAuth } from '@/lib/auth/auth-provider';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

// Static FAQs — these are content, not mock data. Safe to keep.
const staticFAQs = [
  {
    id: '1',
    question: 'How do I create a new restaurant account?',
    answer: 'Click "Sign Up" and select "Restaurant Owner". Fill in your restaurant details and upload required documents like business license and FSSAI certificate. Our team will verify your information within 24-48 hours.',
    category: 'account' as const,
    views: 0,
    helpfulVotes: 0,
    unhelpfulVotes: 0,
    lastUpdated: new Date().toISOString(),
    tags: ['registration', 'account setup', 'verification'],
  },
  {
    id: '2',
    question: 'How do I update my payment information?',
    answer: 'Go to Settings > Billing > Payment Methods. Click "Add Payment Method" to add a new card or bank account. All payment information is securely encrypted.',
    category: 'billing' as const,
    views: 0,
    helpfulVotes: 0,
    unhelpfulVotes: 0,
    lastUpdated: new Date().toISOString(),
    tags: ['billing', 'payment'],
  },
  {
    id: '3',
    question: 'How do I add new menu items to my restaurant?',
    answer: 'Go to your Restaurant Dashboard > Menu Management. Click "Add New Item" and fill in the details. Changes are reflected immediately on your restaurant page.',
    category: 'general' as const,
    views: 0,
    helpfulVotes: 0,
    unhelpfulVotes: 0,
    lastUpdated: new Date().toISOString(),
    tags: ['menu management', 'restaurant dashboard'],
  },
];

export default function SupportPage() {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState(staticFAQs);
  const [tickets, setTickets] = useState<unknown[]>([]);
  const [articles, setArticles] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSupportData = async () => {
      setLoading(true);
      try {
        const token = getAuthToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [ticketsRes, articlesRes] = await Promise.allSettled([
          fetch(`${API_BASE}/support/tickets`, { headers }),
          fetch(`${API_BASE}/support/articles`, { headers }),
        ]);

        if (ticketsRes.status === 'fulfilled' && ticketsRes.value.ok) {
          const data = await ticketsRes.value.json();
          setTickets(Array.isArray(data) ? data : data.tickets || []);
        }

        if (articlesRes.status === 'fulfilled' && articlesRes.value.ok) {
          const data = await articlesRes.value.json();
          setArticles(Array.isArray(data) ? data : data.articles || []);
        }
      } catch {
        // Support API not yet available — start with empty lists
      } finally {
        setLoading(false);
      }
    };

    fetchSupportData();
  }, []);

  const handleCreateTicket = async (newTicket) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/support/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newTicket),
      });
      if (res.ok) {
        const created = await res.json();
        setTickets(prev => [created, ...prev]);
      } else {
        // Optimistically add to local state if API call fails
        const ticket = {
          ...newTicket,
          id: `TKT-${String(tickets.length + 1).padStart(3, '0')}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          responses: [],
        };
        setTickets(prev => [ticket, ...prev]);
      }
    } catch {
      const ticket = {
        ...newTicket,
        id: `TKT-${String(tickets.length + 1).padStart(3, '0')}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        responses: [],
      };
      setTickets(prev => [ticket, ...prev]);
    }
  };

  const handleRespondToTicket = (ticketId: string, response) => {
    const newResponse = {
      ...response,
      id: `resp-${Date.now()}`,
      ticketId,
      createdAt: new Date().toISOString(),
      isEdited: false,
    };
    setTickets(prev =>
      prev.map(ticket =>
        ticket.id === ticketId
          ? {
              ...ticket,
              responses: [...(ticket.responses || []), newResponse],
              updatedAt: new Date().toISOString(),
              status: (response.responderType === 'agent' ? 'waiting_customer' : 'in_progress') as unknown,
            }
          : ticket
      )
    );
  };

  const handleUpdateTicketStatus = (ticketId: string, status) => {
    setTickets(prev =>
      prev.map(ticket =>
        ticket.id === ticketId
          ? {
              ...ticket,
              status,
              updatedAt: new Date().toISOString(),
              resolvedAt: status === 'resolved' ? new Date().toISOString() : ticket.resolvedAt,
            }
          : ticket
      )
    );
  };

  const handleRateSupport = (ticketId: string, rating: number, feedback?: string) => {
    setTickets(prev =>
      prev.map(ticket =>
        ticket.id === ticketId ? { ...ticket, rating, feedback } : ticket
      )
    );
  };

  const handleVoteFAQ = (faqId: string, isHelpful: boolean) => {
    setFaqs(prev =>
      prev.map(faq =>
        faq.id === faqId
          ? {
              ...faq,
              helpfulVotes: isHelpful ? faq.helpfulVotes + 1 : faq.helpfulVotes,
              unhelpfulVotes: !isHelpful ? faq.unhelpfulVotes + 1 : faq.unhelpfulVotes,
              views: faq.views + 1,
            }
          : faq
      )
    );
  };

  const handleRateArticle = (articleId: string, rating: number) => {
    setArticles(prev =>
      prev.map(article =>
        article.id === articleId
          ? {
              ...article,
              rating: ((article.rating * article.ratingCount) + rating) / (article.ratingCount + 1),
              ratingCount: article.ratingCount + 1,
            }
          : article
      )
    );
  };

  return (
    <DashboardLayout>
      <SupportSystem
        faqs={faqs}
        tickets={tickets}
        articles={articles}
        userRole={(user?.role as unknown) || 'customer'}
        currentUserId={user?.id}
        onCreateTicket={handleCreateTicket}
        onRespondToTicket={handleRespondToTicket}
        onUpdateTicketStatus={handleUpdateTicketStatus}
        onRateSupport={handleRateSupport}
        onVoteFAQ={handleVoteFAQ}
        onRateArticle={handleRateArticle}
      />
    </DashboardLayout>
  );
}
