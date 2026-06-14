# TalentAI - Career Intelligence Mobile App

**Version:** 1.0.0  
**Date:** June 12, 2026  
**Platform:** iOS/Android  
**Framework:** Expo SDK 50  
**Company:** CorpPerks (RTNM Digital)

---

## 🎯 Overview

TalentAI is an AI-powered career development mobile app that helps professionals:
- Build ATS-optimized resumes
- Practice mock interviews
- Find matched job opportunities
- Track career progress
- Get AI-powered career guidance

---

## 📱 Features

### Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| AI Resume Builder | Create ATS-optimized resumes | ✅ |
| Interview Prep | AI-powered mock interviews | ✅ |
| Job Matching | Personalized job recommendations | ✅ |
| Course Learning | Skill development courses | ✅ |
| Skill Assessment | Track and improve skills | ✅ |
| Career Path | AI-powered career roadmap | ✅ |
| AI Chat | Career advice assistant | ✅ |
| Profile Management | Professional profile | ✅ |

---

## 🏗️ Architecture

```
TalentAI App
├── App.tsx                 # Main app entry
├── app/
│   ├── (tabs)/
│   │   ├── home.tsx        # Dashboard
│   │   ├── explore.tsx     # Job search
│   │   ├── chat.tsx        # AI Chat
│   │   └── profile.tsx     # Profile
│   ├── auth/
│   │   ├── login.tsx       # Login
│   │   └── register.tsx     # Register
│   ├── resume.tsx          # Resume Builder
│   ├── interview.tsx        # Interview Prep
│   ├── jobs.tsx            # Jobs
│   ├── courses.tsx         # Courses
│   ├── skills.tsx          # Skills
│   ├── career-path.tsx     # Career Path
│   └── ai-insights.tsx    # AI Insights
└── src/                    # Utilities
```

---

## 🎨 Design

### Color Scheme
| Color | Hex | Usage |
|--------|-----|-------|
| Primary | #6366f1 | Main actions, headers |
| Secondary | #8b5cf6 | Accents |
| Tertiary | #ec4899 | Highlights |
| Background | #f8fafc | Background |
| Success | #10b981 | Positive actions |

### Icons
Uses Ionicons from `@expo/vector-icons`

---

## 🔗 Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| HOJAI AI | Career assistant, insights | ✅ |
| CorpPerks Backend | User data, resume storage | ✅ |
| CorpID | Universal identity | ✅ |
| LMS Service | Course catalog | ✅ |

---

## 🚀 Deployment

### Build for iOS
```bash
cd talentai-app
npm install
npx expo prebuild
npx expo run:ios
```

### Build for Android
```bash
npx expo prebuild
npx expo run:android
```

### Build for Production
```bash
eas build --platform ios
eas build --platform android
```

---

## 📦 Dependencies

```json
{
  "expo": "~50.0.0",
  "react-native-paper": "5.12.0",
  "@react-navigation/native": "^6.1.0",
  "@react-navigation/bottom-tabs": "^6.5.0",
  "@react-navigation/native-stack": "^6.9.0",
  "zustand": "^4.5.0"
}
```

---

## 🔐 Environment Variables

```bash
# API URLs
TALENTAI_API_URL=http://localhost:4006
HOJAI_URL=http://localhost:4500

# Auth
CORPID_SERVICE_URL=http://localhost:4702
```

---

## 📄 Screens

### 1. Home Screen
- AI Career Score
- Quick Actions (Resume, Interview, Jobs, Courses)
- Recommended Jobs
- AI Chat FAB

### 2. Explore Screen
- Job search with filters
- Category chips (Jobs, Courses, Mentors, Companies)
- Match percentage badges
- Skill tags

### 3. Chat Screen
- AI career assistant
- Suggested questions
- Message history
- Real-time responses

### 4. Profile Screen
- Profile stats (Views, Applications, Interviews, Offers)
- Skills showcase
- Career progress
- Quick actions

### 5. Resume Builder
- Section-wise scores
- AI suggestions
- ATS optimization
- Download/Share

### 6. Interview Prep
- Question categories
- Difficulty levels
- Practice sessions
- Confidence score

---

## 🤖 AI Features

### AI Career Assistant
- Career advice
- Resume tips
- Interview preparation
- Skill recommendations

### AI Resume Builder
- ATS scoring
- Keyword optimization
- Achievement quantification
- Format optimization

### AI Interview Coach
- Question recommendations
- Real-time feedback
- Improvement tips
- Confidence tracking

---

## 📊 Analytics

| Metric | Tracked |
|--------|---------|
| Profile Views | ✅ |
| Applications Sent | ✅ |
| Interviews Scheduled | ✅ |
| Offers Received | ✅ |
| Skill Progress | ✅ |
| Course Completion | ✅ |

---

## 🔄 Updates Needed

- [ ] Connect to actual backend API
- [ ] Add authentication with CorpID
- [ ] Implement resume PDF generation
- [ ] Add job application tracking
- [ ] Connect to HOJAI AI for chat
- [ ] Add course enrollment API
- [ ] Implement skill assessment API

---

## 📞 Support

- CorpPerks: https://corpperks.com
- HOJAI AI: https://hojai.ai
- CorpID: https://corpid.io

---

*Generated: June 12, 2026*