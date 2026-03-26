# FoodBela — Master Blueprint

## Overview

FoodBela is a food delivery platform for Bangladesh, similar to FoodPanda.
Architecture: **Monolithic** | Language: **JavaScript only** | Payment: **bKash**

---

## 6 Applications

| App              | Type   | Framework         | Actors           | Role |
| ---------------- | ------ | ----------------- | ---------------- | ---- |
| `customer-app`   | Mobile | React Native Expo | Customer         | Order food, track delivery, pay via bKash/COD |
| `rider-app`      | Mobile | React Native Expo | Deliveryman      | Accept deliveries, navigate, earn |
| `restaurant-app` | Mobile | React Native Expo | Restaurant Owner | PRIMARY — accept/reject orders, ETA updates, push notifications |
| `restaurant-web` | Web    | React.js          | Restaurant Owner | BACKUP — manage restaurant, menu, vouchers (no push, browser must be open) |
| `admin-web`      | Web    | React.js          | Super Admin      | Full platform control — all 7 admin features |
| `server`         | API    | Node.js + Express | All actors       | REST API + Socket.IO + cron jobs |

---

## Tech Stack

### Frontend (All Apps)

- React Native Expo (file-based routing via expo-router) — mobile apps
- React.js + Vite — web apps (admin-web, restaurant-web)
- TanStack Query (server state, caching — NO Redis)
- Zustand (client/global state)
- JavaScript only (NO TypeScript) — new files in `.js`/`.jsx` only

### Backend

- Node.js + Express.js
- MongoDB + Mongoose
- Socket.IO (live location, real-time orders)
- JWT (auth)
- Multer + Cloudinary (image uploads)
- bcrypt (password hashing)
- Winston + Morgan (logging)
- Nodemailer (email — password reset, order notifications)
- node-cron (DB-based rider assignment timeout — Kubernetes-safe, no Redis)
- express-rate-limit (rate limiting on auth routes)
- express-validator (input validation)

### Notifications

- Expo Push Notifications via FCM v1 (Firebase Cloud Messaging)
- Server sends to Expo endpoint (`exp.host/--/api/v2/push/send`) — NOT directly to Firebase
- Supports: custom sound, image, group, per-user, all-users

### Payment

- bKash Payment Gateway (tokenized checkout)
- Manual refund flow — admin processes within 2-hour SLA

---

## Planning Documents

1. [Database Schema](./docs/01_database_schema.md)
2. [API Endpoints](./docs/02_api_endpoints.md)
3. [Socket.IO Events](./docs/03_socket_events.md)
4. [Folder Structure](./docs/04_folder_structure.md)
5. [bKash Payment Flow](./docs/05_bkash_flow.md)
6. [Milestones](./docs/06_milestones.md)
7. [Email & FCM Setup](./docs/07_email_fcm_setup.md)
8. [Docker & Kubernetes](./docs/08_docker_kubernetes.md)
9. [Staging & CI/CD](./docs/09_staging_cicd.md)
10. [Expo FCM Implementation Guide](./docs/11_expo_fcm_implementation_guide.md)
11. [Bela Cat Mascot](./docs/12_bela_cat_mascot.md)

---

## Key Rules

- JavaScript only — new files in `.js`/`.jsx` only; existing `.ts`/`.tsx` files stay unchanged
- No Redis — use TanStack Query for caching; DB-based cron for Kubernetes-safe timeouts
- Auth: Basic email + password (JWT), upgradeable to Google later
- Vouchers: Admin creates platform-wide vouchers; restaurant owners create their own restaurant vouchers
- Restaurant owners also have Promotions (cart-threshold auto-discounts, no code needed)
- If promotion active → voucher cannot be stacked (one discount at a time)
- Live location via Socket.IO — fixed center pin + map pan (OpenStreetMap Nominatim for reverse geocode, free)
- Refund: Manual, admin processes within 2-hour SLA — NOT automatic
- Password reset: via Nodemailer email (token link, 1-hour expiry)
- Kubernetes: min 2 pods with sticky sessions for Socket.IO (session affinity)
- 18 Mongoose models (14 core + CuisineType, SystemSettings, AdminActivityLog, BroadcastNotification)
- One restaurant per owner (unique index on ownerId)

---

## 7 Admin Features (Production-Grade)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Notification Broadcast** | Mass push + in-app notifications to user segments (all, by role, or specific users) with FCM batch delivery |
| 2 | **Analytics Dashboard** | Revenue charts, order trends, top restaurants/riders/customers, payment breakdown — MongoDB aggregation pipeline |
| 3 | **Cuisine Type Management** | Admin-managed master list of cuisine categories used for home screen filter chips |
| 4 | **Review Moderation** | All reviews go through pending → approved/rejected flow before public visibility |
| 5 | **Export Data** | Streaming CSV exports for orders, payouts, riders, customers, restaurants with date range filters |
| 6 | **System Settings** | Singleton config: commission rate, delivery fee, min order, maintenance mode, support contacts |
| 7 | **Admin Activity Log** | Immutable audit trail logging every admin action with before/after diffs, filterable by admin/action/date |

---

## Bela (বেলা) — Cat Mascot

A cute, interactive Bengal cat that lives in the customer-app as a floating companion.

- **13 moods** — happy, excited, hungry, sleepy, curious, celebrating, sad, angry, proud, love, thinking, waving, pointing
- **Screen-aware** — auto-reacts based on current route (home, cart, checkout, tracking, etc.)
- **Touch-responsive** — tap (random reaction), double-tap (food joke), long-press (purr), swipe (minimize), shake (easter egg)
- **Bangla dialogues** — all messages in Bangla, emotionally connects with local users
- **Socket-aware** — reacts to order events (confirmed, preparing, delivered, cancelled)
- **Onboarding guide** — walks first-time users through the app in 4 steps
- **Achievement celebrations** — 1st order, 5th, 10th, 25th, 50th, first 5-star, streaks
- **Fully modular** — all code in `customer-app/modules/bela/`, zero coupling. Remove `BelaProvider` = app unchanged.
- **Lottie animations** — ~20 animation files, ~1.5MB total, lazy loaded
- See [full spec](./docs/12_bela_cat_mascot.md) for dialogues, moods, architecture
