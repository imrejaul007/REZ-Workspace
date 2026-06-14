'use client';
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import styles from './page.module.css';

const questionTypes = [
  { id: 'behavioral', name: 'Behavioral', icon: '💬', count: 25 },
  { id: 'technical', name: 'Technical', icon: '💻', count: 40 },
  { id: 'system-design', name: 'System Design', icon: '🏗️', count: 15 },
  { id: 'leadership', name: 'Leadership', icon: '👔', count: 10 },
];

const recentSessions = [
  { role: 'Frontend Developer', company: 'TechCorp', score: 85, date: '2 hours ago', duration: '30 min' },
  { role: 'Senior Engineer', company: 'StartupXYZ', score: 72, date: '1 day ago', duration: '45 min' },
  { role: 'Tech Lead', company: 'BigTech', score: 68, date: '3 days ago', duration: '60 min' },
];

const mockQuestions = [
  {
    q: 'Tell me about a time you had to deal with a difficult team member.',
    type: 'behavioral',
    tips: ['Use STAR method', 'Focus on your actions and results', 'Keep it under 2 minutes'],
  },
  {
    q: 'How would you optimize the performance of a React application?',
    type: 'technical',
    tips: ['Mention memoization', 'Talk about code splitting', 'Discuss lazy loading'],
  },
  {
    q: 'Design a URL shortening service like bit.ly',
    type: 'system-design',
    tips: ['Cover scalability', 'Discuss caching strategy', 'Address sharding'],
  },
];

export default function InterviewPage() {
  const [selectedType, setSelectedType] = useState('behavioral');
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <>
      <Header title="Interview Coach" subtitle="AI-powered mock interviews with feedback" />

      <div className={styles.container}>
        <div className={styles.heroCard}>
          <div className={styles.heroLeft}>
            <h1>Ready to Ace Your Next Interview?</h1>
            <p>Practice with AI-powered mock interviews and get instant personalized feedback</p>
            <button className={styles.startBtn} onClick={() => setIsInterviewing(true)}>
              Start Mock Interview
            </button>
          </div>
          <div className={styles.heroRight}>
            <div className={styles.scoreCard}>
              <span className={styles.scoreNum}>85</span>
              <span className={styles.scoreLabel}>Avg Score</span>
              <span className={styles.scoreTrend}>↑ +12%</span>
            </div>
          </div>
        </div>

        <div className={styles.mainGrid}>
          <div className={styles.column}>
            <div className={styles.section}>
              <h2>Question Types</h2>
              <div className={styles.typeGrid}>
                {questionTypes.map((type) => (
                  <button
                    key={type.id}
                    className={`${styles.typeCard} ${selectedType === type.id ? styles.selected : ''}`}
                    onClick={() => setSelectedType(type.id)}
                  >
                    <span className={styles.typeIcon}>{type.icon}</span>
                    <span className={styles.typeName}>{type.name}</span>
                    <span className={styles.typeCount}>{type.count} Qs</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <h2>Practice Questions</h2>
              <div className={styles.questionList}>
                {mockQuestions
                  .filter((q) => q.type === selectedType || selectedType === 'behavioral')
                  .map((q, i) => (
                    <div key={i} className={styles.questionCard}>
                      <p className={styles.question}>{q.q}</p>
                      <div className={styles.questionTips}>
                        {q.tips.map((tip, j) => (
                          <span key={j} className={styles.tip}>
                            💡 {tip}
                          </span>
                        ))}
                      </div>
                      <button className={styles.practiceBtn}>Practice Answer</button>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.section}>
              <h2>Recent Sessions</h2>
              <div className={styles.sessionList}>
                {recentSessions.map((session, i) => (
                  <div key={i} className={styles.sessionCard}>
                    <div className={styles.sessionInfo}>
                      <strong>{session.role}</strong>
                      <span>{session.company}</span>
                      <span className={styles.sessionMeta}>
                        {session.date} • {session.duration}
                      </span>
                    </div>
                    <div
                      className={`${styles.sessionScore} ${
                        session.score >= 80 ? styles.good : session.score >= 70 ? styles.okay : styles.low
                      }`}
                    >
                      {session.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <h2>Tips for Today</h2>
              <div className={styles.tipsList}>
                <div className={styles.tipItem}>
                  <span className={styles.tipIcon}>🎯</span>
                  <p>Focus on quantifiable achievements in behavioral questions</p>
                </div>
                <div className={styles.tipItem}>
                  <span className={styles.tipIcon}>⏱️</span>
                  <p>Keep answers between 90 seconds and 2 minutes</p>
                </div>
                <div className={styles.tipItem}>
                  <span className={styles.tipIcon}>📝</span>
                  <p>Prepare 3-5 strong projects to discuss in depth</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isInterviewing && (
          <div className={styles.interviewModal}>
            <div className={styles.interviewContent}>
              <div className={styles.interviewHeader}>
                <span className={styles.interviewType}>{mockQuestions[currentQuestion].type}</span>
                <span className={styles.questionNum}>
                  Question {currentQuestion + 1} of {mockQuestions.length}
                </span>
                <button className={styles.closeBtn} onClick={() => setIsInterviewing(false)}>
                  ×
                </button>
              </div>
              <div className={styles.questionDisplay}>
                <h2>{mockQuestions[currentQuestion].q}</h2>
                <button className={styles.revealBtn} onClick={() => setShowAnswer(!showAnswer)}>
                  {showAnswer ? 'Hide Sample Answer' : 'Show Sample Answer'}
                </button>
                {showAnswer && (
                  <div className={styles.sampleAnswer}>
                    <p>
                      "I had a situation where a team member was consistently missing deadlines...
                      (Sample answer would appear here)"
                    </p>
                  </div>
                )}
              </div>
              <div className={styles.interviewActions}>
                <button
                  className={styles.navBtn}
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </button>
                <button
                  className={styles.navBtn}
                  onClick={() => {
                    if (currentQuestion < mockQuestions.length - 1) {
                      setCurrentQuestion(currentQuestion + 1);
                      setShowAnswer(false);
                    }
                  }}
                >
                  {currentQuestion < mockQuestions.length - 1 ? 'Next' : 'Finish'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
