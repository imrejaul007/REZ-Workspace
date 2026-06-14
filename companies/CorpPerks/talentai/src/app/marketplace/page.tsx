'use client';
import { useState } from 'react';
import styles from './page.module.css';

const services = [
  {
    id: 1,
    title: 'React Development',
    provider: 'Rahul Sharma',
    rating: 4.9,
    reviews: 127,
    price: 500,
    unit: 'hour',
    location: '2.3 km away',
    skills: ['React', 'TypeScript', 'Next.js'],
    verified: true,
    available: true,
    image: '👨‍💻',
  },
  {
    id: 2,
    title: 'UI/UX Design',
    provider: 'Priya Patel',
    rating: 4.8,
    reviews: 89,
    price: 400,
    unit: 'hour',
    location: '1.5 km away',
    skills: ['Figma', 'Adobe XD', 'Prototyping'],
    verified: true,
    available: true,
    image: '🎨',
  },
  {
    id: 3,
    title: 'Logo Design',
    provider: 'Amit Kumar',
    rating: 4.7,
    reviews: 56,
    price: 1500,
    unit: 'project',
    location: '3.1 km away',
    skills: ['Illustrator', 'Branding', 'Logo'],
    verified: false,
    available: true,
    image: '✏️',
  },
  {
    id: 4,
    title: 'Content Writing',
    provider: 'Sneha Reddy',
    rating: 5.0,
    reviews: 42,
    price: 300,
    unit: 'hour',
    location: '0.8 km away',
    skills: ['Copywriting', 'SEO', 'Blog'],
    verified: true,
    available: false,
    image: '✍️',
  },
  {
    id: 5,
    title: 'Video Editing',
    provider: 'Vikram Singh',
    rating: 4.6,
    reviews: 78,
    price: 600,
    unit: 'hour',
    location: '4.2 km away',
    skills: ['Premiere Pro', 'After Effects', 'DaVinci'],
    verified: true,
    available: true,
    image: '🎬',
  },
  {
    id: 6,
    title: 'Data Analysis',
    provider: 'Meera Joshi',
    rating: 4.9,
    reviews: 63,
    price: 700,
    unit: 'hour',
    location: '2.9 km away',
    skills: ['Python', 'SQL', 'Tableau'],
    verified: true,
    available: true,
    image: '📊',
  },
];

const categories = [
  { name: 'All', icon: '🛍️', count: 156 },
  { name: 'Development', icon: '💻', count: 45 },
  { name: 'Design', icon: '🎨', count: 32 },
  { name: 'Writing', icon: '✍️', count: 28 },
  { name: 'Marketing', icon: '📢', count: 21 },
  { name: 'Video', icon: '🎬', count: 15 },
];

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory === 'All' || service.title.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Hyperlocal Service Marketplace</h1>
          <p>Connect with skilled professionals in your area for instant help</p>
        </div>
        <button className={styles.postBtn}>+ Offer Your Services</button>
      </div>

      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search for services or skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button>🔍</button>
      </div>

      <div className={styles.categories}>
        {categories.map((cat) => (
          <button
            key={cat.name}
            className={`${styles.catBtn} ${selectedCategory === cat.name ? styles.active : ''}`}
            onClick={() => setSelectedCategory(cat.name)}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
            <span className={styles.catCount}>{cat.count}</span>
          </button>
        ))}
      </div>

      <div className={styles.servicesGrid}>
        {filteredServices.map((service) => (
          <div key={service.id} className={styles.serviceCard}>
            <div className={styles.serviceHeader}>
              <div className={styles.serviceIcon}>{service.image}</div>
              <div className={styles.serviceInfo}>
                <h3>{service.title}</h3>
                <p>
                  {service.provider}
                  {service.verified && <span className={styles.verified}>✓</span>}
                </p>
              </div>
            </div>

            <div className={styles.serviceMeta}>
              <span className={styles.rating}>⭐ {service.rating}</span>
              <span className={styles.reviews}>({service.reviews})</span>
              <span className={styles.location}>📍 {service.location}</span>
            </div>

            <div className={styles.serviceTags}>
              {service.skills.map((skill) => (
                <span key={skill} className={styles.tag}>{skill}</span>
              ))}
            </div>

            <div className={styles.serviceFooter}>
              <div className={styles.price}>
                <span className={styles.priceNum}>₹{service.price}</span>
                <span className={styles.priceUnit}>/{service.unit}</span>
              </div>
              <button
                className={`${styles.contactBtn} ${!service.available ? styles.unavailable : ''}`}
                disabled={!service.available}
              >
                {service.available ? 'Contact' : 'Busy'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
