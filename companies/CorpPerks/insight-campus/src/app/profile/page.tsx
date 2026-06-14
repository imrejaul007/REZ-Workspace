'use client';

import { useState } from 'react';
import styles from './page.module.css';

const mockProfile = {
  name: 'Rahul Sharma',
  email: 'rahul.sharma@iitd.ac.in',
  phone: '+91 98765 43210',
  college: 'IIT Delhi',
  course: 'B.Tech Computer Science',
  year: '4th Year',
  cgpa: '8.7',
  skills: ['React', 'Node.js', 'Python', 'Machine Learning', 'AWS'],
  bio: 'Passionate about building scalable web applications and exploring AI/ML solutions.',
  github: 'rahulsharma',
  linkedin: 'rahulsharma',
  portfolio: 'rahulsharma.dev',
  resume: 'Rahul_Sharma_Resume.pdf',
};

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'experience' | 'achievements'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(mockProfile);

  const handleSave = () => {
    setIsEditing(false);
  };

  const completionPercentage = 75;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.coverPhoto} />
        <div className={styles.profileInfo}>
          <div className={styles.avatar}>
            {profile.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className={styles.details}>
            <h1>{profile.name}</h1>
            <p>{profile.course} • {profile.year}</p>
            <p>{profile.college}</p>
          </div>
          <button onClick={() => setIsEditing(!isEditing)} className={styles.editBtn}>
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.sidebar}>
          <div className={styles.card}>
            <h3>Profile Completion</h3>
            <div className={styles.progressBar}>
              <div className={styles.progress} style={{ width: `${completionPercentage}%` }} />
            </div>
            <p>{completionPercentage}% Complete</p>
            {!isEditing && (
              <button className={styles.completeBtn}>Complete Your Profile</button>
            )}
          </div>

          <div className={styles.card}>
            <h3>Quick Stats</h3>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>85</span>
                <span className={styles.statLabel}>Profile Views</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>12</span>
                <span className={styles.statLabel}>Applications</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>4</span>
                <span className={styles.statLabel}>Interviews</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Contact Information</h3>
            {isEditing ? (
              <div className={styles.editForm}>
                <div>
                  <label>Email</label>
                  <input type="email" defaultValue={profile.email} />
                </div>
                <div>
                  <label>Phone</label>
                  <input type="tel" defaultValue={profile.phone} />
                </div>
                <div>
                  <label>GitHub</label>
                  <input type="text" defaultValue={profile.github} />
                </div>
                <div>
                  <label>LinkedIn</label>
                  <input type="text" defaultValue={profile.linkedin} />
                </div>
                <button onClick={handleSave} className={styles.saveBtn}>Save Changes</button>
              </div>
            ) : (
              <div className={styles.contactList}>
                <div>📧 {profile.email}</div>
                <div>📱 {profile.phone}</div>
                <div>💻 github.com/{profile.github}</div>
                <div>🔗 linkedin.com/in/{profile.linkedin}</div>
              </div>
            )}
          </div>

          <div className={styles.card}>
            <h3>Resume</h3>
            <div className={styles.resumePreview}>
              <span style={{ fontSize: 32 }}>📄</span>
              <div>
                <div style={{ fontWeight: 500 }}>{profile.resume}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Updated 2 days ago</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className={styles.updateBtn}>Update</button>
              <button className={styles.viewBtn}>View</button>
            </div>
          </div>
        </div>

        <div className={styles.main}>
          <div className={styles.tabs}>
            {(['overview', 'skills', 'experience', 'achievements'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={activeTab === tab ? styles.activeTab : styles.tab}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className={styles.section}>
              <div className={styles.card}>
                <h3>About Me</h3>
                {isEditing ? (
                  <textarea
                    defaultValue={profile.bio}
                    rows={4}
                    className={styles.textarea}
                  />
                ) : (
                  <p>{profile.bio}</p>
                )}
              </div>

              <div className={styles.card}>
                <h3>Education</h3>
                <div className={styles.educationItem}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>🎓</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{profile.college}</div>
                      <div style={{ color: '#6b7280' }}>{profile.course}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600 }}>CGPA: {profile.cgpa}/10</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>{profile.year}</div>
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <h3>Skills</h3>
                <div className={styles.skills}>
                  {profile.skills.map(skill => (
                    <span key={skill} className={styles.skill}>{skill}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <div className={styles.section}>
              <div className={styles.card}>
                <h3>Technical Skills</h3>
                <div className={styles.skillGrid}>
                  {[
                    { name: 'React / Next.js', level: 90 },
                    { name: 'Node.js', level: 85 },
                    { name: 'Python', level: 80 },
                    { name: 'Machine Learning', level: 70 },
                    { name: 'AWS / Cloud', level: 75 },
                    { name: 'Database (SQL/NoSQL)', level: 80 },
                  ].map(skill => (
                    <div key={skill.name} className={styles.skillBar}>
                      <div className={styles.skillHeader}>
                        <span>{skill.name}</span>
                        <span>{skill.level}%</span>
                      </div>
                      <div className={styles.skillProgress}>
                        <div style={{ width: `${skill.level}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.card}>
                <h3>Add New Skill</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Enter skill name"
                    className={styles.skillInput}
                  />
                  <button className={styles.addSkillBtn}>Add</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'experience' && (
            <div className={styles.section}>
              <div className={styles.card}>
                <h3>Work Experience</h3>
                {[
                  {
                    title: 'Software Engineering Intern',
                    company: 'Tech Corp',
                    period: 'May 2025 - Jul 2025',
                    desc: 'Developed REST APIs using Node.js and React frontend components.'
                  },
                  {
                    title: 'Teaching Assistant',
                    company: 'IIT Delhi',
                    period: 'Aug 2024 - Present',
                    desc: 'Assisted in Data Structures and Algorithms course for 200+ students.'
                  },
                ].map((exp, i) => (
                  <div key={i} className={styles.experienceItem}>
                    <div className={styles.expHeader}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{exp.title}</div>
                        <div style={{ color: '#10b981' }}>{exp.company}</div>
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>{exp.period}</div>
                    </div>
                    <p style={{ marginTop: 8 }}>{exp.desc}</p>
                  </div>
                ))}
              </div>

              <button className={styles.addBtn}>+ Add Experience</button>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className={styles.section}>
              <div className={styles.card}>
                <h3>Certifications</h3>
                <div className={styles.achievements}>
                  {[
                    { name: 'AWS Certified Developer', issuer: 'Amazon', date: 'Mar 2026' },
                    { name: 'Google Data Analytics', issuer: 'Google', date: 'Jan 2026' },
                    { name: 'Deep Learning Specialization', issuer: 'Coursera', date: 'Dec 2025' },
                  ].map((cert, i) => (
                    <div key={i} className={styles.achievementItem}>
                      <span style={{ fontSize: 24 }}>🏆</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{cert.name}</div>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>{cert.issuer} • {cert.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.card}>
                <h3>Projects</h3>
                <div className={styles.projects}>
                  {[
                    { name: 'E-Commerce Platform', tech: 'React, Node.js, MongoDB', stars: 45 },
                    { name: 'Image Classification API', tech: 'Python, TensorFlow', stars: 32 },
                    { name: 'Real-time Chat App', tech: 'Socket.io, Express', stars: 28 },
                  ].map((proj, i) => (
                    <div key={i} className={styles.projectItem}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{proj.name}</div>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>{proj.tech}</div>
                      </div>
                      <span>⭐ {proj.stars}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
