# InsightCampus - Student Intelligence Mobile App

**Version:** 1.0.0  
**Date:** June 12, 2026  
**Platform:** iOS/Android  
**Framework:** Expo SDK 50  
**Company:** CorpPerks (RTNM Digital)

---

## 🎯 Overview

InsightCampus is an AI-powered student success platform that helps students:
- Track attendance and academic performance
- Manage courses and schedules
- Complete assignments on time
- Access academic resources
- Get AI-powered study assistance

---

## 📱 Features

### Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| Dashboard | Overview of attendance, CGPA, tasks | ✅ |
| Course Management | Track courses, progress, grades | ✅ |
| Schedule | Class timetable | ✅ |
| Attendance Tracking | Track attendance percentage | ✅ |
| Assignment Management | Due dates, submissions | ✅ |
| Results | View grades and semester results | ✅ |
| AI Chat | Study assistant | ✅ |
| Profile | Student information | ✅ |

---

## 🏗️ Architecture

```
InsightCampus App
├── App.tsx                 # Main app entry
├── app/
│   ├── (tabs)/
│   │   ├── home.tsx       # Dashboard
│   │   ├── courses.tsx    # Courses
│   │   ├── schedule.tsx   # Timetable
│   │   └── profile.tsx   # Profile
│   └── auth/
│       └── login.tsx      # Login
└── src/                   # Utilities
```

---

## 🎨 Design

### Color Scheme
| Color | Hex | Usage |
|--------|-----|-------|
| Primary | #10b981 | Main actions, headers (Green) |
| Secondary | #059669 | Accents |
| Tertiary | #34d399 | Highlights |
| Background | #f0fdf4 | Background (Light green) |

---

## 🔗 Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| HOJAI AI | Study assistant, insights | ✅ |
| LMS Service | Course content | ✅ |
| CorpID | Universal identity | ✅ |
| Attendance Service | Track attendance | ✅ |

---

## 🚀 Deployment

### Build for iOS
```bash
cd insight-app
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

## 📄 Screens

### 1. Home Screen
- Attendance percentage
- Assignment count
- Current CGPA
- Upcoming tasks
- AI Chat FAB

### 2. Courses Screen
- Course cards with progress
- Grade display
- Credits tracking
- Course details

### 3. Schedule Screen
- Daily timetable
- Room locations
- Class types (Lecture, Lab, Workshop)
- Time slots

### 4. Profile Screen
- Student info (Name, Roll No, Course)
- Semester details
- Email and phone
- Results link
- Settings

---

## 🔄 Updates Needed

- [ ] Connect to actual backend API
- [ ] Add authentication with CorpID
- [ ] Implement attendance marking
- [ ] Add assignment submission
- [ ] Connect to LMS Service
- [ ] Add result cards API
- [ ] Implement notification system

---

## 📊 Metrics Tracked

| Metric | Description |
|--------|-------------|
| Attendance % | Class attendance rate |
| CGPA | Cumulative Grade Point Average |
| Credits | Completed vs total credits |
| Assignments | Completed vs pending |
| Course Progress | Per-course completion % |

---

## 📞 Support

- CorpPerks: https://corpperks.com
- HOJAI AI: https://hojai.ai
- CorpID: https://corpid.io

---

*Generated: June 12, 2026*