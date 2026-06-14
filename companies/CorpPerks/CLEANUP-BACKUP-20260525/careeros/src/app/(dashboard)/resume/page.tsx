'use client';
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import styles from './page.module.css';

const templates = [
  { id: 'modern', name: 'Modern', preview: '🎨' },
  { id: 'classic', name: 'Classic', preview: '📝' },
  { id: 'minimal', name: 'Minimal', preview: '✨' },
  { id: 'creative', name: 'Creative', preview: '🌈' },
];

const tips = [
  'Use action verbs: "Developed", "Led", "Implemented"',
  'Quantify achievements: "Increased sales by 40%"',
  'Tailor keywords to match job descriptions',
  'Keep it to 1-2 pages maximum',
];

export default function ResumePage() {
  const [activeTab, setActiveTab] = useState<'build' | 'templates' | 'tips'>('build');
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [atsScore, setAtsScore] = useState(72);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setAtsScore(89);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <>
      <Header title="Resume Builder" subtitle="AI-powered resume crafting" />

      <div className={styles.container}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'build' ? styles.active : ''}`}
            onClick={() => setActiveTab('build')}
          >
            Build Resume
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'templates' ? styles.active : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            Templates
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'tips' ? styles.active : ''}`}
            onClick={() => setActiveTab('tips')}
          >
            Tips
          </button>
        </div>

        {activeTab === 'build' && (
          <div className={styles.buildSection}>
            <div className={styles.mainContent}>
              <div className={styles.formSection}>
                <h3>Personal Information</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Full Name</label>
                    <input type="text" placeholder="Sarah Johnson" defaultValue="Sarah Johnson" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Email</label>
                    <input type="email" placeholder="sarah@email.com" defaultValue="sarah.johnson@email.com" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Phone</label>
                    <input type="tel" placeholder="+91 98765 43210" defaultValue="+91 98765 43210" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Location</label>
                    <input type="text" placeholder="City, State" defaultValue="Bangalore, Karnataka" />
                  </div>
                </div>

                <h3>Professional Summary</h3>
                <textarea
                  className={styles.textarea}
                  placeholder="Write a compelling professional summary..."
                  defaultValue="Experienced frontend developer with 5+ years building scalable web applications. Passionate about user experience and clean code. Led development of award-winning e-commerce platform."
                  rows={4}
                />

                <h3>Work Experience</h3>
                <div className={styles.experienceItem}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Job Title</label>
                      <input type="text" defaultValue="Senior Frontend Developer" />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Company</label>
                      <input type="text" defaultValue="TechCorp India" />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Duration</label>
                      <input type="text" defaultValue="Jan 2022 - Present" />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Location</label>
                      <input type="text" defaultValue="Bangalore" />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Key Achievements</label>
                    <textarea
                      rows={3}
                      placeholder="Describe your key achievements..."
                      defaultValue="• Led development of React-based dashboard serving 1M+ users
• Reduced page load time by 40% through code optimization
• Mentored 4 junior developers and established coding standards"
                    />
                  </div>
                </div>

                <button className={styles.addBtn}>+ Add Another Experience</button>

                <h3>Skills</h3>
                <div className={styles.skillsInput}>
                  <div className={styles.skillTags}>
                    {['React', 'TypeScript', 'Node.js', 'GraphQL', 'CSS', 'Git'].map((skill) => (
                      <span key={skill} className={styles.skillTag}>
                        {skill} ×
                      </span>
                    ))}
                  </div>
                  <input type="text" placeholder="Add a skill..." />
                </div>

                <h3>Education</h3>
                <div className={styles.experienceItem}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Degree</label>
                      <input type="text" defaultValue="B.Tech in Computer Science" />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Institution</label>
                      <input type="text" defaultValue="IIT Delhi" />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Year</label>
                      <input type="text" defaultValue="2018" />
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button className={styles.secondaryBtn}>Save Draft</button>
                  <button
                    className={styles.primaryBtn}
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Analyzing...' : 'Generate with AI'}
                  </button>
                  <button className={styles.secondaryBtn}>Export PDF</button>
                </div>
              </div>

              <div className={styles.preview}>
                <div className={styles.previewHeader}>
                  <h3>Live Preview</h3>
                  <div className={styles.previewActions}>
                    <button>📥</button>
                    <button>🖨️</button>
                  </div>
                </div>
                <div className={styles.previewContent}>
                  <div className={styles.resumeDoc}>
                    <h1>SARAH JOHNSON</h1>
                    <p className={styles.contact}>sarah.johnson@email.com • +91 98765 43210 • Bangalore, Karnataka</p>
                    <hr />
                    <h2>PROFESSIONAL SUMMARY</h2>
                    <p>Experienced frontend developer with 5+ years building scalable web applications. Passionate about user experience and clean code.</p>
                    <h2>EXPERIENCE</h2>
                    <div className={styles.expEntry}>
                      <div className={styles.expHeader}>
                        <strong>Senior Frontend Developer</strong>
                        <span>TechCorp India</span>
                      </div>
                      <p className={styles.expMeta}>Jan 2022 - Present • Bangalore</p>
                      <ul>
                        <li>Led development of React-based dashboard serving 1M+ users</li>
                        <li>Reduced page load time by 40% through code optimization</li>
                      </ul>
                    </div>
                    <h2>SKILLS</h2>
                    <p>React, TypeScript, Node.js, GraphQL, CSS, Git</p>
                    <h2>EDUCATION</h2>
                    <p>B.Tech Computer Science, IIT Delhi, 2018</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className={styles.templatesSection}>
            <div className={styles.templatesGrid}>
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`${styles.templateCard} ${selectedTemplate === template.id ? styles.selected : ''}`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <div className={styles.templatePreview}>
                    <span className={styles.templateIcon}>{template.preview}</span>
                  </div>
                  <span className={styles.templateName}>{template.name}</span>
                  {selectedTemplate === template.id && (
                    <span className={styles.selectedBadge}>Selected</span>
                  )}
                </div>
              ))}
            </div>
            <div className={styles.templateActions}>
              <button className={styles.primaryBtn}>Apply Template</button>
            </div>
          </div>
        )}

        {activeTab === 'tips' && (
          <div className={styles.tipsSection}>
            <div className={styles.atsScore}>
              <div className={styles.scoreCircle}>
                <span className={styles.scoreValue}>{atsScore}%</span>
                <span className={styles.scoreLabel}>ATS Score</span>
              </div>
              <div className={styles.scoreInfo}>
                <h3>Your Resume ATS Score</h3>
                <p>
                  {atsScore >= 80
                    ? 'Great! Your resume is well-optimized for ATS systems.'
                    : atsScore >= 60
                    ? 'Good foundation, but there\'s room for improvement.'
                    : 'Your resume needs optimization to pass ATS filters.'}
                </p>
                <button className={styles.primaryBtn} onClick={() => setAtsScore(89)}>
                  Optimize Now
                </button>
              </div>
            </div>

            <div className={styles.tipsList}>
              <h3>Pro Tips for ATS Success</h3>
              {tips.map((tip, i) => (
                <div key={i} className={styles.tipCard}>
                  <span className={styles.tipNum}>{i + 1}</span>
                  <p>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
