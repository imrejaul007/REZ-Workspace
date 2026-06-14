'use client';
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import styles from './page.module.css';

type Tab = 'profile' | 'notifications' | 'privacy' | 'preferences';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <>
      <Header title="Settings" subtitle="Manage your account preferences" />

      <div className={styles.container}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'notifications' ? styles.active : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'privacy' ? styles.active : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            Privacy
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'preferences' ? styles.active : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'profile' && (
            <div className={styles.section}>
              <h2>Profile Information</h2>
              <div className={styles.form}>
                <div className={styles.avatarSection}>
                  <div className={styles.avatar}>SJ</div>
                  <button className={styles.avatarBtn}>Change Photo</button>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Full Name</label>
                    <input type="text" defaultValue="Sarah Johnson" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Email</label>
                    <input type="email" defaultValue="sarah@email.com" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Phone</label>
                    <input type="tel" defaultValue="+91 98765 43210" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Location</label>
                    <input type="text" defaultValue="Bangalore, Karnataka" />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Bio</label>
                  <textarea rows={4} defaultValue="Frontend developer with 5+ years of experience building web applications." />
                </div>

                <button className={styles.saveBtn}>Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className={styles.section}>
              <h2>Notification Preferences</h2>
              <div className={styles.toggleList}>
                <div className={styles.toggleItem}>
                  <div>
                    <strong>Job Alerts</strong>
                    <p>Get notified when new jobs match your profile</p>
                  </div>
                  <label className={styles.toggle}>
                    <input type="checkbox" defaultChecked />
                    <span></span>
                  </label>
                </div>
                <div className={styles.toggleItem}>
                  <div>
                    <strong>Interview Reminders</strong>
                    <p>Reminders for upcoming mock interviews</p>
                  </div>
                  <label className={styles.toggle}>
                    <input type="checkbox" defaultChecked />
                    <span></span>
                  </label>
                </div>
                <div className={styles.toggleItem}>
                  <div>
                    <strong>Email Digest</strong>
                    <p>Weekly summary of career insights</p>
                  </div>
                  <label className={styles.toggle}>
                    <input type="checkbox" defaultChecked />
                    <span></span>
                  </label>
                </div>
                <div className={styles.toggleItem}>
                  <div>
                    <strong>Marketplace Messages</strong>
                    <p>Messages from service providers</p>
                  </div>
                  <label className={styles.toggle}>
                    <input type="checkbox" defaultChecked />
                    <span></span>
                  </label>
                </div>
                <div className={styles.toggleItem}>
                  <div>
                    <strong>Tips & Tutorials</strong>
                    <p>Career tips and feature tutorials</p>
                  </div>
                  <label className={styles.toggle}>
                    <input type="checkbox" />
                    <span></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className={styles.section}>
              <h2>Privacy Settings</h2>
              <div className={styles.toggleList}>
                <div className={styles.toggleItem}>
                  <div>
                    <strong>Profile Visibility</strong>
                    <p>Allow recruiters to find your profile</p>
                  </div>
                  <label className={styles.toggle}>
                    <input type="checkbox" defaultChecked />
                    <span></span>
                  </label>
                </div>
                <div className={styles.toggleItem}>
                  <div>
                    <strong>Show in Search Results</strong>
                    <p>Appear in CarresOS marketplace search</p>
                  </div>
                  <label className={styles.toggle}>
                    <input type="checkbox" defaultChecked />
                    <span></span>
                  </label>
                </div>
                <div className={styles.toggleItem}>
                  <div>
                    <strong>Activity Status</strong>
                    <p>Show when you're actively looking</p>
                  </div>
                  <label className={styles.toggle}>
                    <input type="checkbox" />
                    <span></span>
                  </label>
                </div>
              </div>

              <div className={styles.dangerZone}>
                <h3>Danger Zone</h3>
                <button className={styles.deleteBtn}>Delete Account</button>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className={styles.section}>
              <h2>Preferences</h2>
              <div className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Language</label>
                  <select defaultValue="en">
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="kn">Kannada</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Currency</label>
                  <select defaultValue="inr">
                    <option value="inr">Indian Rupee (₹)</option>
                    <option value="usd">US Dollar ($)</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Timezone</label>
                  <select defaultValue="asia-kolkata">
                    <option value="asia-kolkata">Asia/Kolkata (IST)</option>
                    <option value="america-ny">America/New_York (EST)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
