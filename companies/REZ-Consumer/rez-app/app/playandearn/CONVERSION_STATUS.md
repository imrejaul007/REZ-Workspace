# Play and Earn - React Native Conversion Status

## ✅ Completed

1. **Routes Registered** - All sub-pages are now registered in `app/_layout.tsx`:
   - `/playandearn` - Main page (already React Native compatible)
   - `/playandearn/CollegeAmbassador`
   - `/playandearn/BrandTasks`
   - `/playandearn/UGCCreator`
   - `/playandearn/CorporateEmployee`
   - `/playandearn/SocialImpact`
   - `/playandearn/SocialImpactEventDetail`
   - `/playandearn/TournamentDetail`
   - `/playandearn/quiz`
   - `/playandearn/memorymatch`
   - `/playandearn/luckydraw`
   - `/playandearn/guessprice`
   - `/playandearn/coinhunt`
   - `/playandearn/leaderboard`
   - `/playandearn/achievements`

2. **Navigation Paths Updated** - Updated paths in `playandearn.tsx` to use `/playandearn/` prefix

3. **Main Page** - `playandearn.tsx` is already React Native compatible ✅

## ⚠️ Needs Conversion (React.js → React Native)

The following files need to be converted from React.js to React Native:

### Files to Convert:

1. **CollegeAmbassador.jsx** ❌
2. **BrandTasks.jsx** ❌
3. **UGCCreator.jsx** ❌
4. **CorporateEmployee.jsx** ❌
5. **SocialImpact.jsx** ❌
6. **SocialImpactEventDetail.jsx** ❌
7. **TournamentDetail.jsx** ❌

### Already React Native Compatible:

- ✅ `quiz.tsx`
- ✅ `memorymatch.tsx`
- ✅ `luckydraw.tsx`
- ✅ `guessprice.tsx`
- ✅ `coinhunt.tsx`
- ✅ `leaderboard.tsx`
- ✅ `achievements.tsx`

## 🔧 Conversion Checklist

For each `.jsx` file, you need to:

### 1. Replace HTML Elements with React Native Components:

- `<div>` → `<View>`
- `<button>` → `<TouchableOpacity>` or `<Pressable>`
- `<span>`, `<p>`, `<h1>`, etc. → `<Text>`
- `<ul>`, `<li>` → Use `<View>` with `<Text>` or FlatList
- `<img>` → `<Image>`
- `<input>` → `<TextInput>`

### 2. Replace CSS Classes with StyleSheet:

- Remove `className="..."`
- Add `style={styles.xxx}` using StyleSheet
- Convert Tailwind classes to React Native styles

### 3. Replace Icons:

- Remove `lucide-react` imports
- Replace with `@expo/vector-icons` (Ionicons)
- Example: `<ArrowLeft />` → `<Ionicons name="arrow-back" size={24} color="#000" />`

### 4. Update Navigation:

- Already using `useRouter` from `expo-router` ✅
- Replace `Link` from `react-router-dom` with `Link` from `expo-router`
- Update `href` prop to match expo-router format

### 5. Handle Dark Mode:

- Replace Tailwind dark mode classes with theme-based styles
- Use `useColorScheme()` hook if needed

### 6. Replace Web-Specific Features:

- `hover:` states → Use `activeOpacity` on TouchableOpacity
- `backdrop-blur` → Use `expo-blur` if needed
- CSS Grid/Flexbox → React Native Flexbox

## 📍 How to Access Pages

### Main Page:

- Navigate to: `/playandearn`
- Or use: `router.push('/playandearn')`

### Sub-pages:

- College Ambassador: `/playandearn/CollegeAmbassador`
- Brand Tasks: `/playandearn/BrandTasks`
- UGC Creator: `/playandearn/UGCCreator`
- Corporate Employee: `/playandearn/CorporateEmployee`
- Social Impact: `/playandearn/SocialImpact`
- Tournament Detail: `/playandearn/TournamentDetail`
- Quiz: `/playandearn/quiz`
- Memory Match: `/playandearn/memorymatch`
- Lucky Draw: `/playandearn/luckydraw`
- Guess Price: `/playandearn/guessprice`
- Coin Hunt: `/playandearn/coinhunt`
- Leaderboard: `/playandearn/leaderboard`
- Achievements: `/playandearn/achievements`

## 🚀 Next Steps

1. Convert the 7 `.jsx` files to React Native (priority order):
   - Start with `CollegeAmbassador.jsx` (most complex)
   - Then `BrandTasks.jsx`
   - Then others

2. Test each page after conversion

3. Update any remaining navigation paths

4. Test on both iOS and Android

## 📝 Notes

- The main `playandearn.tsx` page is working and React Native compatible
- All routes are registered and should be accessible
- The `.tsx` files in the folder are already React Native compatible
- Only the `.jsx` files copied from React.js need conversion
