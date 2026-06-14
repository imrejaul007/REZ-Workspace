'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function SettingsPage() {
  const [section, setSection] = useState('account');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const navItems = [
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'language', label: 'Language', icon: '🌐' },
  ];

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>

      <div className={styles.container}>
        <div className={styles.sidebar}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={section === item.id ? styles.activeNav : styles.nav}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {section === 'account' && (
            <div className={styles.card}>
              <h2>Account Settings</h2>

              <div className={styles.field}>
                <label>Full Name</label>
                <input type="text" defaultValue="Rahul Sharma" />
              </div>

              <div className={styles.field}>
                <label>Email Address</label>
                <input type="email" defaultValue="rahul.sharma@iitd.ac.in" />
                <span className={styles.hint}>Your email is verified ✓</span>
              </div>

              <div className={styles.field}>
                <label>Phone Number</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="tel" defaultValue="+91 98765 43210" style={{ flex: 1 }} />
                  <button className={styles.verifyBtn}>Change</button>
                </div>
              </div>

              <div className={styles.divider} />

              <h3>Change Password</h3>
              <div className={styles.field}>
                <label>Current Password</label>
                <input type="password" placeholder="Enter current password" />
              </div>
              <div className={styles.field}>
                <label>New Password</label>
                <input type="password" placeholder="Enter new password" />
              </div>
              <div className={styles.field}>
                <label>Confirm New Password</label>
                <input type="password" placeholder="Confirm new password" />
              </div>

              <button onClick={handleSave} className={styles.saveBtn}>
                {saved ? '✓ Saved' : 'Save Changes'}
              </button>
            </div>
          )}

          {section === 'privacy' && (
            <div className={styles.card}>
              <h2>Privacy Settings</h2>

              <div className={styles.toggle}>
                <div>
                  <div className={styles.toggleLabel}>Profile Visibility</div>
                  <div className={styles.toggleDesc}>Allow recruiters to view your profile</div>
                </div>
                <input type="checkbox" defaultChecked />
              </div>

              <div className={styles.toggle}>
                <div>
                  <div className={styles.toggleLabel}>Show Online Status</div>
                  <div className={styles.toggleDesc}>Let others see when you're online</div>
                </div>
                <input type="checkbox" defaultChecked />
              </div>

              <div className={styles.toggle}>
                <div>
                  <div className={styles.toggleLabel}>Activity Status</div>
                  <div className={styles.toggleDesc}>Show your learning activity to connections</div>
                </div>
                <input type="checkbox" />
              </div>

              <div className={styles.divider} />

              <h3>Data & Privacy</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className={styles.dangerBtn}>Download My Data</button>
                <button className={styles.dangerBtn}>Delete Account</button>
              </div>
            </div>
          )}

          {section === 'notifications' && (
            <div className={styles.card}>
              <h2>Notification Preferences</h2>

              <h3>Email Notifications</h3>
              <div className={styles.toggle}>
                <div>
                  <div className={styles.toggleLabel}>Course Updates</div>
                  <div className={styles.toggleDesc}>New content, assignments, deadlines</div>
                </div>
                <input type="checkbox" defaultChecked />
              </div>
              <div className={styles.toggle}>
                <div>
                  <div className={styles.toggleLabel}>Job Alerts</div>
                  <div className={styles.toggleDesc}>New jobs matching your profile</div>
                </div>
                <input type="checkbox" defaultChecked />
              </div>
              <div className={styles.toggle}>
                <div>
                  <div className={styles.toggleLabel}>Weekly Digest</div>
                  <div className={styles.toggleDesc}>Summary of your learning progress</div>
                </div>
                <input type="checkbox" defaultChecked />
              </div>

              <div className={styles.divider} />

              <h3>Push Notifications</h3>
              <div className={styles.toggle}>
                <div>
                  <div className={styles.toggleLabel}>Application Updates</div>
                  <div className={styles.toggleDesc}>Status changes in your applications</div>
                </div>
                <input type="checkbox" defaultChecked />
              </div>
              <div className={styles.toggle}>
                <div>
                  <div className={styles.toggleLabel}>Messages</div>
                  <div className={styles.toggleDesc}>New messages from mentors & recruiters</div>
                </div>
                <input type="checkbox" defaultChecked />
              </div>

              <button onClick={handleSave} className={styles.saveBtn}>
                {saved ? '✓ Saved' : 'Save Preferences'}
              </button>
            </div>
          )}

          {section === 'appearance' && (
            <div className={styles.card}>
              <h2>Appearance</h2>

              <div className={styles.field}>
                <label>Theme</label>
                <div className={styles.themeOptions}>
                  {['Light', 'Dark', 'System'].map(theme => (
                    <div key={theme} className={styles.themeOption}>
                      <div style={{
                        width: 80,
                        height: 60,
                        background: theme === 'Dark' ? '#1f2937' : '#ffffff',
                        border: '2px solid #e5e7eb',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}>
                        {theme === 'Light' && '☀️'}
                        {theme === 'Dark' && '🌙'}
                        {theme === 'System' && '💻'}
                      </div>
                      <span>{theme}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label>Font Size</label>
                <select defaultValue="medium">
                  <option value="small">Small</option>
                  <option value="medium">Medium (Recommended)</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <button onClick={handleSave} className={styles.saveBtn}>
                {saved ? '✓ Saved' : 'Apply Changes'}
              </button>
            </div>
          )}

          {section === 'language' && (
            <div className={styles.card}>
              <h2>Language & Region</h2>

              <div className={styles.field}>
                <label>Language</label>
                <select defaultValue="en">
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="te">తెలుగు (Telugu)</option>
                  <option value="bn">বাংলা (Bengali)</option>
                  <option value="mr">मराठी (Marathi)</option>
                </select>
              </div>

              <div className={styles.field}>
                <label>Country / Region</label>
                <select defaultValue="in">
                  <option value="in">India</option>
                  <option value="us">United States</option>
                  <option value="uk">United Kingdom</option>
                  <option value="sg">Singapore</option>
                  <option value="ae">UAE</option>
                </select>
              </div>

              <div className={styles.field}>
                <label>Timezone</label>
                <select defaultValue="asia-kolkata">
                  <option value="asia-kolkata">Asia/Kolkata (IST)</option>
                  <option value="asia-dubai">Asia/Dubai (GST)</option>
                  <option value="asia-singapore">Asia/Singapore (SGT)</option>
                  <option value="america-new-york">America/New_York (EST)</option>
                </select>
              </div>

              <button onClick={handleSave} className={styles.saveBtn}>
                {saved ? '✓ Saved' : 'Save Preferences'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
