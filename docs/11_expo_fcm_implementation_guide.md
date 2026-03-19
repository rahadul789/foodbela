# Expo + Firebase Cloud Messaging Implementation Guide

## Overview

For **Android-only** FoodBela with Expo:
1. **Firebase** → Provides FCM credentials (not direct API)
2. **Expo** → Manages push notifications for you
3. **Client** → Gets `ExpoPushToken` via `expo-notifications`
4. **Server** → Sends to `https://exp.host/--/api/v2/push/send` (Expo endpoint)

**Firebase credentials flow:**
```
Firebase Project
    ↓
  FCM Credentials (google-services.json)
    ↓
  EAS Build (Expo embeds credentials in APK)
    ↓
  APK has FCM configured
    ↓
  When app runs → ExpoPushToken obtained
    ↓
  Server sends to Expo → Expo routes via FCM → Android device
```

---

## Step-by-Step Implementation

### 1. Create Firebase Project

```bash
# Go to https://console.firebase.google.com
# Create new project: "FoodBela"
# Enable Cloud Messaging
# Go to Project Settings → Download google-services.json
```

**Save:** `customer-app/google-services.json`

### 2. Update customer-app/app.json

```json
{
  "expo": {
    "name": "FoodBela Customer",
    "slug": "foodbela-customer",
    "version": "1.0.0",
    "assetBundlePatterns": ["**/*"],
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#FF6B00",
          "sounds": [
            "./assets/sounds/order_alert.wav",
            "./assets/sounds/delivery_nearby.wav",
            "./assets/sounds/order_delivered.wav"
          ]
        }
      ]
    ],
    "android": {
      "package": "com.foodbela.customer",
      "versionCode": 1,
      "googleServicesFile": "./google-services.json"  // ← Firebase config
    },
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"  // ← Get from EAS dashboard
      }
    }
  }
}
```

### 3. Create EAS Configuration

**customer-app/eas.json:**

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"  // App Bundle for Play Store
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccount": "./firebase-key.json"
      }
    }
  }
}
```

### 4. Build with EAS (Embeds FCM Credentials)

```bash
cd customer-app

# Login to Expo
eas login

# Build development (real device testing)
eas build --platform android --profile development

# Result: APK with FCM configured, ready to test on Android device
```

**Output:** APK file ready to install on Android device

### 5. Install APK on Android Device

```bash
# After build completes, download APK
# Install on physical Android device (USB connected)
adb install app-release.apk

# OR scan QR code from EAS dashboard to install
```

### 6. Test Push Notifications

```bash
# Use Expo Push Notification tool
# https://expo.dev/notifications

# Or test via API:
curl -X POST https://exp.host/--/api/v2/push/send \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "ExponentPushToken[...]",
    "title": "Test",
    "body": "Hello from Expo!"
  }'
```

---

## Code Structure

### Customer App Files

```
customer-app/
├── app.json                          (with plugin + google-services)
├── eas.json                          (build config)
├── google-services.json              (Firebase credentials)
├── assets/
│   ├── notification-icon.png         (Android notification icon)
│   └── sounds/
│       ├── order_alert.wav
│       ├── delivery_nearby.wav
│       └── order_delivered.wav
├── src/
│   ├── services/
│   │   └── notificationService.js    (expo-notifications setup)
│   ├── store/
│   │   └── authStore.js              (save expoPushToken)
│   └── App.jsx
└── package.json                      (expo-notifications installed)
```

### Server Files

```
server/
├── services/
│   └── pushNotificationService.js    (send to exp.host endpoint)
├── routes/
│   ├── auth.js                       (POST /auth/push-token → save token)
│   └── notifications.js              (POST /notifications → send push)
└── models/
    └── Notification.js               (store notification records)
```

---

## Critical Configuration Details

### app.json Requirements

```json
{
  "plugins": ["expo-notifications"],  // ← Required
  "android": {
    "googleServicesFile": "./google-services.json"  // ← Required for FCM
  },
  "extra": {
    "eas": {
      "projectId": "xxx-xxx-xxx"  // ← From EAS dashboard
    }
  }
}
```

### Package.json (server)

```json
{
  "dependencies": {
    "axios": "^1.6.0"  // for calling exp.host endpoint
  }
}
```

### Package.json (client)

```json
{
  "dependencies": {
    "expo-notifications": "^0.20.0",
    "expo-device": "^5.0.0",
    "expo-constants": "^15.0.0"
  }
}
```

---

## Testing Checklist

- [ ] Firebase project created
- [ ] `google-services.json` downloaded and added to customer-app
- [ ] `app.json` has expo-notifications plugin
- [ ] `app.json` has android.googleServicesFile path
- [ ] `app.json` has extra.eas.projectId
- [ ] `eas.json` configured
- [ ] `eas login` executed
- [ ] `eas build --platform android --profile development` successful
- [ ] APK installed on real Android device
- [ ] App opens without FCM errors
- [ ] `useNotifications()` hook initializes
- [ ] Permission request appears and user taps "Allow"
- [ ] Expo push token appears in console logs
- [ ] Token sent to server via POST `/auth/push-token`
- [ ] Token stored in database (user.expoPushToken)
- [ ] Send test notification from Expo dashboard
- [ ] Notification appears on Android device

---

## Firebase → Expo → FCM Mapping

| Layer | Component | Purpose |
|-------|-----------|---------|
| **Firebase** | google-services.json | Contains FCM credentials |
| **EAS Build** | eas build | Embeds google-services.json in APK |
| **APK** | app.json plugin | Initializes expo-notifications with FCM |
| **App Runtime** | expo-notifications | Gets ExpoPushToken for this device |
| **Server** | axios to exp.host | Sends notification to Expo |
| **Expo** | exp.host endpoint | Routes to Android via FCM |
| **FCM** | Google servers | Delivers to Android device |
| **Android** | notification receiver | Shows notification, handles taps |

---

## Key Differences from Direct Firebase Admin SDK

| Approach | Pro | Con |
|----------|-----|-----|
| **Expo (Our approach)** | Managed for us, simple, automatic | Depends on Expo service |
| **Direct Firebase Admin** | Full control, no dependency | Complex setup, token format issue |

**We use Expo because:**
- ✅ Handles Android + iOS token differences
- ✅ Simple one-endpoint API (exp.host)
- ✅ Automatic FCM credential management
- ✅ Built-in receipt tracking
- ✅ Error handling
- ✅ No need for Firebase Admin SDK on backend

---

## Troubleshooting

### Token is null

```
❌ Problem: user.expoPushToken is null in database
✅ Check:
  - Did user tap "Allow" for notification permission?
  - Is app running on real device? (not emulator)
  - Is projectId in app.json correct?
  - Did console show "Expo push token: ..."?
```

### Notification not received

```
❌ Problem: Server sent notification but device doesn't receive
✅ Check:
  - Is expoPushToken stored and valid?
  - Is app running on Android device?
  - Is FCM enabled in Firebase project?
  - Did EAS build include google-services.json?
  - Check server logs for errors from exp.host
```

### APK build fails

```
❌ Problem: eas build exits with error
✅ Check:
  - Is google-services.json in correct location?
  - Is app.json syntax valid (JSON checker)?
  - Is eas.json syntax valid?
  - Run: eas build --platform android --profile development --verbose
```

---

## Resources

- [Expo Notifications Docs](https://docs.expo.dev/push-notifications/push-notifications-setup/)
- [Expo Push Service](https://docs.expo.dev/push-notifications/sending-notifications/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [app.json Configuration](https://docs.expo.dev/versions/latest/config/app/)
