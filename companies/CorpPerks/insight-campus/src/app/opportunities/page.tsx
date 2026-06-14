'use client';
import { useState } from 'react';
import styles from './page.module.css';

const opportunities = [
  {
    id: 1,
    type: 'internship',
    title: 'Software Development Intern',
    organization: 'Google',
    location: 'Bangalore, Karnataka',
    duration: '3 months',
    stipend: '₹50,000/month',
    deadline: 'June 15, 2026',
    tags: ['Development', 'Python', 'AI'],
    new: true,
  },
  {
    id: 2,
    type: 'scholarship',
    title: 'Merit-Based STEM Scholarship',
    organization: 'MIT',
    location: 'USA (Remote)',
    duration: 'Full Program',
    amount: '$25,000/year',
    deadline: 'July 1, 2026',
    tags: ['STEM', 'Graduate', 'Research'],
    new: true,
  },
  {
    id: 3,
    type: 'event',
    title: 'TechCrunch Disrupt 2026',
    organization: 'TechCrunch',
    location: 'San Francisco, USA',
    date: 'September 20-22, 2026',
    price: '$1,299',
    tags: ['Startup', 'Networking', 'Innovation'],
    new: false,
  },
  {
    id: 4,
    type: 'fellowship',
    title: 'Y Combinator Fellowship',
    organization: 'Y Combinator',
    location: 'Remote',
    duration: '3 months',
    amount: '$500,000',
    deadline: 'August 1, 2026',
    tags: ['Startup', 'Funding', 'Mentorship'],
    new: true,
  },
  {
    id: 5,
    type: 'hackathon',
    title: 'ETHGlobal Bangalore 2026',
    organization: 'ETHGlobal',
    location: 'Bangalore, Karnataka',
    date: 'August 10-12, 2026',
    prize: '₹10,00,000',
    tags: ['Blockchain', 'Web3', 'Prize'],
    new: false,
  },
  {
    id: 6,
    type: 'internship',
    title: 'UX Research Intern',
    organization: 'Microsoft',
    location: 'Hyderabad, Telangana',
    duration: '6 months',
    stipend: '₹45,000/month',
    deadline: 'June 20, 2026',
    tags: ['UX', 'Research', 'Design'],
    new: false,
  },
];

const savedOpportunities = [1, 4];

const typeFilters = [
  { type: 'all', label: 'All', icon: '🗂️', count: 45 },
  { type: 'internship', label: 'Internships', icon: '💼', count: 18 },
  { type: 'scholarship', label: 'Scholarships', icon: '🎓', count: 12 },
  { type: 'event', label: 'Events', icon: '📅', count: 8 },
  { type: 'fellowship', label: 'Fellowships', icon: '🌟', count: 4 },
  { type: 'hackathon', label: 'Hackathons', icon: '💻', count: 3 },
];

const resources = [
  { title: 'Resume Templates', count: 25, icon: '📄' },
  { title: 'Interview Prep', count: 42, icon: '🎯' },
  { title: 'Scholarship Guides', count: 18, icon: '📚' },
  { title: 'Tech Resources', count: 67, icon: '💡' },
];

export default function OpportunitiesPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [saved, setSaved] = useState(savedOpportunities);

  const toggleSave = (id: number) => {
    setSaved(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredOpps = opportunities.filter(opp => {
    const matchesFilter = activeFilter === 'all' || opp.type === activeFilter;
    const matchesSearch = opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'internship': return '#8b5cf6';
      case 'scholarship': return '#06b6d4';
      case 'event': return '#f59e0b';
      case 'fellowship': return '#10b981';
      case 'hackathon': return '#f97316';
      default: return '#6b7280';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Discover Your Next Opportunity</h1>
          <p>Internships, scholarships, events, and more - curated for students</p>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.statNum}>156</span>
            <span className={styles.statLabel}>Opportunities</span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.statNum}>12</span>
            <span className={styles.statLabel}>New This Week</span>
          </div>
        </div>
      </div>

      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search opportunities, skills, organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button>🔍</button>
        </div>

        <div className={styles.filters}>
          {typeFilters.map((filter) => (
            <button
              key={filter.type}
              className={`${styles.filterBtn} ${activeFilter === filter.type ? styles.active : ''}`}
              onClick={() => setActiveFilter(filter.type)}
            >
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
              <span className={styles.filterCount}>{filter.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.opportunitiesList}>
          {filteredOpps.map((opp) => (
            <div key={opp.id} className={styles.oppCard}>
              <div
                className={styles.oppType}
                style={{ background: `${getTypeColor(opp.type)}20`, color: getTypeColor(opp.type) }}
              >
                {typeFilters.find(f => f.type === opp.type)?.label}
                {opp.new && <span className={styles.newBadge}>NEW</span>}
              </div>

              <div className={styles.oppContent}>
                <h3>{opp.title}</h3>
                <p className={styles.org}>{opp.organization}</p>

                <div className={styles.oppMeta}>
                  <span>📍 {opp.location}</span>
                  {opp.duration && <span>⏱️ {opp.duration}</span>}
                  {opp.date && <span>📅 {opp.date}</span>}
                </div>

                <div className={styles.oppTags}>
                  {opp.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              </div>

              <div className={styles.oppSidebar}>
                <div className={styles.oppValue}>
                  {opp.stipend && (
                    <>
                      <span className={styles.valueLabel}>Stipend</span>
                      <span className={styles.valueNum}>{opp.stipend}</span>
                    </>
                  )}
                  {opp.amount && (
                    <>
                      <span className={styles.valueLabel}>Amount</span>
                      <span className={styles.valueNum}>{opp.amount}</span>
                    </>
                  )}
                  {opp.prize && (
                    <>
                      <span className={styles.valueLabel}>Prize</span>
                      <span className={styles.valueNum}>{opp.prize}</span>
                    </>
                  )}
                  {opp.price && (
                    <>
                      <span className={styles.valueLabel}>Price</span>
                      <span className={styles.valueNum}>{opp.price}</span>
                    </>
                  )}
                </div>

                {opp.deadline && (
                  <div className={styles.deadline}>
                    <span>Deadline</span>
                    <strong>{opp.deadline}</strong>
                  </div>
                )}

                <div className={styles.oppActions}>
                  <button
                    className={`${styles.saveBtn} ${saved.includes(opp.id) ? styles.saved : ''}`}
                    onClick={() => toggleSave(opp.id)}
                  >
                    {saved.includes(opp.id) ? '❤️ Saved' : '🤍 Save'}
                  </button>
                  <button className={styles.applyBtn}>Apply</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.sidebar}>
          <div className={styles.section}>
            <h3>Quick Resources</h3>
            <div className={styles.resourceList}>
              {resources.map((resource, i) => (
                <div key={i} className={styles.resourceItem}>
                  <span className={styles.resourceIcon}>{resource.icon}</span>
                  <div>
                    <strong>{resource.title}</strong>
                    <span>{resource.count} items</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h3>Upcoming Deadlines</h3>
            <div className={styles.deadlineList}>
              <div className={styles.deadlineItem}>
                <span className={styles.deadlineDate}>Jun 15</span>
                <div>
                  <strong>Google Internship</strong>
                  <span>12 days left</span>
                </div>
              </div>
              <div className={styles.deadlineItem}>
                <span className={styles.deadlineDate}>Jun 20</span>
                <div>
                  <strong>Microsoft UX</strong>
                  <span>17 days left</span>
                </div>
              </div>
              <div className={styles.deadlineItem}>
                <span className={styles.deadlineDate}>Jul 1</span>
                <div>
                  <strong>MIT Scholarship</strong>
                  <span>28 days left</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Your Saved ({saved.length})</h3>
            <div className={styles.savedList}>
              {saved.length === 0 ? (
                <p className={styles.emptyState}>No saved opportunities yet</p>
              ) : (
                opportunities
                  .filter(opp => saved.includes(opp.id))
                  .map(opp => (
                    <div key={opp.id} className={styles.savedItem}>
                      <span className={styles.savedTitle}>{opp.title}</span>
                      <button onClick={() => toggleSave(opp.id)}>×</button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
