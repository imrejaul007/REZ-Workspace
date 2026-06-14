# Firebase Setup Guide

## ⚠️ IMPORTANT: DO NOT COMMIT REAL CREDENTIALS

The `google-services.json` file contains sensitive Firebase credentials. It has been:
1. Added to `.gitignore` to prevent accidental commits
2. Contains placeholder values that must be replaced before building

## Setup Instructions

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Follow the setup wizard
4. Note your **Project ID** and **Project Number**

### Step 2: Register Android App
1. In Firebase Console, go to Project Settings
2. Under "Your apps", click Android icon
3. Enter package name: `money.rez.app`
4. Download `google-services.json`

### Step 3: Register iOS App (Optional)
1. In Firebase Console, go to Project Settings
2. Under "Your apps", click iOS icon
3. Enter bundle ID: `money.rez.app`
4. Download `GoogleService-Info.plist`

### Step 4: Replace Placeholder Config

Replace the contents of `google-services.json` with your downloaded config:

```json
{
  "project_info": {
    "project_number": "123456789012",
    "project_id": "rez-app-production",
    "storage_bucket": "rez-app-production.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:123456789012:android:abc123def456",
        "android_client_info": {
          "package_name": "money.rez.app"
        }
      },
      "api_key": [
        {
          "current_key": "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        }
      ],
      ...
    }
  ]
}
```

### Step 5: Enable Required Services

Ensure these Firebase services are enabled:
- **Authentication** (Email/Password, Phone, Google Sign-In)
- **Cloud Messaging** (FCM)
- **Analytics** (optional but recommended)

## Environment-Specific Builds

### Development
Use development Firebase project with relaxed security rules.

### Staging
Use staging Firebase project with production-like config.

### Production
Use production Firebase project with:
- App Signing enabled
- Security rules enforced
- Analytics data collection enabled

## Troubleshooting

### "google-services.json not found"
Make sure the file is in the project root and not gitignored for your current build.

### "Invalid API Key"
The API key in google-services.json doesn't match your Firebase project. Download a fresh copy.

### Build fails on Android
Ensure the `package_name` in google-services.json matches `android.package` in `app.config.js`.
