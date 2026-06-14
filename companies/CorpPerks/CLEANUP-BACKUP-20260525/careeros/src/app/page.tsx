import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <div className={styles.logo}>CareerOS</div>
        <div className={styles.navLinks}>
          <Link href="/features">Features</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/login">Sign In</Link>
          <Link href="/signup" className={styles.cta}>Get Started</Link>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.badge}>AI-Powered Career Acceleration</div>
        <h1>Your Career Operating System</h1>
        <p className={styles.subtitle}>
          Multi-agent AI platform that builds your resume, coaches interviews,
          analyzes skill gaps, and matches you with opportunities — all in one place.
        </p>
        <div className={styles.ctaGroup}>
          <Link href="/signup" className={styles.primaryCta}>Start Free Trial</Link>
          <Link href="/demo" className={styles.secondaryCta}>Watch Demo</Link>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>50K+</span>
            <span className={styles.statLabel}>Jobs Matched</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>92%</span>
            <span className={styles.statLabel}>Interview Success</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>3.2x</span>
            <span className={styles.statLabel}>Faster Hiring</span>
          </div>
        </div>
      </section>

      <section className={styles.agents}>
        <h2>AI Agents Working For You</h2>
        <div className={styles.agentGrid}>
          <div className={styles.agentCard}>
            <div className={styles.agentIcon}>📄</div>
            <h3>Resume Builder</h3>
            <p>AI crafts ATS-optimized resumes that highlight your unique value proposition.</p>
          </div>
          <div className={styles.agentCard}>
            <div className={styles.agentIcon}>🗺️</div>
            <h3>Career Path Planner</h3>
            <p>Personalized roadmaps based on your skills, goals, and market trends.</p>
          </div>
          <div className={styles.agentCard}>
            <div className={styles.agentIcon}>🎯</div>
            <h3>Interview Coach</h3>
            <p>Practice with AI-powered mock interviews and get instant feedback.</p>
          </div>
          <div className={styles.agentCard}>
            <div className={styles.agentIcon}>🔔</div>
            <h3>Job Alert Agent</h3>
            <p>Real-time notifications when roles matching your profile open up.</p>
          </div>
          <div className={styles.agentCard}>
            <div className={styles.agentIcon}>💰</div>
            <h3>Salary Negotiator</h3>
            <p>Data-driven compensation advice backed by market analytics.</p>
          </div>
          <div className={styles.agentCard}>
            <div className={styles.agentIcon}>📊</div>
            <h3>Skill Gap Analyzer</h3>
            <p>Identify missing skills and get learning paths to close the gap.</p>
          </div>
          <div className={styles.agentCard}>
            <div className={styles.agentIcon}>🌐</div>
            <h3>Hyperlocal Marketplace</h3>
            <p>Connect with nearby skilled individuals for instant services and gigs.</p>
          </div>
          <div className={styles.agentCard}>
            <div className={styles.agentIcon}>🎓</div>
            <h3>Opportunity Aggregator</h3>
            <p>All student opportunities in one place — internships, scholarships, events.</p>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.feature}>
          <div className={styles.featureContent}>
            <h3>Smart Resume Building</h3>
            <p>
              Our AI analyzes thousands of successful resumes to understand what works.
              It helps you craft compelling narratives that pass ATS screening and
              catch recruiters' attention.
            </p>
            <ul>
              <li>ATS optimization scoring</li>
              <li>Keyword optimization</li>
              <li>Achievement quantification</li>
              <li>Multiple format exports</li>
            </ul>
          </div>
          <div className={styles.featureVisual}>
            <div className={styles.resumePreview}>
              <div className={styles.resumeLine} style={{ width: '60%' }}></div>
              <div className={styles.resumeLine} style={{ width: '80%' }}></div>
              <div className={styles.resumeLine} style={{ width: '40%' }}></div>
              <div className={styles.resumeBlock}></div>
              <div className={styles.resumeLine} style={{ width: '70%' }}></div>
              <div className={styles.resumeLine} style={{ width: '55%' }}></div>
            </div>
          </div>
        </div>

        <div className={styles.feature}>
          <div className={styles.featureVisual}>
            <div className={styles.careerMap}>
              <div className={styles.careerNode} style={{ '--delay': '0s' } as React.CSSProperties}>
                <span className={styles.nodeLabel}>Current</span>
                <span className={styles.nodeTitle}>Junior Dev</span>
              </div>
              <div className={styles.careerArrow}>→</div>
              <div className={styles.careerNode} style={{ '--delay': '0.2s' } as React.CSSProperties}>
                <span className={styles.nodeLabel}>6 months</span>
                <span className={styles.nodeTitle}>Mid Dev</span>
              </div>
              <div className={styles.careerArrow}>→</div>
              <div className={styles.careerNode} style={{ '--delay': '0.4s' } as React.CSSProperties}>
                <span className={styles.nodeLabel}>18 months</span>
                <span className={styles.nodeTitle}>Senior Dev</span>
              </div>
              <div className={styles.careerArrow}>→</div>
              <div className={styles.careerNode} style={{ '--delay': '0.6s' } as React.CSSProperties}>
                <span className={styles.nodeLabel}>3 years</span>
                <span className={styles.nodeTitle}>Tech Lead</span>
              </div>
            </div>
          </div>
          <div className={styles.featureContent}>
            <h3>Career Path Intelligence</h3>
            <p>
              Stop guessing which skills to learn. Our AI analyzes your current
              position, market demand, and your goals to create a personalized
              career roadmap.
            </p>
            <ul>
              <li>Market trend analysis</li>
              <li>Skill prioritization</li>
              <li>Timeline projections</li>
              <li>Milestone tracking</li>
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.testimonials}>
        <h2>Success Stories</h2>
        <div className={styles.testimonialGrid}>
          <div className={styles.testimonial}>
            <p>"CareerOS helped me land a 40% salary increase within 3 months. The interview coach is incredible."</p>
            <div className={styles.testimonialAuthor}>
              <strong>Priya Sharma</strong>
              <span>Senior Engineer at Google</span>
            </div>
          </div>
          <div className={styles.testimonial}>
            <p>"The resume builder passed all ATS filters. I went from 5% callback rate to 35%."</p>
            <div className={styles.testimonialAuthor}>
              <strong>Marcus Chen</strong>
              <span>Product Manager at Meta</span>
            </div>
          </div>
          <div className={styles.testimonial}>
            <p>"Found my dream internship through the opportunity aggregator. Saved me hours of searching."</p>
            <div className={styles.testimonialAuthor}>
              <strong>Aisha Patel</strong>
              <span>CS Student, Stanford</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <h2>Ready to Accelerate Your Career?</h2>
        <p>Join thousands of professionals who have transformed their careers with CareerOS.</p>
        <Link href="/signup" className={styles.primaryCta}>Get Started Free</Link>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>CareerOS</div>
            <p>AI-powered career acceleration platform</p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.footerCol}>
              <h4>Product</h4>
              <Link href="/features">Features</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/careers">Careers</Link>
            </div>
            <div className={styles.footerCol}>
              <h4>Resources</h4>
              <Link href="/blog">Blog</Link>
              <Link href="/guides">Career Guides</Link>
              <Link href="/support">Support</Link>
            </div>
            <div className={styles.footerCol}>
              <h4>Company</h4>
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/privacy">Privacy</Link>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>© 2026 CareerOS. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
