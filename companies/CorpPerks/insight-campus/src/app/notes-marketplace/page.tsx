'use client';

import { useState } from 'react';
import styles from './page.module.css';

const mockNotes = [
  {
    id: '1',
    title: 'Complete Physics Class 12 Notes - Module 1-5',
    subject: 'Physics',
    type: 'Handwritten',
    pages: 156,
    price: 299,
    originalPrice: 599,
    rating: 4.8,
    reviews: 234,
    downloads: 1567,
    thumbnail: '📘',
    seller: 'Priya Sharma',
    sellerAvatar: 'PS',
    preview: 'Available',
    university: 'IIT Delhi',
    tags: ['Class 12', 'Physics', 'JEE', 'Board Exam'],
    featured: true,
  },
  {
    id: '2',
    title: 'Python Programming Complete Notes with Examples',
    subject: 'Computer Science',
    type: 'Digital',
    pages: 89,
    price: 149,
    originalPrice: 299,
    rating: 4.6,
    reviews: 156,
    downloads: 2341,
    thumbnail: '💻',
    seller: 'Rahul Verma',
    sellerAvatar: 'RV',
    preview: 'Available',
    university: 'NIT Trichy',
    tags: ['Python', 'Programming', 'Basics', 'Beginner'],
    featured: false,
  },
  {
    id: '3',
    title: 'Organic Chemistry Reactions & Mechanisms',
    subject: 'Chemistry',
    type: 'Handwritten',
    pages: 78,
    price: 199,
    originalPrice: 399,
    rating: 4.9,
    reviews: 412,
    downloads: 3456,
    thumbnail: '⚗️',
    seller: 'Dr. Amit Kumar',
    sellerAvatar: 'AK',
    preview: 'Available',
    university: 'AIIMS',
    tags: ['Organic Chemistry', 'NEET', 'Reactions'],
    featured: true,
  },
  {
    id: '4',
    title: 'Advanced Data Structures & Algorithms Notes',
    subject: 'Computer Science',
    type: 'Digital',
    pages: 134,
    price: 399,
    originalPrice: 799,
    rating: 4.7,
    reviews: 89,
    downloads: 876,
    thumbnail: '📊',
    seller: 'Sneha Patel',
    sellerAvatar: 'SP',
    preview: 'Available',
    university: 'IIIT Hyderabad',
    tags: ['DSA', 'Algorithms', 'Interview Prep', 'Advanced'],
    featured: false,
  },
  {
    id: '5',
    title: 'Mathematics Calculus & Differential Equations',
    subject: 'Mathematics',
    type: 'Handwritten',
    pages: 112,
    price: 249,
    originalPrice: 499,
    rating: 4.5,
    reviews: 178,
    downloads: 1234,
    thumbnail: '📐',
    seller: 'Neha Singh',
    sellerAvatar: 'NS',
    preview: 'Available',
    university: 'IIT Bombay',
    tags: ['Calculus', 'Maths', 'JEE', 'Board Exam'],
    featured: false,
  },
  {
    id: '6',
    title: 'Machine Learning Complete Course Notes',
    subject: 'AI/ML',
    type: 'Digital',
    pages: 203,
    price: 599,
    originalPrice: 1199,
    rating: 4.8,
    reviews: 67,
    downloads: 543,
    thumbnail: '🤖',
    seller: 'Vikram Rao',
    sellerAvatar: 'VR',
    preview: 'Available',
    university: 'Stanford Online',
    tags: ['ML', 'AI', 'Python', 'Advanced'],
    featured: true,
  },
];

const subjects = ['All Subjects', 'Physics', 'Chemistry', 'Mathematics', 'Computer Science', 'Biology', 'AI/ML'];
const sortOptions = ['Most Popular', 'Newest', 'Price: Low to High', 'Price: High to Low', 'Highest Rated'];

export default function NotesMarketplacePage() {
  const [activeTab, setActiveTab] = useState<'all' | 'purchased' | 'myList'>('all');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [sortBy, setSortBy] = useState('Most Popular');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    subject: '',
    type: 'Digital',
    pages: '',
    price: '',
    description: '',
  });

  const filteredNotes = mockNotes.filter(n =>
    selectedSubject === 'All Subjects' || n.subject === selectedSubject
  ).filter(n => n.price >= priceRange[0] && n.price <= priceRange[1]);

  const handleUpload = () => {
    if (newNote.title && newNote.price) {
      setShowUploadModal(false);
      setNewNote({ title: '', subject: '', type: 'Digital', pages: '', price: '', description: '' });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Notes Marketplace</h1>
          <p className={styles.subtitle}>Buy and sell study notes from top students</p>
        </div>
        <button className={styles.uploadBtn} onClick={() => setShowUploadModal(true)}>
          + Sell Your Notes
        </button>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📚</span>
          <div>
            <span className={styles.statValue}>5,678</span>
            <span className={styles.statLabel}>Notes Available</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📥</span>
          <div>
            <span className={styles.statValue}>45K+</span>
            <span className={styles.statLabel}>Downloads</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>💰</span>
          <div>
            <span className={styles.statValue}>₹12L+</span>
            <span className={styles.statLabel}>Earned by Sellers</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>⭐</span>
          <div>
            <span className={styles.statValue}>4.7</span>
            <span className={styles.statLabel}>Avg Rating</span>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`} onClick={() => setActiveTab('all')}>
          🛒 Browse Notes
        </button>
        <button className={`${styles.tab} ${activeTab === 'purchased' ? styles.tabActive : ''}`} onClick={() => setActiveTab('purchased')}>
          📥 My Purchases
        </button>
        <button className={`${styles.tab} ${activeTab === 'myList' ? styles.tabActive : ''}`} onClick={() => setActiveTab('myList')}>
          ❤️ Wishlist
        </button>
      </div>

      {activeTab === 'all' && (
        <>
          <div className={styles.filters}>
            <div className={styles.filterLeft}>
              <select className={styles.filterSelect} value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className={styles.filterSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {sortOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.priceFilter}>
              <span>Price:</span>
              <input
                type="range"
                min={0}
                max={1000}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className={styles.priceSlider}
              />
              <span>₹0 - ₹{priceRange[1]}</span>
            </div>
          </div>

          <div className={styles.featured}>
            <h2>Featured Notes</h2>
            <div className={styles.featuredGrid}>
              {mockNotes.filter(n => n.featured).map(note => (
                <div key={note.id} className={styles.featuredCard}>
                  <div className={styles.featuredThumb}>{note.thumbnail}</div>
                  <div className={styles.featuredInfo}>
                    <span className={styles.featuredBadge}>⭐ Featured</span>
                    <h3>{note.title}</h3>
                    <p>{note.subject} • {note.pages} pages • {note.type}</p>
                    <div className={styles.featuredPrice}>
                      <span className={styles.finalPrice}>₹{note.price}</span>
                      <span className={styles.originalPrice}>₹{note.originalPrice}</span>
                      <span className={styles.discount}>{Math.round((1 - note.price / note.originalPrice) * 100)}% off</span>
                    </div>
                    <button className={styles.buyBtn}>Buy Now</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.notesSection}>
            <h2>All Notes</h2>
            <div className={styles.notesGrid}>
              {filteredNotes.map(note => (
                <div key={note.id} className={styles.noteCard}>
                  <div className={styles.noteThumb}>
                    <span className={styles.thumbEmoji}>{note.thumbnail}</span>
                    <span className={styles.typeBadge}>{note.type}</span>
                  </div>
                  <div className={styles.noteInfo}>
                    <h3>{note.title}</h3>
                    <div className={styles.noteMeta}>
                      <span className={styles.subjectBadge}>{note.subject}</span>
                      <span>{note.pages} pages</span>
                    </div>
                    <div className={styles.noteRating}>
                      <span>⭐ {note.rating}</span>
                      <span>({note.reviews})</span>
                      <span>• {note.downloads} downloads</span>
                    </div>
                    <div className={styles.sellerInfo}>
                      <span className={styles.sellerAvatar}>{note.sellerAvatar}</span>
                      <span>{note.seller}</span>
                      <span className={styles.university}>• {note.university}</span>
                    </div>
                    <div className={styles.notePrice}>
                      <span className={styles.finalPrice}>₹{note.price}</span>
                      <span className={styles.originalPrice}>₹{note.originalPrice}</span>
                      <button className={styles.addToCart}>🛒</button>
                      <button className={styles.wishlist}>♡</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'purchased' && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📥</span>
          <h3>No purchases yet</h3>
          <p>Notes you purchase will appear here</p>
          <button className={styles.browseBtn}>Browse Notes</button>
        </div>
      )}

      {activeTab === 'myList' && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>❤️</span>
          <h3>Your wishlist is empty</h3>
          <p>Save notes you like for later</p>
          <button className={styles.browseBtn}>Browse Notes</button>
        </div>
      )}

      {showUploadModal && (
        <div className={styles.modal} onClick={() => setShowUploadModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Sell Your Notes</h2>
            <p>Share your knowledge and earn money</p>
            <div className={styles.formGroup}>
              <label>Title</label>
              <input
                type="text"
                placeholder="e.g., Complete Physics Notes"
                value={newNote.title}
                onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Subject</label>
                <select
                  value={newNote.subject}
                  onChange={(e) => setNewNote(prev => ({ ...prev, subject: e.target.value }))}
                >
                  <option value="">Select</option>
                  {subjects.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Type</label>
                <select
                  value={newNote.type}
                  onChange={(e) => setNewNote(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="Digital">Digital</option>
                  <option value="Handwritten">Handwritten</option>
                </select>
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Pages</label>
                <input
                  type="number"
                  placeholder="e.g., 50"
                  value={newNote.pages}
                  onChange={(e) => setNewNote(prev => ({ ...prev, pages: e.target.value }))}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Price (₹)</label>
                <input
                  type="number"
                  placeholder="e.g., 199"
                  value={newNote.price}
                  onChange={(e) => setNewNote(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                rows={3}
                placeholder="Describe your notes..."
                value={newNote.description}
                onChange={(e) => setNewNote(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className={styles.uploadArea}>
              <span>📄</span>
              <p>Drag & drop files here or click to upload</p>
              <span className={styles.uploadHint}>PDF, JPG, PNG up to 50MB</span>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowUploadModal(false)}>Cancel</button>
              <button className={styles.submitBtn} onClick={handleUpload}>Upload Notes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
