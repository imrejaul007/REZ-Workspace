# KHAIRMOVE User App

Mobile app for ride-hailing customers.

## Quick Start

```bash
npm install
cp .env.example .env
npm start
```

## Features

- Book rides (Bike, Auto, Cab, SUV)
- Real-time driver tracking
- Ride history
- 10% cashback on all rides
- ML-powered destination prediction

## Screens

- Home - Book rides
- Ride - Active ride details
- Tracking - Real-time map
- History - Past rides
- Profile - User settings

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
