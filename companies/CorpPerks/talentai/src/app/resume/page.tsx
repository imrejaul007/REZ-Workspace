'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

const templatePresets = [
  { id: 'modern', name: 'Modern Pro', color: '#8b5cf6', desc: 'Clean, tech-focused design' },
  { id: 'classic', name: 'Classic', color: '#1e293b', desc: 'Traditional, formal style' },
  { id: 'creative', name: 'Creative', color: '#ec4899', desc: 'Bold, design-forward' },
  { id: 'minimal', name: 'Minimal', color: '#64748b', desc: 'Simple, distraction-free' },
];

const skillCategories = [
  { name: 'Frontend', skills: ['React', 'TypeScript', 'Next.js', 'Vue', 'Angular', 'HTML/CSS', 'Tailwind'] },
  { name: 'Backend', skills: ['Node.js', 'Python', 'Java', 'Go', 'PostgreSQL', 'MongoDB', 'GraphQL'] },
  { name: 'Cloud & DevOps', skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Linux'] },
  { name: 'AI/ML', skills: ['TensorFlow', 'PyTorch', 'OpenAI', 'LangChain', 'Computer Vision', 'NLP'] },
];

const mockExperiences = [
  { id: '1', company: 'TechCorp India', role: 'Senior Developer', period: '2022 - Present', desc: 'Led frontend architecture for enterprise dashboard. Improved load times by 40%.' },
  { id: '2', company: 'StartupXYZ', role: 'Full Stack Developer', period: '2020 - 2022', desc: 'Built scalable APIs serving 100K+ users. Mentored junior developers.' },
  { id: '3', company: 'CodeFactory', role: 'Junior Developer', period: '2018 - 2020', desc: 'Developed internal tools and automation scripts.' },
];

export default function ResumeBuilderPage() {
  const [activeTab, setActiveTab] = useState<'editor' | 'templates' | 'preview'>('editor');
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [personalInfo, setPersonalInfo] = useState({
    name: 'Rahul Sharma',
    title: 'Senior Full Stack Developer',
    email: 'rahul.sharma@email.com',
    phone: '+91 98765 43210',
    location: 'Bangalore, India',
    linkedin: 'linkedin.com/in/rahulsharma',
    summary: 'Passionate developer with 6+ years building scalable web applications. Strong in React, Node.js, and cloud architecture. Led teams of 5+ and delivered products used by 500K+ users.',
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'PostgreSQL']);
  const [experiences, setExperiences] = useState(mockExperiences);
  const [education, setEducation] = useState([
    { id: '1', school: 'IIT Delhi', degree: 'B.Tech Computer Science', period: '2014 - 2018', grade: '8.5 CGPA' },
  ]);
  const [atsScore, setAtsScore] = useState(87);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const addExperience = () => {
    setExperiences(prev => [...prev, {
      id: `${Date.now()}`,
      company: '',
      role: '',
      period: '',
      desc: ''
    }]);
  };

  const updateExperience = (id: string, field: string, value: string) => {
    setExperiences(prev => prev.map(exp =>
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const removeExperience = (id: string) => {
    setExperiences(prev => prev.filter(exp => exp.id !== id));
  };

  const template = templatePresets.find(t => t.id === selectedTemplate)!;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Link href="/dashboard" className={styles.backLink}>← Back to Dashboard</Link>
          <h1>AI Resume Builder</h1>
          <p className={styles.subtitle}>Create ATS-optimized resumes that get you hired</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.atsScore}>
            <span className={styles.atsLabel}>ATS Score</span>
            <span className={styles.atsValue} style={{ color: atsScore >= 80 ? '#10b981' : '#f59e0b' }}>{atsScore}%</span>
          </div>
          <button className={styles.downloadBtn}>📄 Download PDF</button>
          <button className={styles.saveBtn}>💾 Save</button>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'editor' ? styles.tabActive : ''}`} onClick={() => setActiveTab('editor')}>
          ✏️ Editor
        </button>
        <button className={`${styles.tab} ${activeTab === 'templates' ? styles.tabActive : ''}`} onClick={() => setActiveTab('templates')}>
          📋 Templates
        </button>
        <button className={`${styles.tab} ${activeTab === 'preview' ? styles.tabActive : ''}`} onClick={() => setActiveTab('preview')}>
          👁️ Preview
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'editor' && (
          <div className={styles.editor}>
            <div className={styles.editorMain}>
              <section className={styles.section}>
                <h2>Personal Information</h2>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Full Name</label>
                    <input value={personalInfo.name} onChange={e => setPersonalInfo(prev => ({ ...prev, name: e.target.value }))} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Professional Title</label>
                    <input value={personalInfo.title} onChange={e => setPersonalInfo(prev => ({ ...prev, title: e.target.value }))} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Email</label>
                    <input type="email" value={personalInfo.email} onChange={e => setPersonalInfo(prev => ({ ...prev, email: e.target.value }))} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Phone</label>
                    <input value={personalInfo.phone} onChange={e => setPersonalInfo(prev => ({ ...prev, phone: e.target.value }))} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Location</label>
                    <input value={personalInfo.location} onChange={e => setPersonalInfo(prev => ({ ...prev, location: e.target.value }))} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>LinkedIn</label>
                    <input value={personalInfo.linkedin} onChange={e => setPersonalInfo(prev => ({ ...prev, linkedin: e.target.value }))} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Professional Summary</label>
                  <textarea rows={3} value={personalInfo.summary} onChange={e => setPersonalInfo(prev => ({ ...prev, summary: e.target.value }))} />
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2>Work Experience</h2>
                  <button className={styles.addBtn} onClick={addExperience}>+ Add</button>
                </div>
                {experiences.map((exp, i) => (
                  <div key={exp.id} className={styles.experienceCard}>
                    <div className={styles.expNumber}>#{i + 1}</div>
                    <div className={styles.expFields}>
                      <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <label>Company</label>
                          <input value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} placeholder="Company name" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Role</label>
                          <input value={exp.role} onChange={e => updateExperience(exp.id, 'role', e.target.value)} placeholder="Your position" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Period</label>
                          <input value={exp.period} onChange={e => updateExperience(exp.id, 'period', e.target.value)} placeholder="2020 - Present" />
                        </div>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Description</label>
                        <textarea rows={2} value={exp.desc} onChange={e => updateExperience(exp.id, 'desc', e.target.value)} placeholder="Key achievements and responsibilities..." />
                      </div>
                    </div>
                    <button className={styles.removeBtn} onClick={() => removeExperience(exp.id)}>×</button>
                  </div>
                ))}
              </section>

              <section className={styles.section}>
                <h2>Education</h2>
                {education.map(edu => (
                  <div key={edu.id} className={styles.educationCard}>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label>Institution</label>
                        <input value={edu.school} onChange={e => setEducation(prev => prev.map(x => x.id === edu.id ? { ...x, school: e.target.value } : x))} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Degree</label>
                        <input value={edu.degree} onChange={e => setEducation(prev => prev.map(x => x.id === edu.id ? { ...x, degree: e.target.value } : x))} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Period</label>
                        <input value={edu.period} onChange={e => setEducation(prev => prev.map(x => x.id === edu.id ? { ...x, period: e.target.value } : x))} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Grade/GPA</label>
                        <input value={edu.grade} onChange={e => setEducation(prev => prev.map(x => x.id === edu.id ? { ...x, grade: e.target.value } : x))} />
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            </div>

            <div className={styles.editorSidebar}>
              <section className={styles.sidebarSection}>
                <h3>AI Suggestions</h3>
                <div className={styles.aiTips}>
                  <div className={styles.tip}>
                    <span className={styles.tipIcon}>💡</span>
                    <p>Add numbers to achievements: "40% faster" vs "faster"</p>
                  </div>
                  <div className={styles.tip}>
                    <span className={styles.tipIcon}>💡</span>
                    <p>Use action verbs: Led, Built, Increased, Reduced</p>
                  </div>
                  <div className={styles.tip}>
                    <span className={styles.tipIcon}>💡</span>
                    <p>Keep it to 2 pages max</p>
                  </div>
                </div>
              </section>

              <section className={styles.sidebarSection}>
                <h3>Keywords Found</h3>
                <div className={styles.keywordTags}>
                  {['React', 'TypeScript', 'Node.js', 'AWS', 'Team Lead', 'API'].map(kw => (
                    <span key={kw} className={styles.keywordTag}>{kw}</span>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className={styles.templates}>
            <h2>Choose a Template</h2>
            <p className={styles.templatesDesc}>Select a professional template optimized for ATS scanning</p>
            <div className={styles.templateGrid}>
              {templatePresets.map(t => (
                <div
                  key={t.id}
                  className={`${styles.templateCard} ${selectedTemplate === t.id ? styles.templateSelected : ''}`}
                  onClick={() => setSelectedTemplate(t.id)}
                >
                  <div className={styles.templatePreview} style={{ borderTopColor: t.color }}>
                    <div className={styles.previewHeader} style={{ background: t.color }}></div>
                    <div className={styles.previewLines}>
                      <div className={styles.previewLine} style={{ width: '60%' }}></div>
                      <div className={styles.previewLine} style={{ width: '80%' }}></div>
                      <div className={styles.previewLine} style={{ width: '40%' }}></div>
                    </div>
                  </div>
                  <div className={styles.templateInfo}>
                    <span className={styles.templateName}>{t.name}</span>
                    <span className={styles.templateDesc}>{t.desc}</span>
                  </div>
                  {selectedTemplate === t.id && <span className={styles.selectedBadge}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className={styles.preview}>
            <div className={styles.resumePreview} style={{ borderTopColor: template.color }}>
              <div className={styles.resumeHeader} style={{ background: `linear-gradient(135deg, ${template.color} 0%, ${template.color}dd 100%)` }}>
                <h1 style={{ color: 'white' }}>{personalInfo.name}</h1>
                <p style={{ color: 'rgba(255,255,255,0.9)' }}>{personalInfo.title}</p>
                <div className={styles.resumeContact}>
                  <span>{personalInfo.email}</span>
                  <span>{personalInfo.phone}</span>
                  <span>{personalInfo.location}</span>
                </div>
              </div>

              <div className={styles.resumeBody}>
                <section className={styles.resumeSection}>
                  <h2>Summary</h2>
                  <p>{personalInfo.summary}</p>
                </section>

                <section className={styles.resumeSection}>
                  <h2>Skills</h2>
                  <div className={styles.resumeSkills}>
                    {selectedSkills.map(skill => (
                      <span key={skill} className={styles.resumeSkill}>{skill}</span>
                    ))}
                  </div>
                </section>

                <section className={styles.resumeSection}>
                  <h2>Experience</h2>
                  {experiences.map(exp => (
                    <div key={exp.id} className={styles.resumeExp}>
                      <div className={styles.resumeExpHeader}>
                        <strong>{exp.role}</strong>
                        <span>{exp.period}</span>
                      </div>
                      <em>{exp.company}</em>
                      <p>{exp.desc}</p>
                    </div>
                  ))}
                </section>

                <section className={styles.resumeSection}>
                  <h2>Education</h2>
                  {education.map(edu => (
                    <div key={edu.id} className={styles.resumeEdu}>
                      <strong>{edu.school}</strong>
                      <p>{edu.degree} • {edu.period} • {edu.grade}</p>
                    </div>
                  ))}
                </section>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
