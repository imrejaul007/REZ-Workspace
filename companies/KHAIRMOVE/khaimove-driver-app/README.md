# KHAIRMOVE Driver App

Mobile app for ride-hailing drivers.

## Quick Start

```bash
npm install
cp .env.example .env
npm start
```

## Features

- Accept/decline ride requests
- Real-time GPS tracking (every 3 seconds)
- Earnings dashboard
- Fleet management integration
- ML-powered driver scoring

## Screens

- Dashboard - Online status, earnings
- Ride Request - Accept/decline ride

## Tech Stack

- Expo SDK 52
- React Navigation
- React Native Maps
- Axios

## Build

```bash
# Android
expo prebuild --platform android
cd android && ./gradlew assembleDebug

# iOS
expo prebuild --platform ios
```
