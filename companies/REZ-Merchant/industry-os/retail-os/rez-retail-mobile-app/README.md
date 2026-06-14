# REZ Retail Mobile App

Expo-based mobile app for REZ Retail customers.

## Features

- Browse products
- Shopping cart
- User profile with loyalty rewards
- Category filtering
- Search functionality

## Tech Stack

- Expo SDK 50
- React Native
- TypeScript
- Expo Router for navigation
- Expo Linear Gradient

## Getting Started

```bash
npm install
npx expo start
```

## App Structure

```
app/
├── (tabs)/
│   ├── _layout.tsx    # Tab navigation
│   ├── home.tsx        # Home screen
│   ├── products.tsx   # Products listing
│   ├── cart.tsx       # Shopping cart
│   └── profile.tsx    # User profile
└── _layout.tsx        # Root layout
```

## Screens

- **Home**: Featured products, categories, promotions
- **Products**: Product grid with filtering
- **Cart**: Shopping cart with checkout
- **Profile**: User profile with rewards and settings
