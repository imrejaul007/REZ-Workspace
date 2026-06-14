'use client';

import { useState } from 'react';
import styles from './page.module.css';

const template = {
  personal: {
    name: 'Rahul Sharma',
    email: 'rahul.sharma@gmail.com',
    phone: '+91 98765 43210',
    linkedin: 'linkedin.com/in/rahulsharma',
    github: 'github.com/rahulsharma',
  },
  summary: 'Passionate frontend developer with 2+ years of experience in React, TypeScript, and Node.js. Looking for opportunities to work with innovative teams.',
  experience: [
    {
      title: 'Frontend Developer Intern',
      company: 'TechCorp India',
      duration: 'Jan 2024 - Present',
      description: 'Built responsive web applications using React and TypeScript.',
    },
  ],
  education: [
    {
      degree: 'B.Tech Computer Science',
      institution: 'IIT Delhi',
      year: '2025',
    },
  ],
  skills: ['React', 'TypeScript', 'Node.js', 'Python', 'MongoDB'],
};

export default function ResumeBuilderPage() {
  const [activeTab, setActiveTab] = useState('preview');
  const [resume, setResume] = useState(template);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Resume Builder</h1>
          <p>AI-powered resume that matches your profile</p>
        </div>
        <button className={styles.exportBtn}>Export PDF</button>
      </header>

      <div className={styles.content}>
        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'preview' ? styles.active : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'edit' ? styles.active : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            Edit
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'ai' ? styles.active : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            AI Suggestions
          </button>
        </div>

        {activeTab === 'preview' && (
          <div className={styles.preview}>
            {/* Resume Template */}
            <div className={styles.resume}>
              <header className={styles.resumeHeader}>
                <h2>{resume.personal.name}</h2>
                <div className={styles.contact}>
                  <span>{resume.personal.email}</span>
                  <span>{resume.personal.phone}</span>
                  <span>{resume.personal.linkedin}</span>
                </div>
              </header>

              <section className={styles.resumeSection}>
                <h3>Professional Summary</h3>
                <p>{resume.summary}</p>
              </section>

              <section className={styles.resumeSection}>
                <h3>Experience</h3>
                {resume.experience.map((exp, i) => (
                  <div key={i} className={styles.expItem}>
                    <div className={styles.expHeader}>
                      <strong>{exp.title}</strong>
                      <span>{exp.company}</span>
                    </div>
                    <span className={styles.duration}>{exp.duration}</span>
                    <p>{exp.description}</p>
                  </div>
                ))}
              </section>

              <section className={styles.resumeSection}>
                <h3>Education</h3>
                {resume.education.map((edu, i) => (
                  <div key={i} className={styles.eduItem}>
                    <strong>{edu.degree}</strong>
                    <span>{edu.institution} • {edu.year}</span>
                  </div>
                ))}
              </section>

              <section className={styles.resumeSection}>
                <h3>Skills</h3>
                <div className={styles.skills}>
                  {resume.skills.map((skill) => (
                    <span key={skill} className={styles.skillBadge}>{skill}</span>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'edit' && (
          <div className={styles.edit}>
            <div className={styles.formGroup}>
              <label>Full Name</label>
              <input
                type="text"
                value={resume.personal.name}
                onChange={(e) =>
                  setResume({
                    ...resume,
                    personal: { ...resume.personal, name: e.target.value },
                  })
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label>Professional Summary</label>
              <textarea
                value={resume.summary}
                onChange={(e) => setResume({ ...resume, summary: e.target.value })}
                rows={4}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Skills (comma separated)</label>
              <input
                type="text"
                value={resume.skills.join(', ')}
                onChange={(e) =>
                  setResume({
                    ...resume,
                    skills: e.target.value.split(',').map((s) => s.trim()),
                  })
                }
              />
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className={styles.aiSuggestions}>
            <div className={styles.aiCard}>
              <div className={styles.aiHeader}>
                <span>🤖</span>
                <h3>AI Suggestions</h3>
              </div>
              <ul className={styles.suggestions}>
                <li>Add AWS to your skills - 45% of React jobs require it</li>
                <li>Your summary is 15 words - aim for 30-50 words</li>
                <li>Consider adding GitHub projects section</li>
                <li>Add TypeScript years of experience</li>
              </ul>
              <button className={styles.applyAll}>Apply Suggestions</button>
            </div>

            <div className={styles.aiCard}>
              <div className={styles.aiHeader}>
                <span>📊</span>
                <h3>Match Score Analysis</h3>
              </div>
              <p>Based on your profile, you're a good match for:</p>
              <div className={styles.matchList}>
                <div className={styles.matchItem}>
                  <span>Frontend Developer</span>
                  <span className={styles.matchScore}>85%</span>
                </div>
                <div className={styles.matchItem}>
                  <span>React Developer</span>
                  <span className={styles.matchScore}>82%</span>
                </div>
                <div className={styles.matchItem}>
                  <span>Full Stack Developer</span>
                  <span className={styles.matchScore}>68%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
