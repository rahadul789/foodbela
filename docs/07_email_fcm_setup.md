# Email Service & Push Notifications Setup

---

## Part 0: Expo + Firebase Cloud Messaging Setup (Android Only)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project (or use existing)
3. Enable Cloud Messaging
4. Go to **Project Settings → Service Accounts**
5. Click "Generate New Private Key" → download JSON file
6. This file contains FCM credentials (for Expo to use)

### Step 2: Configure Expo with FCM Credentials

**customer-app/eas.json:**
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccount": "./firebase-key.json"  // ← Firebase credentials
      }
    }
  }
}
```

**customer-app/app.json:**
```json
{
  "expo": {
    "name": "FoodBela Customer",
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ],
    "android": {
      "package": "com.foodbela.customer",
      "googleServicesFile": "./google-services.json"  // ← Firebase config
    }
  }
}
```

### Step 3: Build with EAS (Includes FCM Setup)

```bash
cd customer-app

# Login to Expo
eas login

# Build for Android
eas build --platform android --profile preview

# Built APK will have FCM credentials embedded
```

**Result:** Expo automatically:
- Embeds Firebase credentials in APK
- Configures FCM for your app
- Enables push notifications on Android devices

---

## Part 1: Nodemailer (Email Service)

### Installation
```bash
npm install nodemailer
```

### Setup (server/config/email.js)
```js
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',  // or any SMTP service
  auth: {
    user: process.env.EMAIL_USER,      // e.g., your-email@gmail.com
    pass: process.env.EMAIL_PASSWORD   // Gmail App Password (not regular password)
  }
})

module.exports = transporter
```

### Gmail App Password Setup
1. Enable 2FA on your Google account
2. Go to Google Account → Security → App passwords
3. Generate app-specific password → use in `EMAIL_PASSWORD`

### Email Templates (server/services/emailService.js)

```js
const transporter = require('../config/email')

const sendPasswordResetEmail = async (userEmail, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Password Reset - FoodBela',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link expires in 15 minutes.</p>
      <p>If you didn't request this, ignore this email.</p>
    `
  }

  return transporter.sendMail(mailOptions)
}

const sendOrderConfirmationEmail = async (userEmail, orderNumber) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: `Order Confirmed - ${orderNumber}`,
    html: `
      <h2>Your Order is Confirmed!</h2>
      <p>Order Number: <strong>${orderNumber}</strong></p>
      <p>We'll notify you when your order is ready for delivery.</p>
    `
  }

  return transporter.sendMail(mailOptions)
}

module.exports = { sendPasswordResetEmail, sendOrderConfirmationEmail }
```

### API Endpoints for Email

| Method | Endpoint | Body | Auth | Description |
|--------|----------|------|------|-------------|
| POST | `/api/v1/auth/forgot-password` | `{ email }` | none | Sends password reset email |
| POST | `/api/v1/auth/reset-password` | `{ token, newPassword }` | none | Validates token, updates password |

---

## Part 2: Expo Push Service (Sends Notifications via exp.host)

### Installation
```bash
npm install axios
# axios is already installed for HTTP requests
```

### Backend Setup (server/services/pushNotificationService.js)

**Send notifications to Expo Push Service endpoint:**

```js
const axios = require('axios')
const Notification = require('../models/Notification')
const User = require('../models/User')
const logger = require('../config/logger')

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

// Send to specific user
const sendPushToUser = async (userId, notificationData) => {
  const user = await User.findById(userId)

  // User must have valid Expo push token
  if (!user?.expoPushToken) {
    logger.warn('User has no expoPushToken', { userId })
    return null
  }

  const payload = {
    to: user.expoPushToken,                    // Expo Push Token
    title: notificationData.title,
    body: notificationData.body,
    data: {
      type: notificationData.type,
      actionType: notificationData.actionType || 'open_app',
      actionData: JSON.stringify(notificationData.actionData || {})
    }
  }

  // Add optional fields if present
  if (notificationData.image) {
    payload.data.image = notificationData.image
  }
  if (notificationData.sound) {
    payload.sound = notificationData.sound      // Android: custom sound file name
  }
  if (notificationData.groupKey) {
    payload.data.groupKey = notificationData.groupKey  // Groups notifications on device
  }
  if (notificationData.badge) {
    payload.badge = notificationData.badge      // App icon badge number
  }

  try {
    const response = await axios.post(EXPO_PUSH_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    // Expo returns ticketId for receipt tracking
    const { data } = response

    logger.info('Push sent to Expo', { userId, ticketId: data.id })

    // Save notification record
    await Notification.create({
      userId,
      title: notificationData.title,
      body: notificationData.body,
      type: notificationData.type,
      image: notificationData.image,
      sound: notificationData.sound,
      groupKey: notificationData.groupKey,
      actionType: notificationData.actionType,
      actionData: notificationData.actionData,
      imageDisplayMode: notificationData.imageDisplayMode || 'thumbnail',
      pushSent: true,
      pushSentAt: new Date()
    })

    return data
  } catch (error) {
    logger.error('Push send failed', {
      userId,
      error: error.message,
      response: error.response?.data
    })

    // Save notification even if push failed (for retry later)
    await Notification.create({
      userId,
      title: notificationData.title,
      body: notificationData.body,
      type: notificationData.type,
      image: notificationData.image,
      sound: notificationData.sound,
      pushSent: false
    })

    return null
  }
}

// Send to multiple users
const sendPushToUsers = async (userIds, notificationData) => {
  const promises = userIds.map(userId =>
    sendPushToUser(userId, notificationData).catch(err => {
      logger.error('Failed to send to user', { userId, error: err.message })
      return null
    })
  )
  return Promise.allSettled(promises)
}

// Broadcast to all online riders (for new order)
const sendPushToAllOnlineRiders = async (orderData) => {
  const riders = await User.find({
    role: 'rider',
    isOnline: true,
    isApproved: true,
    expoPushToken: { $exists: true }
  })

  logger.info('Broadcasting order to riders', {
    ridersCount: riders.length,
    orderId: orderData._id
  })

  const notificationData = {
    title: `New Order! ৳${orderData.total}`,
    body: `${orderData.restaurantName} - ${orderData.itemCount} items`,
    type: 'new_order',
    image: orderData.restaurantImage,
    sound: 'order_alert.wav',
    actionType: 'open_order',
    actionData: { orderId: orderData._id.toString() },
    imageDisplayMode: 'thumbnail'
  }

  return sendPushToUsers(riders.map(r => r._id), notificationData)
}

// Retry failed push notifications
const retryFailedNotifications = async () => {
  const failedNotifications = await Notification.find({
    pushSent: false,
    createdAt: { $gte: new Date(Date.now() - 3600000) }  // last 1 hour
  }).limit(100)

  logger.info('Retrying failed notifications', { count: failedNotifications.length })

  for (const notif of failedNotifications) {
    const user = await User.findById(notif.userId)
    if (!user?.expoPushToken) continue

    try {
      await sendPushToUser(notif.userId, {
        title: notif.title,
        body: notif.body,
        type: notif.type,
        image: notif.image,
        sound: notif.sound,
        groupKey: notif.groupKey,
        actionType: notif.actionType,
        actionData: notif.actionData,
        imageDisplayMode: notif.imageDisplayMode
      })
    } catch (err) {
      logger.error('Retry failed for notification', { notifId: notif._id })
    }
  }
}

module.exports = {
  sendPushToUser,
  sendPushToUsers,
  sendPushToAllOnlineRiders,
  retryFailedNotifications
}
```

**How it works:**
1. Client gets ExpoPushToken via `expo-notifications`
2. Server stores token in `user.expoPushToken`
3. Backend sends to `https://exp.host/--/api/v2/push/send`
4. Expo routes through Firebase Cloud Messaging to Android devices
5. Android device receives notification via FCM
6. Client handles tap with `actionType`

### API Endpoints for Push Notifications

| Method | Endpoint | Body | Auth | Description |
|--------|----------|------|------|-------------|
| POST | `/api/v1/notifications` | `{ userId, title, body, type, image, sound, groupKey, actionType }` | admin | Send notification to user |
| POST | `/api/v1/notifications/group` | `{ userIds[], ...notificationData }` | admin | Send to multiple users |
| POST | `/api/v1/notifications/broadcast` | `{ role, ...notificationData }` | admin | Send to all riders/customers |
| GET | `/api/v1/notifications/my` | `?page&limit` | any | Get own notifications |
| PUT | `/api/v1/notifications/:id/read` | — | any | Mark as read |
| POST | `/api/v1/notifications/retry-failed` | — | admin | Retry failed push sends |

### Notification Sound Files

Store custom sound files in `server/assets/sounds/`:
```
server/
├── assets/
│   └── sounds/
│       ├── order_alert.wav        (for new orders)
│       ├── delivery_nearby.wav     (for rider nearby alert)
│       ├── order_delivered.wav     (for order delivered)
```

When sending notification, reference by filename: `sound: 'order_alert.wav'`

---

## Part 3: Customer App — Receiving Push Notifications

### Expo Notifications Setup (customer-app)

**Install required packages:**
```bash
npx expo install expo-notifications expo-device expo-constants
```

### Initialize (customer-app/services/notificationService.js)

```js
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { useEffect } from 'react'
import useAuthStore from '../store/authStore'

// Set notification behavior (required)
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('Notification received:', notification)

    // Show notification even if app is in foreground
    return {
      shouldShowBanner: true,          // Shows in-app banner
      shouldPlaySound: true,           // Plays notification sound
      shouldSetBadge: true,            // Updates app icon badge
      shouldShowList: true             // Shows in notification list
    }
  }
})

export const useNotifications = () => {
  const token = useAuthStore(state => state.token)
  const updateToken = useAuthStore(state => state.updateExpoPushToken)

  useEffect(() => {
    const initializeNotifications = async () => {
      // Step 1: Request permission (REQUIRED by Expo)
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync()
        let finalStatus = existingStatus

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync()
          finalStatus = status
        }

        if (finalStatus !== 'granted') {
          console.warn('Permission to receive notifications denied')
          return
        }

        // Step 2: Get Expo push token (with project ID)
        try {
          const projectId = Constants.expoConfig?.extra?.eas?.projectId
          if (!projectId) {
            throw new Error('Project ID not found in app config')
          }

          const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({
            projectId
          })

          console.log('Expo push token:', expoPushToken)

          // Save to app state
          updateToken(expoPushToken)

          // Send to backend to store in DB
          if (token) {
            await fetch(`${API_URL}/api/v1/auth/push-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ expoPushToken })
            })
          }
        } catch (error) {
          console.error('Failed to get Expo push token:', error)
        }
      } else {
        console.warn('Push notifications require a physical device')
      }
    }

    initializeNotifications()
  }, [token])

  // Listen for notifications when app is in foreground
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received in foreground:', notification)
        // Handle foreground notification (banner already shown by handler)
      }
    )

    // Listen for notification tap (app in background or killed)
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { data } = response.notification.request.content

        console.log('Notification tapped:', data)

        // Navigate based on actionType
        const actionType = data?.actionType
        const actionData = data?.actionData ? JSON.parse(data.actionData) : {}

        if (actionType === 'open_order') {
          navigation.navigate('OrderDetail', { orderId: actionData.orderId })
        } else if (actionType === 'open_promotion') {
          navigation.navigate('Home')
        } else if (actionType === 'open_tracking') {
          navigation.navigate('OrderTracking', { orderId: actionData.orderId })
        }
      }
    )

    return () => {
      subscription.remove()
      responseSub.remove()
    }
  }, [])
}

export default useNotifications

export default useNotifications
```

### Use in App (customer-app/App.jsx)

```jsx
import useNotifications from './services/notificationService'

export default function App() {
  useNotifications()  // Initialize notifications

  return (
    // Your app
  )
}
```

### Notification Inbox Screen (customer-app/screens/NotificationsScreen.jsx)

```jsx
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export default function NotificationsScreen() {
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => axios.get('/api/v1/notifications/my?page=1&limit=20')
  })

  return (
    <ScrollView>
      {notifications?.data?.map(notif => (
        <View key={notif._id} style={[styles.card, notif.isRead && styles.read]}>
          {notif.image && (
            <Image
              source={{ uri: notif.image }}
              style={{ width: '100%', height: 150, marginBottom: 10 }}
            />
          )}
          <Text style={styles.title}>{notif.title}</Text>
          <Text style={styles.body}>{notif.body}</Text>
          <Text style={styles.time}>{new Date(notif.createdAt).toLocaleString()}</Text>
        </View>
      ))}
    </ScrollView>
  )
}
```

---

## Part 4: Winston Logger (Monitoring)

### Installation
```bash
npm install winston
```

### Setup (server/config/logger.js)

```js
const winston = require('winston')
const path = require('path')

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'foodbela-api' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    // Combined log file (all levels)
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    }),

    // Console (development)
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})

module.exports = logger
```

### Use in Routes/Controllers

```js
const logger = require('../config/logger')

router.post('/orders', async (req, res) => {
  try {
    const order = await Order.create(req.body)
    logger.info('Order created', { orderId: order._id, customerId: req.user._id })
    res.json(order)
  } catch (error) {
    logger.error('Order creation failed', {
      error: error.message,
      stack: error.stack,
      userId: req.user._id
    })
    res.status(500).json({ error: error.message })
  }
})
```

### View Logs

```bash
# Tail live logs
tail -f server/logs/combined.log

# Check errors only
tail -f server/logs/error.log

# Search for specific user
grep "userId: 12345" server/logs/combined.log
```

---

## Environment Variables (.env)

```env
# Email Service
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Firebase
FIREBASE_DB_URL=https://your-project.firebaseio.com

# Logging
LOG_LEVEL=info

# Frontend (for password reset link)
FRONTEND_URL=http://localhost:3000
```

---

## Summary

| Service | Purpose | Setup Time |
|---------|---------|-----------|
| **Nodemailer** | Password reset emails | 10 min |
| **Firebase FCM** | Push notifications with image/sound/groups | 20 min |
| **Winston Logger** | Server logs → files | 5 min |
| **Expo Notifications** | Receive FCM on mobile | Built-in to Expo |

All three are **free/cheap** and **production-ready** for MVP.
