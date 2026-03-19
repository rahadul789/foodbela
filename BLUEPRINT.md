# FoodBela — Master Blueprint

## Overview
FoodBela is a food delivery platform for Bangladesh, similar to FoodPanda.
Architecture: **Monolithic** | Language: **JavaScript only** | Payment: **bKash**

---

## 5 Applications

| App | Type | Framework | Actors |
|-----|------|-----------|--------|
| `customer-app` | Mobile | React Native Expo | Customer |
| `rider-app` | Mobile | React Native Expo | Deliveryman |
| `restaurant-app` | Mobile | React Native Expo | Restaurant Owner |
| `restaurant-web` | Web | Next.js | Restaurant Owner |
| `admin-web` | Web | Next.js | Super Admin |

---

## Tech Stack

### Frontend (All Apps)
- React Native Expo (file-based routing via expo-router)
- Next.js 15 (App Router, file-based routing)
- TanStack Query (server state, caching — NO Redis)
- Zustand (client/global state)
- JavaScript only (NO TypeScript)

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- Socket.IO (live location, real-time orders)
- JWT (auth)
- Multer + Cloudinary (image uploads)
- bcrypt (password hashing)

### Payment
- bKash Payment Gateway (tokenized checkout)

---

## Planning Documents

1. [Database Schema](./docs/01_database_schema.md)
2. [API Endpoints](./docs/02_api_endpoints.md)
3. [Socket.IO Events](./docs/03_socket_events.md)
4. [Folder Structure](./docs/04_folder_structure.md)
5. [bKash Payment Flow](./docs/05_bkash_flow.md)
6. [Milestones](./docs/06_milestones.md)

---

## Key Rules
- No TypeScript — convert all existing `.tsx/.ts` files to `.jsx/.js`
- No Redis — use TanStack Query for caching
- Auth: Basic email + password (JWT), upgradeable to Google later
- Admin creates vouchers; restaurant owners create item-level discounts
- Live location via Socket.IO (no external map service needed for MVP)
