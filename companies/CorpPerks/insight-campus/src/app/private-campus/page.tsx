'use client';

import { useState } from 'react';
import styles from './page.module.css';

const mockCampuses = [
  {
    id: '1',
    name: 'IIT Delhi - CSE 2024',
    university: 'IIT Delhi',
    batch: '2024',
    code: 'IITD-CSE-24',
    members: 45,
    maxMembers: 60,
    description: 'Private campus for B.Tech CSE batch 2024. Share resources, discuss projects, and stay connected.',
    myRole: 'Admin',
    color: '#ef4444',
    icon: '🏛️',
    features: ['Course Materials', 'Group Projects', 'Placement Prep', 'Alumni Connect'],
    events: 12,
    resources: 156,
  },
  {
    id: '2',
    name: 'AIIMS Delhi - MBBS 2023',
    university: 'AIIMS Delhi',
    batch: '2023',
    code: 'AIIMS-MBBS-23',
    members: 98,
    maxMembers: 100,
    description: 'Official campus for MBBS batch 2023. Clinical case discussions, study materials, and peer support.',
    myRole: 'Member',
    color: '#10b981',
    icon: '🏥',
    features: ['Case Studies', 'Clinical Rotations', 'Exam Prep', 'Research Papers'],
    events: 8,
    resources: 234,
  },
  {
    id: '3',
    name: 'NIT Trichy - ECE 2025',
    university: 'NIT Trichy',
    batch: '2025',
    code: 'NITT-ECE-25',
    members: 67,
    maxMembers: 80,
    description: 'Electronics and Communication batch 2025. VLSI, Embedded Systems, and Signal Processing discussions.',
    myRole: 'Member',
    color: '#3b82f6',
    icon: '📡',
    features: ['Lab Projects', 'Technical Papers', 'Hackathons', 'Placement Cell'],
    events: 15,
    resources: 89,
  },
];

const mockActivities = [
  { id: '1', user: 'Rahul Sharma', action: 'uploaded', target: 'Data Structures Notes', time: '2 hours ago', type: 'upload' },
  { id: '2', user: 'Priya Patel', action: 'shared', target: 'Placement Interview Experience', time: '4 hours ago', type: 'share' },
  { id: '3', user: 'Amit Kumar', action: 'created event', target: 'Mock Interview Session', time: '6 hours ago', type: 'event' },
  { id: '4', user: 'Sneha Gupta', action: 'posted', target: 'Week 8 Study Group Discussion', time: '1 day ago', type: 'post' },
];

export default function PrivateCampusPage() {
  const [activeTab, setActiveTab] = useState<'campuses' | 'discover' | 'create'>('campuses');
  const [selectedCampus, setSelectedCampus] = useState<typeof mockCampuses[0] | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampus, setNewCampus] = useState({
    name: '',
    university: '',
    batch: '',
    description: '',
    features: [] as string[],
  });

  const allFeatures = ['Course Materials', 'Discussion Forum', 'Study Groups', 'File Sharing', 'Event Calendar', 'Job Board', 'Alumni Network', 'Research Papers'];

  const toggleFeature = (feature: string) => {
    setNewCampus(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const handleCreate = () => {
    if (newCampus.name && newCampus.university && newCampus.batch) {
      setShowCreateModal(false);
      setNewCampus({ name: '', university: '', batch: '', description: '', features: [] });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Private Campus</h1>
          <p className={styles.subtitle}>Exclusive spaces for your college community</p>
        </div>
        <button className={styles.createBtn} onClick={() => setShowCreateModal(true)}>
          + Create Campus
        </button>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🏛️</span>
          <div>
            <span className={styles.statValue}>{mockCampuses.length}</span>
            <span className={styles.statLabel}>My Campuses</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>👥</span>
          <div>
            <span className={styles.statValue}>210</span>
            <span className={styles.statLabel}>Total Members</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📚</span>
          <div>
            <span className={styles.statValue}>479</span>
            <span className={styles.statLabel}>Shared Resources</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📅</span>
          <div>
            <span className={styles.statValue}>35</span>
            <span className={styles.statLabel}>Campus Events</span>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'campuses' ? styles.tabActive : ''}`} onClick={() => setActiveTab('campuses')}>
          🏛️ My Campuses
        </button>
        <button className={`${styles.tab} ${activeTab === 'discover' ? styles.tabActive : ''}`} onClick={() => setActiveTab('discover')}>
          🔍 Discover
        </button>
        <button className={`${styles.tab} ${activeTab === 'create' ? styles.tabActive : ''}`} onClick={() => setActiveTab('create')}>
          ➕ Create New
        </button>
      </div>

      {activeTab === 'campuses' && (
        <div className={styles.campusList}>
          {mockCampuses.map(campus => (
            <div key={campus.id} className={styles.campusCard} onClick={() => setSelectedCampus(campus)}>
              <div className={styles.campusHeader} style={{ background: campus.color }}>
                <span className={styles.campusIcon}>{campus.icon}</span>
                <span className={styles.roleBadge}>{campus.myRole}</span>
              </div>
              <div className={styles.campusBody}>
                <h3>{campus.name}</h3>
                <p className={styles.campusUniversity}>{campus.university}</p>
                <p className={styles.campusDesc}>{campus.description}</p>
                <div className={styles.campusStats}>
                  <span>👥 {campus.members}/{campus.maxMembers}</span>
                  <span>📚 {campus.resources}</span>
                  <span>📅 {campus.events}</span>
                </div>
                <div className={styles.campusFeatures}>
                  {campus.features.map(f => (
                    <span key={f} className={styles.featureTag}>{f}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'discover' && (
        <div className={styles.discover}>
          <div className={styles.searchBar}>
            <input type="text" placeholder="Search campuses by name, university, or code..." />
            <button>🔍</button>
          </div>
          <p className={styles.discoverHint}>Campuses are invite-only. You need a code to join private campuses.</p>
          <div className={styles.inviteSection}>
            <h3>Join with Code</h3>
            <div className={styles.codeInput}>
              <input type="text" placeholder="Enter campus code (e.g., IITD-CSE-24)" />
              <button className={styles.joinBtn}>Join Campus</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'create' && (
        <div className={styles.createSection}>
          <div className={styles.createInfo}>
            <h2>Create Your Private Campus</h2>
            <p>Build an exclusive community for your college batch, club, or study group.</p>
          </div>
          <div className={styles.createForm}>
            <div className={styles.formGroup}>
              <label>Campus Name</label>
              <input
                type="text"
                placeholder="e.g., IIT Delhi CSE 2024"
                value={newCampus.name}
                onChange={(e) => setNewCampus(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>University/College</label>
                <input
                  type="text"
                  placeholder="e.g., IIT Delhi"
                  value={newCampus.university}
                  onChange={(e) => setNewCampus(prev => ({ ...prev, university: e.target.value }))}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Batch Year</label>
                <input
                  type="text"
                  placeholder="e.g., 2024"
                  value={newCampus.batch}
                  onChange={(e) => setNewCampus(prev => ({ ...prev, batch: e.target.value }))}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                rows={3}
                placeholder="What is this campus about?"
                value={newCampus.description}
                onChange={(e) => setNewCampus(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Features (select all that apply)</label>
              <div className={styles.featureGrid}>
                {allFeatures.map(feature => (
                  <button
                    key={feature}
                    className={`${styles.featureOption} ${newCampus.features.includes(feature) ? styles.featureOptionActive : ''}`}
                    onClick={() => toggleFeature(feature)}
                  >
                    {feature}
                  </button>
                ))}
              </div>
            </div>
            <button className={styles.submitBtn} onClick={handleCreate}>
              Create Campus
            </button>
          </div>
        </div>
      )}

      {selectedCampus && (
        <div className={styles.modal} onClick={() => setSelectedCampus(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader} style={{ background: selectedCampus.color }}>
              <span className={styles.modalIcon}>{selectedCampus.icon}</span>
              <h2>{selectedCampus.name}</h2>
              <p>{selectedCampus.university} • Batch {selectedCampus.batch}</p>
              <span className={styles.modalCode}>Code: {selectedCampus.code}</span>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalDesc}>{selectedCampus.description}</p>
              <div className={styles.modalStats}>
                <div className={styles.modalStat}>
                  <span>👥</span>
                  <span>{selectedCampus.members} members</span>
                </div>
                <div className={styles.modalStat}>
                  <span>📚</span>
                  <span>{selectedCampus.resources} resources</span>
                </div>
                <div className={styles.modalStat}>
                  <span>📅</span>
                  <span>{selectedCampus.events} events</span>
                </div>
              </div>

              <div className={styles.activitySection}>
                <h3>Recent Activity</h3>
                <div className={styles.activityList}>
                  {mockActivities.map(activity => (
                    <div key={activity.id} className={styles.activityItem}>
                      <span className={styles.activityAvatar}>{activity.user.split(' ').map(n => n[0]).join('')}</span>
                      <div className={styles.activityContent}>
                        <p><strong>{activity.user}</strong> {activity.action} <em>{activity.target}</em></p>
                        <span className={styles.activityTime}>{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.modalActions}>
                <button className={styles.enterBtn}>Enter Campus</button>
                <button className={styles.shareBtn}>Share Code</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className={styles.modal} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Create Private Campus</h2>
            <p>Build an exclusive space for your college community</p>
            <div className={styles.formGroup}>
              <label>Campus Name</label>
              <input
                type="text"
                placeholder="e.g., IIT Delhi CSE 2024"
                value={newCampus.name}
                onChange={(e) => setNewCampus(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>University</label>
                <input
                  type="text"
                  placeholder="College/University name"
                  value={newCampus.university}
                  onChange={(e) => setNewCampus(prev => ({ ...prev, university: e.target.value }))}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Batch Year</label>
                <input
                  type="text"
                  placeholder="e.g., 2024"
                  value={newCampus.batch}
                  onChange={(e) => setNewCampus(prev => ({ ...prev, batch: e.target.value }))}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                rows={3}
                placeholder="What is this campus about?"
                value={newCampus.description}
                onChange={(e) => setNewCampus(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className={styles.submitBtn} onClick={handleCreate}>Create Campus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
