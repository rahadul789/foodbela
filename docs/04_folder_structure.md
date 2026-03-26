# Folder Structure — All 6 Apps

---

## Server

```
server/
├── src/
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── cloudinary.js       # Cloudinary setup
│   ├── models/
│   │   ├── User.js
│   │   ├── Restaurant.js
│   │   ├── MenuCategory.js
│   │   ├── MenuItem.js
│   │   ├── Order.js
│   │   ├── Voucher.js
│   │   ├── VoucherUsage.js
│   │   ├── Promotion.js
│   │   ├── Review.js
│   │   ├── Notification.js
│   │   ├── DeliveryTracking.js
│   │   ├── Banner.js
│   │   ├── Payout.js
│   │   ├── Counter.js              # Atomic sequence counter for orderNumber generation
│   │   ├── CuisineType.js          # Admin-managed cuisine type list
│   │   ├── SystemSettings.js       # Singleton platform config (commissionRate, maintenance, etc.)
│   │   ├── AdminActivityLog.js     # Immutable audit trail of all admin actions
│   │   └── BroadcastNotification.js # Mass push/in-app notification blasts
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── restaurant.routes.js
│   │   ├── menu.routes.js
│   │   ├── promotion.routes.js
│   │   ├── order.routes.js
│   │   ├── payment.routes.js
│   │   ├── delivery.routes.js
│   │   ├── voucher.routes.js
│   │   ├── notification.routes.js
│   │   ├── admin.routes.js
│   │   ├── payout.routes.js
│   │   ├── banner.routes.js
│   │   ├── search.routes.js
│   │   ├── upload.routes.js
│   │   ├── cuisineType.routes.js    # GET (public) + CRUD (admin)
│   │   ├── analytics.routes.js     # Admin analytics + export
│   │   ├── review.routes.js        # Review submission (customer) + moderation (admin)
│   │   ├── broadcast.routes.js     # Admin notification broadcast
│   │   ├── export.routes.js        # CSV export (streams large datasets)
│   │   ├── settings.routes.js      # System settings singleton (admin)
│   │   └── activityLog.routes.js   # Admin activity log (read-only)
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── restaurant.controller.js
│   │   ├── menu.controller.js
│   │   ├── promotion.controller.js
│   │   ├── order.controller.js
│   │   ├── payment.controller.js
│   │   ├── delivery.controller.js
│   │   ├── voucher.controller.js
│   │   ├── notification.controller.js
│   │   ├── admin.controller.js
│   │   ├── payout.controller.js
│   │   ├── banner.controller.js
│   │   ├── search.controller.js
│   │   ├── upload.controller.js
│   │   ├── cuisineType.controller.js
│   │   ├── analytics.controller.js  # Aggregation queries for all analytics endpoints
│   │   ├── review.controller.js     # Submit + moderation actions
│   │   ├── broadcast.controller.js  # Resolve recipients, bulk notify, update stats
│   │   ├── export.controller.js     # Streaming CSV responses
│   │   ├── settings.controller.js   # Upsert singleton, log to AdminActivityLog
│   │   └── activityLog.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js          # JWT verify
│   │   ├── role.middleware.js          # Role-based access
│   │   ├── upload.middleware.js        # Multer config
│   │   ├── rateLimiter.middleware.js   # express-rate-limit: general (100/15min) + auth (10/15min)
│   │   ├── validate.middleware.js      # express-validator: runs checks, returns 400 with errors[] on fail
│   │   ├── adminActivity.middleware.js # Wraps admin controllers — logs action to AdminActivityLog (adminId, action, targetType, targetId, ip, userAgent)
│   │   └── error.middleware.js         # Global error handler
│   ├── services/
│   │   ├── bkash.service.js          # bKash API calls
│   │   ├── socket.service.js         # Socket.IO helpers
│   │   ├── notification.service.js   # createNotification + socket emit
│   │   ├── pushNotification.service.js # FCM push via Expo push gateway
│   │   └── email.service.js          # nodemailer — sends password reset emails
│   ├── jobs/
│   │   └── riderAssignment.job.js  # node-cron every 30s: re-broadcast unassigned orders, alert admin
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── logger.js           # Winston logger instance
│   │   ├── distance.js         # Haversine distance + ETA calc (swap with Google API later)
│   │   ├── orderNumber.js      # Generate ORD-YYYYMMDD-NNNNNN via atomic Counter ($inc)
│   │   └── response.js         # Standard response helpers
│   └── app.js                  # Express app setup (Morgan + routes + GET /health)
├── socket/
│   └── index.js                # Socket.IO event handlers
├── logs/
│   ├── app.log                 # Winston structured logs (auto-created)
│   └── error.log               # Error-only log (auto-created)
├── .env
├── .env.example
├── package.json
└── server.js                   # Entry point (http server + socket)
```

---

## customer-app (Expo, file-based routing)

```
customer-app/
├── app/
│   ├── _layout.jsx              # Root layout (QueryClient, auth check)
│   ├── index.jsx                # Redirect → (tabs) or (auth)
│   ├── (auth)/
│   │   ├── _layout.jsx
│   │   ├── login.jsx
│   │   └── register.jsx
│   ├── (tabs)/
│   │   ├── _layout.jsx          # Bottom tab navigator
│   │   ├── index.jsx            # Home: nearby restaurants
│   │   ├── search.jsx           # Search restaurants
│   │   ├── orders.jsx           # Order history
│   │   └── profile.jsx          # Profile + addresses
│   ├── restaurant/
│   │   └── [id].jsx             # Restaurant detail + menu
│   ├── cart.jsx                 # Cart screen
│   ├── checkout.jsx             # Address + voucher + payment method
│   ├── payment/
│   │   ├── bkash.jsx            # WebView for bKash
│   │   └── success.jsx          # Payment success screen
│   └── order/
│       ├── [id].jsx             # Order detail + status
│       └── track/
│           └── [id].jsx         # Live tracking map
├── components/
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Loading.jsx
│   │   └── EmptyState.jsx
│   ├── home/
│   │   ├── RestaurantCard.jsx
│   │   ├── CategoryFilter.jsx
│   │   └── BannerSlider.jsx
│   ├── restaurant/
│   │   ├── MenuSection.jsx
│   │   ├── MenuItemCard.jsx
│   │   └── RestaurantHeader.jsx
│   ├── cart/
│   │   ├── CartItem.jsx
│   │   └── CartSummary.jsx
│   ├── order/
│   │   ├── OrderCard.jsx
│   │   ├── OrderStatusBar.jsx
│   │   └── OrderTimeline.jsx
│   └── map/
│       ├── LiveTrackingMap.jsx      # order tracking screen — rider location
│       └── LocationPicker.jsx       # fixed center pin + map pan → Nominatim reverse geocode
├── store/
│   ├── authStore.js             # Zustand: user, token
│   ├── cartStore.js             # Zustand: cart items, restaurant
│   └── locationStore.js         # Zustand: user's current GPS
├── services/
│   ├── api.js                   # Axios instance with interceptors
│   └── socket.js                # Socket.IO client
├── hooks/
│   ├── useAuth.js
│   ├── useCart.js
│   └── useSocket.js
├── modules/
│   └── bela/                          # 🐱 Cat mascot — fully modular, zero coupling
│       ├── index.js                   # Module exports (BelaProvider, useBela)
│       ├── components/
│       │   ├── BelaOverlay.jsx        # Floating overlay container (renders character + bubble)
│       │   ├── BelaCharacter.jsx      # SVG cat drawn in code (react-native-svg + reanimated)
│       │   ├── BelaBubble.jsx         # Speech bubble with auto-dismiss + queue
│       │   ├── BelaMinimized.jsx      # Small paw icon when dismissed
│       │   └── BelaOnboarding.jsx     # First-time 4-step walkthrough
│       ├── context/
│       │   └── BelaProvider.jsx       # Global state: mood, visibility, message queue, socket listener
│       ├── hooks/
│       │   ├── useBela.js             # Main hook — triggerMood(), showMessage(), no-op fallback
│       │   ├── useBelaTouch.js        # Tap, double tap, long press, swipe, shake gestures
│       │   ├── useBelaMood.js         # Mood engine — priority resolution (screen > action > time > default)
│       │   ├── useBelaScreen.js       # Route-aware — auto-triggers dialogues per screen
│       │   └── useBelaAchievements.js # Client-side milestone tracker (AsyncStorage)
│       ├── data/
│       │   ├── dialogues.js           # All Bangla dialogues by screen + mood + context
│       │   ├── moods.js               # 13 mood definitions + priorities + transitions
│       │   ├── achievements.js        # Achievement thresholds + celebration messages
│       │   └── animations.js          # Reanimated animation configs per mood (spring, timing, targets)
│       ├── svg/
│       │   ├── catParts.js            # SVG path data for body parts (head, ears, body, tail, paws)
│       │   ├── accessories.js         # SVG components: crown, party hat, hearts, zzz, tears, steam, confetti
│       │   └── colors.js             # Cat color palette constants
│       └── utils/
│           ├── belaStorage.js         # AsyncStorage helpers (onboarding, achievements, settings)
│           └── belaScheduler.js       # Message cooldown, frequency cap, queue logic
├── constants/
│   └── colors.js
├── babel.config.js
└── app.json
```

---

## rider-app (Expo, file-based routing)

```
rider-app/
├── app/
│   ├── _layout.jsx
│   ├── index.jsx                # Redirect
│   ├── (auth)/
│   │   ├── login.jsx
│   │   └── register.jsx         # Rider registration with vehicle info
│   └── (tabs)/
│       ├── _layout.jsx
│       ├── index.jsx            # Available orders (ready for pickup nearby)
│       ├── active.jsx           # Current active delivery
│       ├── history.jsx          # Past deliveries
│       └── profile.jsx
├── components/
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── Loading.jsx
│   │   └── EmptyState.jsx
│   ├── order/
│   │   ├── AvailableOrderCard.jsx
│   │   ├── ActiveOrderCard.jsx
│   │   └── DeliveryStatusButtons.jsx
│   └── map/
│       └── NavigationMap.jsx
├── store/
│   ├── authStore.js
│   └── activeOrderStore.js
├── services/
│   ├── api.js
│   ├── socket.js
│   └── location.js              # expo-location: background tracking
├── hooks/
│   └── useLocationTracking.js   # Sends location every 5s via socket
├── constants/
│   └── colors.js
└── app.json
```

---

## restaurant-app (Expo, file-based routing)

```
restaurant-app/
├── app/
│   ├── _layout.jsx
│   ├── index.jsx
│   ├── (auth)/
│   │   └── login.jsx            # Login only — owners register via restaurant-web
│   └── (tabs)/
│       ├── _layout.jsx
│       ├── index.jsx            # Dashboard: online toggle + incoming orders
│       ├── orders.jsx           # All orders list + status management
│       └── profile.jsx
├── components/
│   ├── common/
│   │   ├── Button.jsx
│   │   └── Loading.jsx
│   ├── dashboard/
│   │   ├── OnlineToggle.jsx
│   │   └── IncomingOrderAlert.jsx
│   └── order/
│       ├── OrderCard.jsx
│       └── OrderActionButtons.jsx
├── store/
│   ├── authStore.js
│   └── orderStore.js
├── services/
│   ├── api.js
│   └── socket.js
├── constants/
│   └── colors.js
└── app.json
```

---

## restaurant-web (Vite + React, react-ts template)

```
restaurant-web/
├── src/
│   ├── main.jsx                 # Entry point (rename from main.tsx)
│   ├── App.jsx                  # Root — React Router routes + QueryClient provider
│   ├── routes/
│   │   ├── index.jsx            # Route definitions (React Router v6)
│   │   └── ProtectedRoute.jsx   # Redirect to /login if no token
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx         # Restaurant owner registration
│   │   └── dashboard/
│   │       ├── Overview.jsx     # Stats: total orders, revenue, ratings
│   │       ├── Setup.jsx        # Create/edit restaurant profile
│   │       ├── menu/
│   │       │   ├── MenuOverview.jsx
│   │       │   ├── Categories.jsx   # CRUD categories
│   │       │   └── Items.jsx        # CRUD items + discounts
│   │       ├── Orders.jsx       # Full order management (backup — primary is restaurant-app)
│   │       │                    # ⚠️ No push notifications on web — shows banner:
│   │       │                    # "For real-time alerts, use the FoodBela Restaurant App"
│   │       ├── Promotions.jsx   # Cart-threshold promotion create/edit/toggle
│   │       ├── Vouchers.jsx     # Restaurant's own vouchers
│   │       └── Analytics.jsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   └── Header.jsx
│   │   ├── menu/
│   │   │   ├── CategoryForm.jsx
│   │   │   ├── ItemForm.jsx
│   │   │   └── DiscountForm.jsx
│   │   ├── promotions/
│   │   │   └── PromotionForm.jsx
│   │   ├── vouchers/
│   │   │   └── VoucherForm.jsx
│   │   └── orders/
│   │       └── OrderTable.jsx
│   ├── store/
│   │   └── authStore.js
│   ├── services/
│   │   └── api.js
│   └── constants/
│       └── colors.js
├── index.html
├── vite.config.ts               # Vite config (keep as .ts — auto-generated)
└── tsconfig.json                # TS config (keep — needed for Vite, write components in .jsx)
```

---

## admin-web (Vite + React, react-ts template)

```
admin-web/
├── src/
│   ├── main.jsx                 # Entry point (rename from main.tsx)
│   ├── App.jsx                  # Root — React Router routes + QueryClient provider
│   ├── routes/
│   │   ├── index.jsx            # Route definitions (React Router v6)
│   │   └── ProtectedRoute.jsx   # Redirect to /login if no token
│   ├── pages/
│   │   ├── Login.jsx
│   │   └── dashboard/
│   │       ├── Overview.jsx         # Stats overview + charts
│   │       ├── Restaurants.jsx      # All restaurants + approve/reject/feature
│   │       ├── RestaurantDetail.jsx # Menu, orders, payout history
│   │       ├── Users.jsx            # All users, filter by role, activate/deactivate
│   │       ├── Riders.jsx           # All riders + approve/reject
│   │       ├── RiderDetail.jsx      # Delivery history, earnings, pay now
│   │       ├── Orders.jsx           # All orders, filter, force-cancel, assign rider
│   │       ├── Vouchers.jsx         # List + create/edit/toggle vouchers
│   │       ├── Banners.jsx          # List + create/edit/toggle banners
│   │       ├── Payouts.jsx          # Pending payouts + payout history
│   │       ├── Map.jsx              # Live operations map (riders + restaurants real-time)
│   │       ├── Analytics.jsx        # Revenue charts, order trends, top performers (date range picker)
│   │       ├── Reviews.jsx          # Review moderation queue — approve/reject with reason
│   │       ├── Notifications.jsx    # Broadcast composer (target role picker, push preview) + history table
│   │       ├── CuisineTypes.jsx     # Manage cuisine master list — add/edit/reorder/toggle active
│   │       ├── Settings.jsx         # System settings form (commission, fees, maintenance mode toggle)
│   │       ├── ActivityLog.jsx      # Audit log table — filter by admin, action, date range
│   │       └── ExportData.jsx       # CSV export center — pick type, date range, download
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   └── Header.jsx
│   │   ├── dashboard/
│   │   │   └── StatCard.jsx
│   │   ├── tables/
│   │   │   └── DataTable.jsx
│   │   ├── vouchers/
│   │   │   └── VoucherForm.jsx
│   │   ├── banners/
│   │   │   └── BannerForm.jsx
│   │   ├── payouts/
│   │   │   ├── PayoutTable.jsx  # Pending payouts with "Pay Now" / "Mark Collected"
│   │   │   └── PayoutForm.jsx   # Enter amount + bKash TrxID modal
│   │   ├── map/
│   │   │   └── LiveMap.jsx          # Google Maps / Leaflet with rider + restaurant pins
│   │   ├── analytics/
│   │   │   ├── RevenueChart.jsx     # Line/bar chart (recharts) — orders + revenue over time
│   │   │   └── TopPerformers.jsx    # Table component — top restaurants/riders/customers
│   │   ├── reviews/
│   │   │   └── ReviewCard.jsx       # Review card with approve/reject buttons + reason modal
│   │   ├── broadcasts/
│   │   │   └── BroadcastForm.jsx    # Composer: title, body, image, target role picker, preview
│   │   ├── cuisineTypes/
│   │   │   └── CuisineTypeForm.jsx  # Add/edit form: name, slug (auto-gen), icon upload, sortOrder
│   │   └── settings/
│   │       └── SettingsForm.jsx     # Form sections: general, fees, maintenance, support, social
│   ├── store/
│   │   └── authStore.js
│   ├── services/
│   │   └── api.js
│   └── constants/
│       └── colors.js
├── index.html
├── vite.config.ts               # Vite config (keep as .ts — auto-generated)
└── tsconfig.json                # TS config (keep — needed for Vite, write components in .jsx)
```
