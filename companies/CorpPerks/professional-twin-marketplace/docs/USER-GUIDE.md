# TwinOS User Guide

**For Employees, Companies, and Freelancers**

---

## Table of Contents

1. [What is TwinOS?](#what-is-twinos)
2. [Getting Started](#getting-started)
3. [For Employees](#for-employees)
4. [For Companies](#for-companies)
5. [For Freelancers](#for-freelancers)
6. [Pricing](#pricing)
7. [FAQ](#faq)

---

## What is TwinOS?

TwinOS is the world's first **Professional Twin Marketplace** where:

- **Employees OWN their professional twins** (not companies)
- **Twins travel with you** when you change jobs
- **Companies hire employees + their AI twins** for 2-5x productivity

### The Vision

```
Today:         Company → Hire 1 Human
Tomorrow:      Company → Hire 1 Human + N Professional Twins
```

---

## Getting Started

### Quick Start

```bash
# 1. Install
npm install

# 2. Start server
npm run dev

# 3. Access dashboard
open http://localhost:4762
```

### Prerequisites

- Node.js 18+
- MongoDB
- CorpID account (for identity)

---

## For Employees

### What You Get

When you join TwinOS, you get **5 Professional Twins**:

| Twin | What It Does | Productivity |
|------|--------------|--------------|
| **Knowledge Twin** | Knows everything you know | +1.5x |
| **Skill Twin** | Can do everything you can do | +2.5x |
| **Career Twin** | Tracks where you're going | +1.0x |
| **Productivity Twin** | Optimizes how you work | +1.5x |
| **Execution Twin** | Delegates tasks to AI | +3.0x |

**Total Potential: 3.5x - 10x productivity**

### Creating Your Twins

1. **Connect CorpID**
   - Your twins are linked to your CorpID
   - This proves you own them

2. **Import Your Data**
   - Skills from CorpPerks
   - Verified assertions
   - Projects and experience

3. **Twins Start Training**
   - Learn from your work
   - Build knowledge
   - Improve over time

### Training Your Twins

Your twins learn from:

- **SkillNet events** - Skills you use
- **Memory** - Your work history
- **Feedback** - From companies you work with
- **Projects** - Work you complete

### Privacy Settings

You control exactly who sees what:

| Setting | Description |
|---------|-------------|
| **Maximum** | Only you can see |
| **Balanced** | Visible but limited |
| **Open** | Full transparency |
| **Job Search** | Optimized for recruiters |

### Exporting Your Twins

**You own your twins.** Export anytime:

```bash
GET /export/owner/:corpId/all
```

This includes:
- All twin data
- Learning history
- Privacy settings
- Access history

### When You Change Jobs

Your twins go with you:

1. **Export your twins** before leaving
2. **Take them to your new employer**
3. **Your new company can hire your twins**

---

## For Companies

### What You Get

When you hire an employee + their twins, you get:

- **Access to 5 professional twins**
- **Productivity gains of 3.5x - 10x**
- **Verified skill claims**
- **Continuous learning**

### Hiring Flow

1. **Browse Twins**
   ```
   GET /marketplace/search?skills=python,javascript
   ```

2. **View Profiles**
   - Productivity scores
   - Skills and expertise
   - Training hours
   - Verified claims

3. **Request Access**
   ```
   POST /hire
   ```

4. **Employee Approves**
   - They see your company
   - They approve or reject

5. **Start Using Twins**
   - Invoke for tasks
   - Rate performance
   - Twins learn and improve

### Managing Your Workforce

**Dashboard shows:**
- All active twins
- Usage statistics
- Productivity metrics
- Satisfaction ratings

### ROI Example

| Without Twins | With Twins |
|--------------|------------|
| 5 engineers | 5 engineers + twins |
| 1x productivity | 8x productivity |
| 5 projects/month | 40 projects/month |

---

## For Freelancers

### The Advantage

As a freelancer, you can:

```
You + Your Twins = Mini Agency
```

- Complete projects faster
- Offer more services
- Bill higher rates

### Bundle Offer

**MyTalent + TwinOS = ₹799/month**

Includes:
- Full talent profile
- All 5 professional twins
- Marketplace visibility
- Client hiring access

---

## Pricing

### Individual Plans

| Plan | Price | Twins | Features |
|------|-------|-------|----------|
| **Basic** | Free | 1 Knowledge | Export, Basic analytics |
| **Pro** | ₹499/mo | 3 (Knowledge, Skill, Career) | API, Advanced analytics |
| **Premium** | ₹999/mo | 5 All | Sutar execution, Custom training |

### Freelancer Bundle

| Plan | Price | Features |
|------|-------|----------|
| **Bundle** | ₹799/mo | MyTalent + All 5 Twins |

### Enterprise Plans

| Plan | Price | Features |
|------|-------|----------|
| **Startup** | ₹50/emp/mo | Workforce twins, Basic analytics |
| **Business** | ₹100/emp/mo | + Custom training, API |
| **Enterprise** | ₹200/emp/mo | + White-label, SLA |

---

## FAQ

### Who owns my twin?

**You do.** Not your company. This is the core principle of TwinOS.

### Can my company see my twin?

Only if you allow it. You control privacy settings.

### What happens when I change jobs?

Your twins go with you. Export them and take to your new employer.

### How do twins learn?

Twins learn from:
- Your work activities (via SkillNet)
- Projects you complete
- Feedback from companies
- Documents and meetings

### How long until twins are useful?

- **1-2 weeks**: Basic training
- **1 month**: Competent
- **3+ months**: Highly capable

### Can I delete my twin?

Yes, you can archive or export your twins anytime.

### How is this different from ChatGPT?

| ChatGPT | TwinOS |
|---------|--------|
| Generic | **Personalized to you** |
| Temporary | **Lifelong learning** |
| Company-owned | **You own it** |
| Single session | **Continuous memory** |

---

## Concepts

### The 4 Pillars of Trust

```
┌─────────────────────────────────────────┐
│           TWINOS TRUST                  │
├─────────────────────────────────────────┤
│                                          │
│  1. OWNERSHIP                            │
│     You own your twin                    │
│                                          │
│  2. PORTABILITY                         │
│     Twins travel with you                │
│                                          │
│  3. PRIVACY                             │
│     You control visibility               │
│                                          │
│  4. EXPORT                               │
│     Full data portability                │
│                                          │
└─────────────────────────────────────────┘
```

### Productivity Multiplier

Your combined productivity:

```
Knowledge Twin:     1.5x
Skill Twin:        2.5x
Career Twin:       1.0x
Productivity Twin: 1.5x
Execution Twin:    3.0x
─────────────────────────────
Combined:          9.5x baseline productivity
```

### Trust Scores

| Score | Meaning |
|-------|---------|
| 90-100 | Expert level |
| 75-89 | Advanced |
| 50-74 | Intermediate |
| Below 50 | Building |

---

## Support

- **Documentation**: [docs/API.md](docs/API.md)
- **GitHub**: [github.com/hojai/twinos](placeholder)
- **Email**: support@hojai.ai

---

**TwinOS - Your Professional Intelligence, Always With You**
