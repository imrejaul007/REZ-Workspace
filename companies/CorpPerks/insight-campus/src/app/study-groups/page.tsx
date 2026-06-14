'use client';

import { useState } from 'react';
import styles from './page.module.css';

const mockGroups = [
  {
    id: '1',
    name: 'JEE 2026 Aspirants',
    subject: 'Engineering',
    members: 234,
    maxMembers: 300,
    isPrivate: false,
    description: 'Community for JEE Advanced preparation. Share resources, discuss problems, and stay motivated!',
    creator: 'Rahul Sharma',
    avatar: 'RS',
    nextSession: 'Today, 6 PM',
    topics: ['Physics', 'Chemistry', 'Maths', 'Mock Tests'],
    activity: 'Very Active',
    color: '#ef4444',
  },
  {
    id: '2',
    name: 'Python & AI Learners',
    subject: 'Computer Science',
    members: 156,
    maxMembers: 200,
    isPrivate: false,
    description: 'Learn Python programming and AI/ML concepts together. Weekly coding sessions.',
    creator: 'Priya Patel',
    avatar: 'PP',
    nextSession: 'Tomorrow, 5 PM',
    topics: ['Python', 'Machine Learning', 'Data Science'],
    activity: 'Active',
    color: '#3b82f6',
  },
  {
    id: '3',
    name: 'Medical Students Hub',
    subject: 'Medicine',
    members: 89,
    maxMembers: 100,
    isPrivate: false,
    description: 'NEET PG preparation group. Share notes, discuss cases, and prepare together.',
    creator: 'Dr. Amit Kumar',
    avatar: 'AK',
    nextSession: 'Wed, 7 PM',
    topics: ['Anatomy', 'Physiology', 'Biochemistry'],
    activity: 'Active',
    color: '#10b981',
  },
  {
    id: '4',
    name: 'IIT Delhi CSE 2024 Batch',
    subject: 'College',
    members: 45,
    maxMembers: 50,
    isPrivate: true,
    description: 'Private group for IIT Delhi CSE batch 2024 students.',
    creator: 'Sneha Gupta',
    avatar: 'SG',
    nextSession: 'Today, 8 PM',
    topics: ['DSA', 'Algorithms', 'Projects'],
    activity: 'Very Active',
    color: '#8b5cf6',
  },
  {
    id: '5',
    name: 'GRE/TOEFL Prep',
    subject: 'Exams',
    members: 67,
    maxMembers: 100,
    isPrivate: false,
    description: 'Prepare for GRE and TOEFL together. Share study plans and test strategies.',
    creator: 'Neha Singh',
    avatar: 'NS',
    nextSession: 'Sat, 10 AM',
    topics: ['Vocabulary', 'Reading', 'Writing'],
    activity: 'Moderate',
    color: '#f59e0b',
  },
];

const myGroups = [mockGroups[0], mockGroups[3]];

const categories = ['All Groups', 'Engineering', 'Medical', 'Computer Science', 'Business', 'Languages', 'Arts'];

export default function StudyGroupsPage() {
  const [activeTab, setActiveTab] = useState<'discover' | 'myGroups'>('discover');
  const [selectedCategory, setSelectedCategory] = useState('All Groups');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    subject: '',
    description: '',
    maxMembers: '100',
    isPrivate: false,
    topics: '',
  });

  const filteredGroups = mockGroups.filter(g =>
    selectedCategory === 'All Groups' || g.subject === selectedCategory
  );

  const handleCreateGroup = () => {
    if (newGroup.name && newGroup.description) {
      setShowCreateModal(false);
      setNewGroup({ name: '', subject: '', description: '', maxMembers: '100', isPrivate: false, topics: '' });
    }
  };

  const getActivityColor = (activity: string) => {
    switch (activity) {
      case 'Very Active': return '#10b981';
      case 'Active': return '#3b82f6';
      case 'Moderate': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Study Groups</h1>
          <p className={styles.subtitle}>Learn together, grow together</p>
        </div>
        <button className={styles.createBtn} onClick={() => setShowCreateModal(true)}>
          + Create Group
        </button>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>👥</span>
          <div>
            <span className={styles.statValue}>{myGroups.length}</span>
            <span className={styles.statLabel}>My Groups</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📚</span>
          <div>
            <span className={styles.statValue}>156</span>
            <span className={styles.statLabel}>Total Members</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📅</span>
          <div>
            <span className={styles.statValue}>8</span>
            <span className={styles.statLabel}>Sessions This Week</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🏆</span>
          <div>
            <span className={styles.statValue}>Top 5%</span>
            <span className={styles.statLabel}>Learning Streak</span>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'discover' ? styles.tabActive : ''}`} onClick={() => setActiveTab('discover')}>
          🔍 Discover Groups
        </button>
        <button className={`${styles.tab} ${activeTab === 'myGroups' ? styles.tabActive : ''}`} onClick={() => setActiveTab('myGroups')}>
          ✅ My Groups ({myGroups.length})
        </button>
      </div>

      {activeTab === 'discover' && (
        <>
          <div className={styles.categories}>
            {categories.map(cat => (
              <button
                key={cat}
                className={`${styles.catBtn} ${selectedCategory === cat ? styles.catBtnActive : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className={styles.groupGrid}>
            {filteredGroups.map(group => (
              <div key={group.id} className={styles.groupCard}>
                <div className={styles.groupHeader} style={{ background: group.color }}>
                  {group.isPrivate && <span className={styles.privateBadge}>🔒 Private</span>}
                  <div className={styles.groupAvatar}>{group.avatar}</div>
                  <h3>{group.name}</h3>
                  <span className={styles.subjectBadge}>{group.subject}</span>
                </div>
                <div className={styles.groupBody}>
                  <p className={styles.groupDesc}>{group.description}</p>
                  <div className={styles.groupTopics}>
                    {group.topics.map(topic => (
                      <span key={topic} className={styles.topicTag}>{topic}</span>
                    ))}
                  </div>
                  <div className={styles.groupStats}>
                    <div className={styles.memberProgress}>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${(group.members / group.maxMembers) * 100}%` }}></div>
                      </div>
                      <span>{group.members}/{group.maxMembers}</span>
                    </div>
                    <div className={styles.nextSession}>
                      <span>📅 Next: {group.nextSession}</span>
                    </div>
                    <div className={styles.activityBadge} style={{ color: getActivityColor(group.activity) }}>
                      ● {group.activity}
                    </div>
                  </div>
                  <div className={styles.groupActions}>
                    <button className={styles.joinBtn}>Join Group</button>
                    <button className={styles.infoBtn}>Info</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'myGroups' && (
        <div className={styles.myGroups}>
          {myGroups.map(group => (
            <div key={group.id} className={styles.myGroupCard}>
              <div className={styles.myGroupHeader} style={{ background: group.color }}>
                <div className={styles.myGroupAvatar}>{group.avatar}</div>
                <div>
                  <h3>{group.name}</h3>
                  <span className={styles.subjectBadge}>{group.subject}</span>
                </div>
              </div>
              <div className={styles.myGroupBody}>
                <div className={styles.sessionInfo}>
                  <span className={styles.sessionTime}>📅 {group.nextSession}</span>
                  <span className={styles.memberCount}>👥 {group.members} members</span>
                </div>
                <div className={styles.groupTopics}>
                  {group.topics.map(topic => (
                    <span key={topic} className={styles.topicTag}>{topic}</span>
                  ))}
                </div>
                <div className={styles.groupActions}>
                  <button className={styles.sessionBtn}>Join Session</button>
                  <button className={styles.chatBtn}>💬 Chat</button>
                  <button className={styles.settingsBtn}>⚙️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className={styles.modal} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Create Study Group</h2>
            <p>Build a community around your learning goals</p>
            <div className={styles.formGroup}>
              <label>Group Name</label>
              <input
                type="text"
                placeholder="e.g., JEE 2026 Prep"
                value={newGroup.name}
                onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Subject/Course</label>
              <select
                value={newGroup.subject}
                onChange={(e) => setNewGroup(prev => ({ ...prev, subject: e.target.value }))}
              >
                <option value="">Select Subject</option>
                {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                rows={3}
                placeholder="What is this group about?"
                value={newGroup.description}
                onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Max Members</label>
                <select
                  value={newGroup.maxMembers}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, maxMembers: e.target.value }))}
                >
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                  <option value="500">500</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Topics (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g., Physics, Chemistry, Maths"
                  value={newGroup.topics}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, topics: e.target.value }))}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={newGroup.isPrivate}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, isPrivate: e.target.checked }))}
                />
                Make this group private (invite only)
              </label>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className={styles.submitBtn} onClick={handleCreateGroup}>Create Group</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
