'use client';

import { useState } from 'react';
import styles from './page.module.css';

const mockQuestions = [
  {
    id: '1',
    title: 'How does recursion work in Python?',
    subject: 'Computer Science',
    description: 'I am confused about how recursive functions work. Can someone explain with an example?',
    author: 'Priya Sharma',
    avatar: 'PS',
    upvotes: 24,
    answers: 5,
    views: 156,
    solved: true,
    tags: ['Python', 'Recursion', 'Programming'],
    time: '2 hours ago',
  },
  {
    id: '2',
    title: 'Best way to prepare for JEE Advanced 2026?',
    subject: 'Engineering Entrance',
    description: 'Looking for study strategies and important topics to focus on for JEE Advanced.',
    author: 'Rahul Verma',
    avatar: 'RV',
    upvotes: 18,
    answers: 8,
    views: 234,
    solved: false,
    tags: ['JEE', 'Study Tips', 'Physics', 'Chemistry'],
    time: '4 hours ago',
  },
  {
    id: '3',
    title: 'Understanding Big O notation for interviews',
    subject: 'Data Structures',
    description: 'Can someone explain Big O, Big Theta, and Big Omega with practical examples?',
    author: 'Sneha Patel',
    avatar: 'SP',
    upvotes: 31,
    answers: 6,
    views: 312,
    solved: true,
    tags: ['DSA', 'Algorithms', 'Interview Prep'],
    time: '1 day ago',
  },
  {
    id: '4',
    title: 'How to write a compelling college essay?',
    subject: 'Admissions',
    description: 'Need tips on writing a standout essay for Ivy League applications.',
    author: 'Amit Kumar',
    avatar: 'AK',
    upvotes: 15,
    answers: 3,
    views: 89,
    solved: false,
    tags: ['College Admissions', 'Essay Writing', 'USA'],
    time: '6 hours ago',
  },
  {
    id: '5',
    title: 'Organic Chemistry Reaction Mechanisms',
    subject: 'Chemistry',
    description: 'Struggling with SN1, SN2, E1, E2 reactions. How do I remember all the conditions?',
    author: 'Neha Singh',
    avatar: 'NS',
    upvotes: 22,
    answers: 7,
    views: 198,
    solved: true,
    tags: ['Chemistry', 'Organic', 'NEET'],
    time: '3 hours ago',
  },
];

const subjects = ['All Subjects', 'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Engineering Entrance', 'Admissions'];
const topExperts = [
  { name: 'Dr. Rajesh Kumar', expertise: 'Computer Science', solved: 1234, rating: 4.9 },
  { name: 'Prof. Meera Singh', expertise: 'Mathematics', solved: 987, rating: 4.8 },
  { name: 'Arjun Nair', expertise: 'Physics', solved: 756, rating: 4.7 },
];

export default function AskQuestionsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'unsolved' | 'following'>('all');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [showAskModal, setShowAskModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ title: '', subject: '', description: '', tags: '' });

  const filteredQuestions = mockQuestions.filter(q =>
    selectedSubject === 'All Subjects' || q.subject === selectedSubject
  );

  const handleAskQuestion = () => {
    if (newQuestion.title && newQuestion.description) {
      setShowAskModal(false);
      setNewQuestion({ title: '', subject: '', description: '', tags: '' });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Doubt Solving</h1>
          <p className={styles.subtitle}>Get answers from experts and peers</p>
        </div>
        <button className={styles.askBtn} onClick={() => setShowAskModal(true)}>
          + Ask a Question
        </button>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>❓</span>
          <div>
            <span className={styles.statValue}>2,456</span>
            <span className={styles.statLabel}>Questions Asked</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>✅</span>
          <div>
            <span className={styles.statValue}>89%</span>
            <span className={styles.statLabel}>Solved Rate</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>⏱️</span>
          <div>
            <span className={styles.statValue}>2.5 hrs</span>
            <span className={styles.statLabel}>Avg Response</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>👨‍🏫</span>
          <div>
            <span className={styles.statValue}>156</span>
            <span className={styles.statLabel}>Active Experts</span>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.main}>
          <div className={styles.filters}>
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`} onClick={() => setActiveTab('all')}>
                All Questions
              </button>
              <button className={`${styles.tab} ${activeTab === 'unsolved' ? styles.tabActive : ''}`} onClick={() => setActiveTab('unsolved')}>
                Unsolved
              </button>
              <button className={`${styles.tab} ${activeTab === 'following' ? styles.tabActive : ''}`} onClick={() => setActiveTab('following')}>
                Following
              </button>
            </div>
            <select className={styles.subjectFilter} value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className={styles.questionList}>
            {filteredQuestions.map(question => (
              <div key={question.id} className={styles.questionCard}>
                <div className={styles.voteSection}>
                  <button className={styles.upvoteBtn}>▲</button>
                  <span className={styles.voteCount}>{question.upvotes}</span>
                </div>
                <div className={styles.questionContent}>
                  <div className={styles.questionHeader}>
                    <h3>{question.title}</h3>
                    {question.solved && <span className={styles.solvedBadge}>✓ Solved</span>}
                  </div>
                  <p className={styles.questionDesc}>{question.description}</p>
                  <div className={styles.questionTags}>
                    {question.tags.map(tag => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                  <div className={styles.questionMeta}>
                    <div className={styles.author}>
                      <span className={styles.avatar}>{question.avatar}</span>
                      <span>{question.author}</span>
                    </div>
                    <span className={styles.subjectBadge}>{question.subject}</span>
                    <span className={styles.metaItem}>💬 {question.answers}</span>
                    <span className={styles.metaItem}>👁️ {question.views}</span>
                    <span className={styles.time}>{question.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            <h3>Top Experts</h3>
            <div className={styles.expertList}>
              {topExperts.map((expert, i) => (
                <div key={i} className={styles.expertCard}>
                  <div className={styles.expertAvatar}>{expert.name.split(' ').map(n => n[0]).join('')}</div>
                  <div className={styles.expertInfo}>
                    <span className={styles.expertName}>{expert.name}</span>
                    <span className={styles.expertExpertise}>{expert.expertise}</span>
                    <span className={styles.expertStats}>✓ {expert.solved} solved • ⭐ {expert.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <h3>Popular Topics</h3>
            <div className={styles.topicList}>
              {['JEE Preparation', 'Python Programming', 'Maths Calculus', 'Physics Mechanics', 'NEET Biology'].map((topic, i) => (
                <button key={i} className={styles.topicBtn}>{topic}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showAskModal && (
        <div className={styles.modal} onClick={() => setShowAskModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Ask a Question</h2>
            <p>Get help from our community of experts and students</p>
            <div className={styles.formGroup}>
              <label>Question Title</label>
              <input
                type="text"
                placeholder="What is your question?"
                value={newQuestion.title}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Subject</label>
              <select
                value={newQuestion.subject}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, subject: e.target.value }))}
              >
                <option value="">Select Subject</option>
                {subjects.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                rows={5}
                placeholder="Describe your question in detail..."
                value={newQuestion.description}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Tags (comma separated)</label>
              <input
                type="text"
                placeholder="e.g., Python, Programming, Basics"
                value={newQuestion.tags}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, tags: e.target.value }))}
              />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowAskModal(false)}>Cancel</button>
              <button className={styles.submitBtn} onClick={handleAskQuestion}>Post Question</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
