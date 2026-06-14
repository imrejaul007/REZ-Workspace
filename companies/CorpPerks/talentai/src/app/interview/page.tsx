'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

const mockQuestions = {
  behavioral: [
    { id: 'b1', question: 'Tell me about a time you had to deal with a difficult team member.', type: 'behavioral', difficulty: 'Medium', tips: ['Use STAR method', 'Focus on your actions, not the problem'] },
    { id: 'b2', question: 'Describe a situation where you had to meet a tight deadline.', type: 'behavioral', difficulty: 'Medium', tips: ['Show prioritization skills', 'Highlight teamwork'] },
    { id: 'b3', question: 'Tell me about a time you made a mistake. How did you handle it?', type: 'behavioral', difficulty: 'Hard', tips: ['Be honest', 'Show learning mindset', 'Focus on resolution'] },
  ],
  technical: [
    { id: 't1', question: 'Explain the difference between useEffect and useLayoutEffect.', type: 'technical', difficulty: 'Medium', tips: ['Sync vs async', 'Browser painting', 'SSR considerations'] },
    { id: 't2', question: 'How would you optimize a React application with large lists?', type: 'technical', difficulty: 'Hard', tips: ['Virtualization', 'Memoization', 'Pagination'] },
    { id: 't3', question: 'What is the purpose of React.memo and when would you use it?', type: 'technical', difficulty: 'Easy', tips: ['Prevent unnecessary re-renders', 'Shallow comparison'] },
  ],
  system: [
    { id: 's1', question: 'Design a URL shortening service like Bitly.', type: 'system', difficulty: 'Hard', tips: ['Hash vs counter', 'Database schema', 'Rate limiting'] },
    { id: 's2', question: 'How would you design a real-time chat application?', type: 'system', difficulty: 'Medium', tips: ['WebSockets', 'Message queuing', 'Database choices'] },
    { id: 's3', question: 'Design an elevator system for a building.', type: 'system', difficulty: 'Medium', tips: ['State machine', 'Optimization', 'Edge cases'] },
  ],
};

const mockSessions = [
  { id: '1', role: 'Frontend Developer', company: 'TechCorp', date: 'May 20, 2026', duration: '45 min', score: 78, feedback: 'Good React knowledge, need to improve system design' },
  { id: '2', role: 'Senior Developer', company: 'StartupXYZ', date: 'May 15, 2026', duration: '60 min', score: 85, feedback: 'Excellent communication, strong technical skills' },
  { id: '3', role: 'Full Stack Engineer', company: 'BigTech', date: 'May 10, 2026', duration: '90 min', score: 72, feedback: 'Need more practice with behavioral questions' },
];

const companies = ['All', 'TechCorp', 'StartupXYZ', 'BigTech', 'Meta', 'Google', 'Amazon'];
const roles = ['Frontend Developer', 'Backend Developer', 'Full Stack', 'React Developer', 'System Design'];

export default function InterviewPrepPage() {
  const [activeTab, setActiveTab] = useState<'practice' | 'history' | 'resources'>('practice');
  const [selectedCategory, setSelectedCategory] = useState<'behavioral' | 'technical' | 'system'>('behavioral');
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [selectedRole, setSelectedRole] = useState('Frontend Developer');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);

  const questions = mockQuestions[selectedCategory];
  const currentQ = questions[currentQuestion];

  const startSession = () => {
    setSessionActive(true);
    setCurrentQuestion(0);
    setShowAnswer(false);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setShowAnswer(false);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setShowAnswer(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Link href="/dashboard" className={styles.backLink}>← Back to Dashboard</Link>
          <h1>Interview Coach</h1>
          <p className={styles.subtitle}>AI-powered mock interviews with instant feedback</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.startBtn} onClick={startSession}>
            ▶ Start Mock Interview
          </button>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📊</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>78%</span>
            <span className={styles.statLabel}>Avg. Score</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>✅</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>12</span>
            <span className={styles.statLabel}>Sessions Done</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🔥</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>5</span>
            <span className={styles.statLabel}>Day Streak</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>💬</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>45</span>
            <span className={styles.statLabel}>Questions Practiced</span>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'practice' ? styles.tabActive : ''}`} onClick={() => setActiveTab('practice')}>
          🎯 Practice Questions
        </button>
        <button className={`${styles.tab} ${activeTab === 'history' ? styles.tabActive : ''}`} onClick={() => setActiveTab('history')}>
          📜 Interview History
        </button>
        <button className={`${styles.tab} ${activeTab === 'resources' ? styles.tabActive : ''}`} onClick={() => setActiveTab('resources')}>
          📚 Resources
        </button>
      </div>

      {activeTab === 'practice' && (
        <div className={styles.practice}>
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <label>Category</label>
              <div className={styles.categoryBtns}>
                <button className={`${styles.catBtn} ${selectedCategory === 'behavioral' ? styles.catBtnActive : ''}`} onClick={() => setSelectedCategory('behavioral')}>
                  🎭 Behavioral
                </button>
                <button className={`${styles.catBtn} ${selectedCategory === 'technical' ? styles.catBtnActive : ''}`} onClick={() => setSelectedCategory('technical')}>
                  💻 Technical
                </button>
                <button className={`${styles.catBtn} ${selectedCategory === 'system' ? styles.catBtnActive : ''}`} onClick={() => setSelectedCategory('system')}>
                  🏗️ System Design
                </button>
              </div>
            </div>
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label>Company</label>
                <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}>
                  {companies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Role</label>
                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>

          {sessionActive ? (
            <div className={styles.session}>
              <div className={styles.sessionHeader}>
                <span className={styles.questionNum}>Question {currentQuestion + 1} of {questions.length}</span>
                <span className={styles.questionType}>{selectedCategory} • {currentQ.difficulty}</span>
                <button className={styles.endSessionBtn} onClick={() => setSessionActive(false)}>End Session</button>
              </div>

              <div className={styles.questionCard}>
                <h2>{currentQ.question}</h2>
                <div className={styles.questionMeta}>
                  <span className={`${styles.difficultyBadge} ${styles[`diff${currentQ.difficulty}`]}`}>
                    {currentQ.difficulty}
                  </span>
                </div>
              </div>

              <div className={styles.recordingSection}>
                <button className={`${styles.recordBtn} ${isRecording ? styles.recording : ''}`} onClick={() => setIsRecording(!isRecording)}>
                  {isRecording ? '⏹️ Stop Recording' : '🎤 Start Recording'}
                </button>
                <p className={styles.recordHint}>
                  {isRecording ? 'Recording your response...' : 'Record your answer for AI feedback'}
                </p>
              </div>

              <button className={styles.showAnswerBtn} onClick={() => setShowAnswer(!showAnswer)}>
                {showAnswer ? 'Hide Answer' : 'Show Sample Answer & Tips'}
              </button>

              {showAnswer && (
                <div className={styles.answerSection}>
                  <div className={styles.tips}>
                    <h3>💡 Tips</h3>
                    <ul>
                      {currentQ.tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={styles.sampleAnswer}>
                    <h3>📝 Sample Answer</h3>
                    <p>
                      &quot;Let me share an experience that demonstrates this skill. During my time at [Company],
                      I was working on a critical project with a tight deadline. Our team was facing challenges
                      with stakeholder alignment. I took the initiative to organize daily standups, created a
                      shared visibility board, and proactively communicated progress updates. By focusing on
                      clear communication and quick decision-making, we delivered the project on time and
                      exceeded the stakeholder expectations.&quot;
                    </p>
                  </div>
                </div>
              )}

              <div className={styles.sessionNav}>
                <button className={styles.navBtn} onClick={prevQuestion} disabled={currentQuestion === 0}>
                  ← Previous
                </button>
                <button className={styles.navBtn} onClick={nextQuestion} disabled={currentQuestion === questions.length - 1}>
                  Next →
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.questionList}>
              <h3>Practice Questions</h3>
              {questions.map((q, i) => (
                <div key={q.id} className={styles.questionItem}>
                  <div className={styles.questionInfo}>
                    <span className={styles.qNumber}>{i + 1}</span>
                    <span className={styles.qText}>{q.question}</span>
                  </div>
                  <div className={styles.questionActions}>
                    <span className={`${styles.difficultyBadge} ${styles[`diff${q.difficulty}`]}`}>
                      {q.difficulty}
                    </span>
                    <button className={styles.practiceBtn} onClick={() => { setCurrentQuestion(i); setSessionActive(true); }}>
                      Practice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className={styles.history}>
          <div className={styles.historyHeader}>
            <h2>Past Sessions</h2>
            <button className={styles.newSessionBtn}>+ New Session</button>
          </div>
          <div className={styles.sessionCards}>
            {mockSessions.map(session => (
              <div key={session.id} className={styles.sessionCard}>
                <div className={styles.sessionScore}>
                  <span className={styles.scoreValue}>{session.score}</span>
                  <span className={styles.scoreLabel}>Score</span>
                </div>
                <div className={styles.sessionDetails}>
                  <h3>{session.role}</h3>
                  <p className={styles.sessionCompany}>at {session.company}</p>
                  <div className={styles.sessionMeta}>
                    <span>📅 {session.date}</span>
                    <span>⏱️ {session.duration}</span>
                  </div>
                  <p className={styles.sessionFeedback}>{session.feedback}</p>
                </div>
                <div className={styles.sessionActions}>
                  <button className={styles.viewBtn}>View Details</button>
                  <button className={styles.retryBtn}>Retry</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'resources' && (
        <div className={styles.resources}>
          <div className={styles.resourceGrid}>
            <div className={styles.resourceCard}>
              <span className={styles.resourceIcon}>📖</span>
              <h3>STAR Method Guide</h3>
              <p>Master the framework for behavioral questions</p>
              <button className={styles.resourceBtn}>Read Guide</button>
            </div>
            <div className={styles.resourceCard}>
              <span className={styles.resourceIcon}>🎬</span>
              <h3>Video Tips</h3>
              <p>Watch expert interview tips and techniques</p>
              <button className={styles.resourceBtn}>Watch Now</button>
            </div>
            <div className={styles.resourceCard}>
              <span className={styles.resourceIcon}>📝</span>
              <h3>Cheat Sheet</h3>
              <p>Quick reference for common questions</p>
              <button className={styles.resourceBtn}>Download PDF</button>
            </div>
            <div className={styles.resourceCard}>
              <span className={styles.resourceIcon}>💼</span>
              <h3>Company Research</h3>
              <p>Learn about specific company cultures</p>
              <button className={styles.resourceBtn}>Explore</button>
            </div>
          </div>

          <div className={styles.tipSection}>
            <h3>🎯 Quick Tips for Your Next Interview</h3>
            <ul className={styles.tipsList}>
              <li>Practice out loud - speaking helps you organize thoughts</li>
              <li>Use the STAR method for behavioral questions</li>
              <li>Research the company culture and recent news</li>
              <li>Prepare 2-3 thoughtful questions for the interviewer</li>
              <li>Do a tech interview dry run before the real one</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
