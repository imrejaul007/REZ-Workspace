import { useState } from 'react';

interface AgentListing {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  icon: string;
  category: string;
  industry: string;
  company: string;
  rating: number;
  reviews: number;
  tasks: number;
  skills: string[];
  price: string;
  popular?: boolean;
  featured?: boolean;
}

const AGENTS: AgentListing[] = [
  // Commerce Agents
  {
    id: 'restaurant-agent',
    name: 'Restaurant Agent',
    description: 'Handle orders, reservations, and menu queries with AI precision',
    longDescription: 'An intelligent agent that manages restaurant operations including taking orders, handling reservations, answering menu questions, and providing dietary recommendations. Integrates with POS systems and delivery platforms.',
    icon: '🍽️',
    category: 'Commerce',
    industry: 'Restaurant',
    company: 'REZ',
    rating: 4.8,
    reviews: 234,
    tasks: 15420,
    skills: ['Order Taking', 'Reservations', 'Menu Q&A', 'Dietary Analysis'],
    price: '₹999/mo',
    popular: true,
  },
  {
    id: 'retail-agent',
    name: 'Retail Assistant',
    description: 'Product discovery, recommendations, and customer support',
    longDescription: 'AI-powered retail assistant that helps customers find products, provides personalized recommendations, handles inventory queries, and manages post-purchase support.',
    icon: '🛒',
    category: 'Commerce',
    industry: 'Retail',
    company: 'REZ',
    rating: 4.7,
    reviews: 189,
    tasks: 12300,
    skills: ['Product Search', 'Recommendations', 'Inventory Check', 'Support'],
    price: '₹799/mo',
  },
  {
    id: 'ecom-agent',
    name: 'E-Commerce Agent',
    description: 'Complete storefront automation with AI sales agent',
    longDescription: 'Full-featured e-commerce agent handling customer queries, order tracking, returns processing, and product recommendations. Works 24/7 with consistent quality.',
    icon: '🏪',
    category: 'Commerce',
    industry: 'E-Commerce',
    company: 'REZ',
    rating: 4.9,
    reviews: 412,
    tasks: 28900,
    skills: ['Order Management', 'Returns', 'Recommendations', 'Tracking'],
    price: '₹1,499/mo',
    featured: true,
  },

  // Finance Agents
  {
    id: 'loan-agent',
    name: 'Loan Processing Agent',
    description: 'Automated loan applications, verification, and approval',
    longDescription: 'Streamlines loan processing with automated document verification, credit checks, eligibility calculation, and preliminary approval. Reduces processing time by 80%.',
    icon: '💰',
    category: 'Finance',
    industry: 'Banking',
    company: 'RidZa',
    rating: 4.9,
    reviews: 567,
    tasks: 45000,
    skills: ['KYC Verification', 'Credit Check', 'Eligibility', 'Approval'],
    price: '₹2,999/mo',
    popular: true,
    featured: true,
  },
  {
    id: 'insurance-agent',
    name: 'Insurance Advisor',
    description: 'Policy recommendations and claims processing',
    longDescription: 'AI insurance agent that recommends policies based on customer profiles, explains coverage details, and processes claims with minimal human intervention.',
    icon: '🛡️',
    category: 'Finance',
    industry: 'Insurance',
    company: 'RidZa',
    rating: 4.6,
    reviews: 178,
    tasks: 8900,
    skills: ['Policy Matching', 'Claims', 'Renewals', 'Q&A'],
    price: '₹1,799/mo',
  },
  {
    id: 'collections-agent',
    name: 'Collections Agent',
    description: 'Smart debt recovery with empathy-first approach',
    longDescription: 'AI-powered collections agent that handles outbound calls, negotiates payment plans, and manages late payment follow-ups with customer-friendly communication.',
    icon: '📞',
    category: 'Finance',
    industry: 'Collections',
    company: 'RidZa',
    rating: 4.5,
    reviews: 89,
    tasks: 5600,
    skills: ['Outbound Calls', 'Payment Plans', 'Negotiation', 'Settlement'],
    price: '₹2,499/mo',
  },

  // Healthcare Agents
  {
    id: 'healthcare-agent',
    name: 'Healthcare Assistant',
    description: 'Appointment booking, symptom triage, health tips',
    longDescription: 'Comprehensive healthcare AI agent that books appointments, provides initial symptom analysis, shares health tips, and connects patients with appropriate specialists.',
    icon: '🏥',
    category: 'Healthcare',
    industry: 'Healthcare',
    company: 'RisaCare',
    rating: 4.8,
    reviews: 345,
    tasks: 22300,
    skills: ['Appointments', 'Symptom Check', 'Specialist Match', 'Health Tips'],
    price: '₹1,999/mo',
    popular: true,
  },
  {
    id: 'diagnostic-agent',
    name: 'Diagnostic Assistant',
    description: 'Lab test booking and result interpretation',
    longDescription: 'AI agent that helps patients book lab tests, explains test procedures, interprets results in plain language, and recommends follow-up actions.',
    icon: '🔬',
    category: 'Healthcare',
    industry: 'Diagnostics',
    company: 'RisaCare',
    rating: 4.7,
    reviews: 156,
    tasks: 11200,
    skills: ['Test Booking', 'Result Interpretation', 'Follow-up', 'Education'],
    price: '₹1,499/mo',
  },

  // Real Estate Agents
  {
    id: 'realestate-agent',
    name: 'Property Agent',
    description: 'Property matching, price estimation, tour scheduling',
    longDescription: 'AI real estate agent that matches buyers with properties, provides price estimates based on market data, schedules property tours, and assists with negotiations.',
    icon: '🏠',
    category: 'Real Estate',
    industry: 'Real Estate',
    company: 'RisnaEstate',
    rating: 4.6,
    reviews: 234,
    tasks: 18900,
    skills: ['Property Match', 'Price Estimation', 'Tours', 'Negotiation'],
    price: '₹2,999/mo',
    featured: true,
  },
  {
    id: 'rental-agent',
    name: 'Rental Manager',
    description: 'Tenant screening, lease management, rent collection',
    longDescription: 'Comprehensive rental management agent handling tenant applications, screening, lease renewals, rent reminders, and maintenance requests.',
    icon: '🔑',
    category: 'Real Estate',
    industry: 'Rental',
    company: 'RisnaEstate',
    rating: 4.5,
    reviews: 178,
    tasks: 14500,
    skills: ['Tenant Screening', 'Lease Management', 'Rent Collection', 'Maintenance'],
    price: '₹1,799/mo',
  },

  // Support Agents
  {
    id: 'support-agent',
    name: 'Customer Support Agent',
    description: '24/7 customer support with instant resolutions',
    longDescription: 'Intelligent support agent that handles customer queries, processes refunds, tracks orders, and escalates complex issues. Achieves 85% first-contact resolution.',
    icon: '🎧',
    category: 'Support',
    industry: 'General',
    company: 'REZ',
    rating: 4.9,
    reviews: 892,
    tasks: 78000,
    skills: ['Complaints', 'Refunds', 'Tracking', 'Escalation'],
    price: '₹2,999/mo',
    popular: true,
    featured: true,
  },
  {
    id: 'sales-agent',
    name: 'Sales Agent',
    description: 'Lead qualification, product demos, quote generation',
    longDescription: 'AI sales agent that qualifies leads, schedules demos, answers product questions, and generates quotes. Increases sales team productivity by 3x.',
    icon: '💼',
    category: 'Sales',
    industry: 'General',
    company: 'REZ',
    rating: 4.7,
    reviews: 456,
    tasks: 34000,
    skills: ['Lead Qualification', 'Demos', 'Quotes', 'Follow-up'],
    price: '₹3,499/mo',
  },

  // HR Agents
  {
    id: 'hr-agent',
    name: 'HR Assistant',
    description: 'Resume screening, interview scheduling, onboarding',
    longDescription: 'AI HR agent that screens resumes, schedules interviews, conducts initial rounds, and manages employee onboarding documentation.',
    icon: '👔',
    category: 'HR',
    industry: 'General',
    company: 'CorpPerks',
    rating: 4.6,
    reviews: 234,
    tasks: 19800,
    skills: ['Resume Screening', 'Interview Scheduling', 'Onboarding', 'Policy Q&A'],
    price: '₹2,499/mo',
  },
  {
    id: 'recruitment-agent',
    name: 'Recruitment Agent',
    description: 'Talent sourcing, matching, and engagement',
    longDescription: 'AI recruitment agent that sources candidates from multiple platforms, matches requirements with profiles, and handles initial outreach and engagement.',
    icon: '🔍',
    category: 'HR',
    industry: 'Recruitment',
    company: 'CorpPerks',
    rating: 4.8,
    reviews: 312,
    tasks: 24500,
    skills: ['Sourcing', 'Matching', 'Outreach', 'Engagement'],
    price: '₹3,999/mo',
  },

  // Logistics Agents
  {
    id: 'delivery-agent',
    name: 'Delivery Coordinator',
    description: 'Route optimization, driver assignment, ETA tracking',
    longDescription: 'AI delivery coordinator that optimizes routes, assigns drivers, predicts ETAs, and handles delivery exceptions in real-time.',
    icon: '🚚',
    category: 'Logistics',
    industry: 'Delivery',
    company: 'KhairMove',
    rating: 4.7,
    reviews: 289,
    tasks: 45600,
    skills: ['Route Optimization', 'Driver Assignment', 'ETA Prediction', 'Exception Handling'],
    price: '₹2,999/mo',
    popular: true,
  },
  {
    id: 'tracking-agent',
    name: 'Tracking Agent',
    description: 'Real-time shipment tracking and customer updates',
    longDescription: 'AI tracking agent that provides real-time shipment updates, predicts delays, and proactively communicates with customers about their deliveries.',
    icon: '📦',
    category: 'Logistics',
    industry: 'Shipping',
    company: 'KhairMove',
    rating: 4.8,
    reviews: 567,
    tasks: 89000,
    skills: ['Tracking', 'Delay Prediction', 'Updates', 'Customer Communication'],
    price: '₹1,499/mo',
  },

  // Marketing Agents
  {
    id: 'marketing-agent',
    name: 'Marketing Agent',
    description: 'Campaign creation, targeting, and optimization',
    longDescription: 'AI marketing agent that creates campaigns, identifies target audiences, optimizes ad spend, and generates performance reports.',
    icon: '📢',
    category: 'Marketing',
    industry: 'General',
    company: 'REZ Media',
    rating: 4.6,
    reviews: 178,
    tasks: 12300,
    skills: ['Campaign Creation', 'Targeting', 'A/B Testing', 'Reporting'],
    price: '₹2,999/mo',
  },
  {
    id: 'content-agent',
    name: 'Content Agent',
    description: 'Blog posts, social media, email copywriting',
    longDescription: 'AI content agent that generates blog posts, creates social media content, writes email campaigns, and produces marketing collateral.',
    icon: '✍️',
    category: 'Marketing',
    industry: 'Content',
    company: 'REZ Media',
    rating: 4.5,
    reviews: 234,
    tasks: 15600,
    skills: ['Blog Writing', 'Social Media', 'Email', 'Copywriting'],
    price: '₹1,999/mo',
  },
];

const CATEGORIES = ['All', 'Commerce', 'Finance', 'Healthcare', 'Real Estate', 'Support', 'HR', 'Logistics', 'Marketing', 'Sales'];
const INDUSTRIES = ['All Industries', 'Restaurant', 'Retail', 'E-Commerce', 'Banking', 'Insurance', 'Healthcare', 'Real Estate', 'General'];

function App() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIndustry, setSelectedIndustry] = useState('All Industries');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentListing | null>(null);

  const filteredAgents = AGENTS.filter(agent => {
    const matchesCategory = selectedCategory === 'All' || agent.category === selectedCategory;
    const matchesIndustry = selectedIndustry === 'All Industries' || agent.industry === selectedIndustry;
    const matchesSearch = !searchQuery ||
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesIndustry && matchesSearch;
  });

  const featuredAgents = AGENTS.filter(a => a.featured);
  const popularAgents = AGENTS.filter(a => a.popular);

  return (
    <div className="app">
      <header className="header">
        <h1>🤖 REZ Agent Marketplace</h1>
        <input
          type="text"
          className="search-bar"
          placeholder="Search agents..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </header>

      <div className="hero">
        <h2>AI Agents for Every Industry</h2>
        <p>Deploy intelligent agents in minutes. Restaurant ordering, loan processing, healthcare appointments, customer support, and more.</p>
      </div>

      <main className="main">
        {/* Featured Agents */}
        {!searchQuery && selectedCategory === 'All' && (
          <section className="category-section">
            <div className="category-header">
              <h3 className="category-title">⭐ Featured Agents</h3>
            </div>
            <div className="agent-grid">
              {featuredAgents.map(agent => (
                <div key={agent.id} className="agent-card" onClick={() => setSelectedAgent(agent)}>
                  <div className="agent-header">
                    <div className="agent-icon">{agent.icon}</div>
                    <div className="agent-info">
                      <h3>{agent.name}</h3>
                      <span className="agent-company">{agent.company}</span>
                    </div>
                  </div>
                  <p className="agent-description">{agent.description}</p>
                  <div className="agent-stats">
                    <span className="stat">
                      <span className="stat-icon">⭐</span> {agent.rating}
                    </span>
                    <span className="stat">
                      {agent.tasks.toLocaleString()} tasks
                    </span>
                  </div>
                  <div className="pricing">
                    <span className="price">{agent.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <div className="filters">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Industry Filter */}
        <div className="filters" style={{ marginBottom: '2rem' }}>
          {INDUSTRIES.map(ind => (
            <button
              key={ind}
              className={`filter-btn ${selectedIndustry === ind ? 'active' : ''}`}
              onClick={() => setSelectedIndustry(ind)}
            >
              {ind}
            </button>
          ))}
        </div>

        {/* All Agents */}
        <section className="category-section">
          <div className="category-header">
            <h3 className="category-title">
              {selectedCategory === 'All' ? 'All Agents' : selectedCategory}
              <span style={{ fontWeight: 'normal', color: 'var(--text-muted)', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
                ({filteredAgents.length} agents)
              </span>
            </h3>
          </div>
          <div className="agent-grid">
            {filteredAgents.map(agent => (
              <div key={agent.id} className="agent-card" onClick={() => setSelectedAgent(agent)}>
                <div className="agent-header">
                  <div className="agent-icon">{agent.icon}</div>
                  <div className="agent-info">
                    <h3>{agent.name}</h3>
                    <span className="agent-company">{agent.company}</span>
                  </div>
                  {agent.popular && (
                    <span style={{ background: 'var(--success)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                      Popular
                    </span>
                  )}
                </div>
                <p className="agent-description">{agent.description}</p>
                <div className="agent-tags">
                  {agent.skills.slice(0, 3).map(skill => (
                    <span key={skill} className="tag">{skill}</span>
                  ))}
                </div>
                <div className="agent-stats" style={{ marginTop: '1rem' }}>
                  <span className="stat">⭐ {agent.rating}</span>
                  <span className="stat">{agent.reviews} reviews</span>
                </div>
                <div className="pricing">
                  <span className="price">{agent.price}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="modal" onClick={() => setSelectedAgent(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedAgent.icon} {selectedAgent.name}</h2>
              <button className="modal-close" onClick={() => setSelectedAgent(null)}>×</button>
            </div>
            <div className="rating">
              <span className="stars">{'⭐'.repeat(Math.floor(selectedAgent.rating))}</span>
              <span>{selectedAgent.rating} ({selectedAgent.reviews} reviews)</span>
            </div>
            <p style={{ margin: '1rem 0', color: 'var(--text-muted)' }}>
              {selectedAgent.longDescription}
            </p>
            <div style={{ margin: '1rem 0' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>Skills</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {selectedAgent.skills.map(skill => (
                  <span key={skill} className="tag" style={{ background: 'var(--primary)', color: 'white' }}>{skill}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
              <div>
                <span className="price" style={{ fontSize: '2rem' }}>{selectedAgent.price}</span>
              </div>
              <button className="btn btn-primary">
                Deploy Agent
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="#">About</a>
            <a href="#">Documentation</a>
            <a href="#">Pricing</a>
            <a href="#">Contact</a>
          </div>
          <p className="footer-text">© 2026 REZ Intelligence. Built on HOJAI AI Platform.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
