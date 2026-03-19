# Development Milestones

Each milestone is self-contained: implement → test → move on.
Test each milestone before starting the next one.

---

## Milestone 1 — Project Setup & Server Foundation

**Goal:** Working Express server with DB connection, auth, and file structure.

### Tasks

- [ ] Set up `server/` with Express, MongoDB, Socket.IO
- [ ] Create all 14 Mongoose models (from database schema doc — includes Counter model)
- [ ] JWT auth middleware (`auth.middleware.js`)
- [ ] Role middleware (`role.middleware.js`)
- [ ] Global error handler (`error.middleware.js`)
- [ ] Rate limiter middleware (`rateLimiter.middleware.js`) — apply to all routes: 100 req/15min general; auth routes stricter: 10 req/15min
- [ ] Input validation middleware (`validate.middleware.js`) — wraps `express-validator` check arrays, returns 400 with `errors[]` on failure
- [ ] Standard response helpers (`utils/response.js`)
- [ ] Order number auto-generation helper (`utils/orderNumber.js`) — uses atomic Counter model (`$inc`) to generate `ORD-YYYYMMDD-NNNNNN` — race-condition-safe
- [ ] Environment variables setup (`.env` + `.env.example`):
  ```env
  PORT=5000
  MONGO_URI=mongodb://localhost:27017/foodbela
  JWT_SECRET=your_jwt_secret
  JWT_EXPIRES_IN=7d
  CLOUDINARY_CLOUD_NAME=
  CLOUDINARY_API_KEY=
  CLOUDINARY_API_SECRET=
  BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
  BKASH_APP_KEY=
  BKASH_APP_SECRET=
  BKASH_USERNAME=
  BKASH_PASSWORD=
  BKASH_CALLBACK_URL=http://yourserver.com/api/v1/payments/bkash/callback
  EMAIL_HOST=smtp.gmail.com
  EMAIL_PORT=587
  EMAIL_USER=your@gmail.com
  EMAIL_PASS=your_app_password
  EMAIL_FROM=FoodBela <noreply@foodbela.com>
  CLIENT_URL=http://localhost:5173
  ```
- [ ] Register + Login endpoints (`/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/me`) — with `express-validator` input checks
- [ ] Forgot password endpoint (`POST /api/v1/auth/forgot-password`) → generate crypto token → hash → save to `user.passwordResetToken` + `user.passwordResetExpiry` (15min) → send plain token via email (nodemailer)
- [ ] Reset password endpoint (`POST /api/v1/auth/reset-password`) → hash incoming token → find user where token matches + expiry > now → update password → clear token fields
- [ ] `GET /health` endpoint (outside `/api/v1/`) → returns DB connection status — for Kubernetes liveness + readiness probes
- [ ] Rider assignment cron job (`jobs/riderAssignment.job.js`) — runs every 30s via `node-cron`:
  - Query: `{ status: 'ready', riderId: null, riderAssignmentDeadline: { $lt: Date.now() } }`
  - Re-broadcast `new_order_available` to `riders_online` room
  - If deadline passed by 60s+ → emit `unassigned_order_alert` to admin room
  - **Kubernetes-safe**: DB-based check, works across all pods (replaces old in-memory `pendingOrderTimeouts` Map)
- [ ] Proper logging: Winston (structured logs to file) + Morgan (HTTP request logs)
  - See `docs/07_email_fcm_setup.md` Part 4 for Winston configuration + usage
- [ ] Firebase Admin SDK setup for push notifications (FCM)
  - See `docs/07_email_fcm_setup.md` Part 2 for Firebase setup + service account key
- [ ] Nodemailer setup for email service (password reset, order confirmations)
  - See `docs/07_email_fcm_setup.md` Part 1 for Nodemailer configuration
- [ ] Convert all web/mobile apps from TypeScript → JavaScript (rename files, remove TS config)
- [ ] Mount all routes under `/api/v1/` prefix in `app.js`

### Packages to Install (Server)

```bash
npm init -y
npm install express mongoose socket.io jsonwebtoken bcryptjs dotenv cors multer cloudinary multer-storage-cloudinary axios winston morgan express-validator express-rate-limit nodemailer firebase-admin node-cron
npm install -D nodemon
```

### Test

- POST `/api/v1/auth/register` → creates customer, rider, restaurant_owner, admin
- POST `/api/v1/auth/login` → returns token
- GET `/api/v1/auth/me` with token → returns user
- POST `/api/v1/auth/login` 11 times rapidly → 11th request returns 429 Too Many Requests
- POST `/api/v1/auth/register` with missing fields → returns 400 with `errors[]`
- POST `/api/v1/auth/forgot-password` → email received with reset link
- POST `/api/v1/auth/reset-password` with valid token → password updated, token cleared
- POST `/api/v1/auth/reset-password` with expired token → 400 error
- GET `/health` → `{ status: 'ok', db: 'connected' }` — no auth needed

---

## Milestone 2 — Restaurant & Menu Management (Backend)

**Goal:** Full CRUD for restaurants and menus via API.

### Tasks

- [ ] Restaurant CRUD endpoints (include `cuisineTypes` field)
- [ ] Admin approve/reject restaurant
- [ ] Menu category CRUD
- [ ] Menu item CRUD (include `isAvailable`, `customizations` fields)
- [ ] Item discount set/remove endpoint
- [ ] Image upload endpoint (Cloudinary)
- [ ] Geo index on Restaurant.location
- [ ] Text index on MenuItem (name + description) for dish search
- [ ] `GET /api/restaurants` — support filter params: `cuisineType`, `minRating`, `maxDeliveryTime`, `maxDeliveryFee`, `hasDiscount`, `isOpen`, `sortBy`
- [ ] `GET /api/search?q=...` — searches both restaurants (by name) AND menu items (by dish name), returns both lists
- [ ] Promotion CRUD endpoints (`POST`, `GET`, `PUT`, `DELETE`, `toggle`) — restaurant_owner creates cart-threshold promotions
- [ ] `GET /api/promotions/:restaurantId` — returns active promotion for a restaurant (public)
- [ ] `POST /orders` backend validation: reject if `subtotal < restaurant.minimumOrder` (return 400) — frontend check is UX only, backend is the real gate

### Test

- Create restaurant (as restaurant_owner)
- Admin approves it
- Create 2 categories + 5 items with images
- Apply discount to an item
- GET `/api/restaurants?lat=23.8&lng=90.4&radius=5` → returns nearby restaurants
- GET `/api/restaurants?isOpen=true` → returns only currently open restaurants
- GET `/api/search?q=burger` → returns restaurants with "burger" in name + any items named "burger"

---

## Milestone 3 — Restaurant Owner Web (`restaurant-web`)

**Goal:** Restaurant owner can register, create their restaurant, manage menus.

### Tasks

- [ ] Convert restaurant-web from TS → JS
- [ ] Install: `@tanstack/react-query`, `zustand`, `axios`
- [ ] `authStore.js` with Zustand (token, user, login/logout)
- [ ] API service with Axios interceptors
- [ ] Login page
- [ ] Register page
- [ ] Dashboard layout (sidebar)
- [ ] Restaurant setup page (create/edit restaurant profile, upload logo/cover)
- [ ] Menu categories page (list, create, edit, delete)
- [ ] Menu items page (list, create, edit, delete, toggle availability, set discount)
- [ ] Promotions page: create/edit/delete cart-threshold promotion (title, spend ৳X get ৳Y off, expiry, active toggle)
- [ ] TanStack Query for all data fetching

### Test

- Register as restaurant_owner
- Create restaurant with logo
- Create 3 categories + 10 items
- Set 20% discount on 2 items
- Verify changes appear via API

---

## Milestone 4 — Order Placement — Customer App

**Goal:** Customer can browse as guest, add to cart, place order (cash on delivery first).

### App Open Flow (Guest Browsing)

```
App opens → Location permission prompt
  → Granted: use device GPS → home screen loads
  → Denied: map picker opens (fixed center pin, user pans to their area) → confirm → home screen loads
→ Home screen loads (NO login required — guest can browse freely)
→ Guest can: browse restaurants, search, view menus, add to cart
→ On "Place Order" button → Login/Register screen appears (forced here only)
→ After login → order placed
```

### Tasks

- [ ] Convert customer-app from TS → JS
- [ ] Install: `@tanstack/react-query`, `zustand`, `axios`, `socket.io-client`, `expo-location`, `react-native-maps`
- [ ] `authStore.js`, `cartStore.js`, `locationStore.js`
- [ ] App open: request location permission → store in `locationStore`
- [ ] Guest mode: app fully browsable without login
- [ ] Login + Register screens (shown only when placing order or accessing profile/orders)
- [ ] Home screen: location bar at top (tap to change) + banner slider + featured restaurants (sorted by `featuredSortOrder` asc) + nearby restaurants list (TanStack Query)
- [ ] Address picker: map screen opens → fixed pin at center of screen (absolutely positioned, not a map marker) → user drags/pans the map to align pin with their location → `onRegionChangeComplete` fires → reverse geocode center coords via OpenStreetMap Nominatim (free) → show address string below map → "Confirm Location" button saves `{ lat, lng, address }`
- [ ] Max 3 saved addresses per user (label: Home/Work/Other)
- [ ] Home screen: cuisine type icons row (Burger, Pizza, Biryani...) → tap filters restaurant list
- [ ] Home screen: restaurant filter sheet (rating, delivery time, delivery fee, cuisine, has discounts, **open now toggle**)
- [ ] Search screen: two tabs — "Restaurants" and "Dishes" (calls `/api/search?q=...`)
- [ ] Restaurant detail screen: menu by category
- [ ] Restaurant detail: ❤️ favorite button — toggle saved restaurants (login required)
- [ ] Restaurant detail: **floating "View Cart" sticky bar** at bottom — appears when cart has items, shows item count + total, taps to Cart screen
- [ ] Item detail bottom sheet: show customization options (radio/checkbox groups) before add to cart
- [ ] Item unavailable state: grayed out, "Unavailable" label, cannot add to cart
- [ ] Add to cart (Zustand) — only from one restaurant at a time; if different restaurant → alert to clear cart
- [ ] **Cart tab icon: red badge with item count**
- [ ] Cart screen: items with selected customizations shown, quantities, subtotal
- [ ] Cart screen: **promotion progress bar** — if restaurant has active promotion, show "Add ৳X more to get ৳Y off!" bar; fills as cart total increases; turns green + "৳Y discount applied!" when threshold reached
- [ ] Cart screen: promotion discount line shown in price breakdown when applied
- [ ] Checkout screen: select saved address OR inline "Add new address" if no saved addresses exist
- [ ] Checkout screen: **minimum order enforcement** — if cart subtotal < restaurant.minimumOrder, show "Minimum order is ৳X" and block Place Order
- [ ] Checkout screen: enter special instructions, choose Cash on Delivery
- [ ] Place order → POST `/api/orders` (login required — redirect if guest)
- [ ] Register screen: optional referral code input field at bottom ("Have a referral code?")
- [ ] Order detail screen: emit `join_order_room` on mount, `leave_order_room` on unmount — customer receives live location events on tracking screen
- [ ] Orders tab: list of own orders with status (login required)
- [ ] Order detail: **order status progress bar** — visual step indicator (Pending → Confirmed → Preparing → Ready → Picked Up → Delivered)
- [ ] Order detail: show `estimatedDeliveryTime` once order is confirmed
- [ ] Order detail: "Cancel Order" button — only visible when status = 'pending'
- [ ] Orders tab: "Reorder" button on past delivered orders → adds same items to cart
- [ ] Profile tab: name, phone, saved addresses, favourites list (login required)
- [ ] Profile tab: referral section — show own referral code + "Share" button + referral count
- [ ] Profile tab: **Change Password** option
- [ ] Profile tab: **Logout** button

### Test

- Open app without login → home screen loads with nearby restaurants
- Tap "Burger" cuisine icon → only burger restaurants show
- Apply filter: Rating 4.0+, Free delivery → list narrows
- Add items to cart as guest → tap Place Order → login screen appears
- Login → order placed
- Test address picker: autocomplete → drag pin → save as "Home"
- Add item from Restaurant A, then try to add from Restaurant B → alert appears
- Add a pizza with customizations: Size=Large, Extra Cheese → verify price adds up correctly
- Try to add an unavailable item → grayed out, no response
- Checkout with cash on delivery
- Restaurant has "Spend ৳1000, get ৳120 off" promotion → add ৳700 worth of items → cart shows "Add ৳300 more to get ৳120 off!" → add more → bar turns green, discount applied
- Add items below restaurant's minimum order → Place Order blocked with message
- See order appear in "My Orders"
- See order status progress bar update step by step
- Cancel the order while status=pending → order cancelled
- Complete another order → click Reorder → same items appear in cart
- Go to profile → see referral code, share it
- Test logout → app returns to guest mode
- Restaurant owner sees order in restaurant-web (orders page)

---

## Milestone 5 — Restaurant Order Management

**Goal:** Restaurant owner manages incoming orders on both mobile and web.

### Tasks

**Backend:**

- [ ] Restaurant order list + filter by status
- [ ] Confirm, preparing, ready, cancel endpoints

**restaurant-app (mobile):**

- [ ] Convert restaurant-app from TS → JS
- [ ] Install: `@tanstack/react-query`, `zustand`, `axios`, `socket.io-client`
- [ ] Login screen
- [ ] Dashboard: online/offline toggle, incoming orders list
- [ ] Order card with action buttons (Confirm → Preparing → Ready)
- [ ] Socket: join `restaurant:{id}` room, listen for `new_order`

**restaurant-web:**

- [ ] Orders page: table of orders, filter by status
- [ ] Status update buttons inline
- [ ] Socket listener for new orders (show toast/alert)

### Test

- Customer places order
- Restaurant app rings / shows new order immediately (socket)
- Owner clicks Confirm → customer sees "Confirmed" status
- Owner marks Ready → rider app can now see it

---

## Milestone 6 — Rider App & Delivery Flow

**Goal:** Rider can see ready orders, accept them, update status, share live location.

### Tasks

**Backend:**

- [ ] Available orders endpoint (orders with status=ready near rider)
- [ ] Accept order endpoint — **use atomic `findOneAndUpdate({ _id, status: 'ready', riderId: null })` to prevent two riders accepting same order** → status changes to `assigned`, returns 409 if already taken → call `cancelRiderTimeout(orderId)`
- [ ] `GET /orders/rider/queue` — returns all rider's orders with status `assigned` (their delivery queue)
- [ ] Picked-up endpoint → status: `picked_up`. Validate only one order per rider can be `picked_up` at a time
- [ ] Delivered endpoint → status: `delivered`. COD orders auto-set `paymentStatus: 'paid'`
- [ ] Rider online/offline toggle
- [ ] DeliveryTracking document created on accept (one per order)
- [ ] No-rider timeout: when order → `ready`, start in-memory setTimeout: 30s → re-broadcast to all riders; 60s → emit `unassigned_order_alert` to admin room
- [ ] On order delivered: calculate `riderEarning = deliveryFee`, `commissionAmount = subtotal * commissionRate / 100`, `restaurantPayout = subtotal - commissionAmount` → save to Order, increment `rider.earnings.total` and `rider.earnings.pending`
- [ ] `POST /api/orders/:id/rate` — save foodRating, riderRating, review to Order fields; create Review document in reviews collection; recalculate `restaurant.rating` avg and increment `restaurant.totalRatings`; set `order.isRated = true`
- [ ] `PUT /orders/:id/assign-rider` (admin) — manually assign or switch rider. Notify old rider (removed from queue), new rider (added to queue), customer (new rider info via `order_reassigned` event) → call `cancelRiderTimeout(orderId)`

**rider-app:**

- [ ] Convert rider-app from TS → JS
- [ ] Install: `@tanstack/react-query`, `zustand`, `axios`, `socket.io-client`, `expo-location`, `expo-task-manager`
- [ ] Login + Register screens
- [ ] Available Orders tab: cards with restaurant name, distance, payout (= delivery fee shown upfront) — rider can accept multiple
- [ ] Accept order button → order added to rider's queue
- [ ] Queue tab (or section): list of all accepted (assigned) orders waiting to be picked up
- [ ] Active Delivery tab: ONE current delivery (status=picked_up). Action buttons: "Picked Up" (on first order from queue) → "Delivered"
- [ ] When rider taps "Picked Up" on an order from queue → that order becomes active delivery, others stay in queue
- [ ] Listen for `order_cancelled` on all joined order rooms → remove cancelled order from queue store immediately
- [ ] After accepting order → immediately emit `join_order_room` for that orderId (to receive cancellation events)
- [ ] Background location tracking every 5s → emit `rider_location_update` with current active orderId via socket (only when an order is `picked_up`)
- [ ] When online but no active delivery → emit `rider_location_idle` every 30s (keeps admin map position fresh)
- [ ] Offline toggle: if rider has queued `assigned` orders → show "Complete your orders before going offline" — block the toggle
- [ ] On socket reconnect (internet restored) → if active order in store → immediately re-emit location, rejoin order room
- [ ] Delivery History tab: past orders with individual earnings
- [ ] Profile tab: online/offline toggle, earnings summary (total earned, pending payout)

**customer-app (rating flow):**

- [ ] When order status becomes `delivered` → show **Rate Your Order** bottom sheet (food rating 1-5 stars + rider rating 1-5 stars + optional comment)
- [ ] Submit → POST `/api/orders/:id/rate`
- [ ] If dismissed, show "Rate Order" button on order detail screen (visible while `isRated = false`)

### Test

- Rider goes online
- Sees available order (status=ready) — delivery fee shown as rider's payout
- Accepts it → status becomes `assigned`, order appears in rider's queue
- Accepts a second order → also in queue
- Customer sees "rider assigned" notification
- Rider taps "Picked Up" on first order → status: `picked_up`, live location begins for that order
- Customer of that order sees rider on map
- Rider marks "Delivered" → order complete, rider.earnings.pending increases by deliveryFee, COD order → paymentStatus: paid
- Rider moves to second order in queue, taps "Picked Up"
- Test timeout: no rider accepts for 60s → admin gets `unassigned_order_alert`
- Admin uses assign-rider → customer notified of new rider info
- Customer receives "Rate Your Order" prompt automatically
- Submit rating → restaurant.rating updates, order.isRated = true

---

## Milestone 7 — Live Location Tracking (Customer)

**Goal:** Customer can see rider's live location on a map.

### Tasks

**Backend:**

- [ ] Socket: broadcast `rider_location` to `order:{orderId}` room
- [ ] REST fallback: GET `/api/delivery/track/:orderId`
- [ ] On each `rider_location_update`: if `order.nearbyAlertSent = false`, calculate distance between rider and `order.deliveryAddress` — if ≤ 500m: emit `rider_nearby` to `user:{customerId}`, send push notification, set `order.nearbyAlertSent = true`

**customer-app:**

- [ ] Install: `react-native-maps` or `expo-maps`
- [ ] Live Tracking screen (`/order/track/[id]`)
- [ ] Connect to socket room `order:{orderId}`
- [ ] Listen for `rider_location` → update marker on map
- [ ] If no `rider_location` received for 15s → show "Connecting..." indicator on map; fetch last known location from REST fallback (`GET /api/delivery/track/:orderId`)
- [ ] On socket reconnect → indicator disappears, live updates resume automatically
- [ ] Show restaurant pin + customer pin + rider pin
- [ ] "Track Order" button on order detail screen
- [ ] Listen for `rider_nearby` event → show **banner alert** at top of screen: "Your rider is almost there! 🛵" (dismissed after 5s or on tap)
- [ ] Also show as push notification: "Your delivery is nearby!" (sent from server via Expo Push)
- [ ] Listen for `order_delivered` event on tracking screen → stop tracking, leave socket room, show "Order Delivered!" overlay → navigate to order detail after 2s

### Test

- Place order, complete milestone 6 flow
- Open tracking screen as customer
- Rider moves → marker updates in real-time on customer's map

---

## Milestone 8 — bKash Payment

**Goal:** Customer can pay via bKash for orders.

### Tasks

**Backend:**

- [ ] `bkash.service.js`: getToken, createPayment, executePayment, queryStatus, refund
- [ ] POST `/api/payments/bkash/create` → order must be status='payment_pending'; returns { paymentURL, paymentID }. Amount = order.total
- [ ] POST `/api/payments/bkash/execute` → idempotency check: if order.status !== 'payment_pending' return early (prevents double-execute). On success: status→'pending', paymentStatus→'paid', emit new_order to restaurant
- [ ] POST `/api/payments/bkash/callback` → bKash server-to-server webhook. Only logs/verifies — does NOT call execute (app does that via WebView)
- [ ] GET `/api/payments/bkash/status/:orderId`
- [ ] POST `/api/payments/bkash/refund` → accepts `{ orderId, amount, reason }`. On success: save `bkashRefundTrxID`, `refundedAmount`, set `refundStatus='completed'`, `paymentStatus='refunded'`. On failure: set `refundStatus='failed'`, emit `unprocessed_refund_alert` to admin room. Order is cancelled regardless of refund outcome.
- [ ] Auto-trigger refund in cancel endpoint: if `paymentMethod='bkash'` && `paymentStatus='paid'` → call refund before cancelling

**customer-app:**

- [ ] Install: `react-native-webview`
- [ ] Checkout screen: bKash option → POST /orders (status:'payment_pending') → POST /payments/bkash/create → navigate to bKash WebView screen
- [ ] bKash payment screen: WebView opening paymentURL
- [ ] Handle redirect callbacks via `onNavigationStateChange`: success → call execute API → navigate to success screen; failure/cancel → navigate back with error
- [ ] Payment success screen — show order number, "Your order is being prepared"

### Test

- Use bKash sandbox credentials
- Place order with bKash payment → verify order.status = 'payment_pending' before paying
- Complete mock payment in WebView
- Verify order.status = 'pending', paymentStatus = 'paid', bkashTrxID saved
- **Verify restaurant receives `new_order` socket event AFTER execute (not before)**
- Test payment failure → order.status = 'cancelled', customer notified
- Test cancel during payment (status='payment_pending') → cancelled, no refund
- Test cancel after payment (status='pending') → auto-refund triggered, verify `bkashRefundTrxID` saved, `refundStatus='completed'`, order cancelled
- Test admin manual refund → same fields saved

---

## Milestone 9 — Vouchers

**Goal:** Admin + restaurant owners create vouchers; customers apply them at checkout.

### Tasks

**Backend:**

- [ ] Admin Voucher CRUD (`POST /vouchers`, `GET /vouchers`, `PUT /vouchers/:id`, `DELETE /vouchers/:id`, `PUT /vouchers/:id/toggle`) — source: 'admin', can target all or specific restaurants
- [ ] Restaurant owner Voucher CRUD (`POST /restaurants/:id/vouchers`, `GET /restaurants/:id/vouchers`, `PUT /vouchers/:id`, `DELETE /vouchers/:id`, `PUT /vouchers/:id/toggle`) — source: 'restaurant', auto-sets restaurantId, owner can only manage own vouchers
- [ ] POST `/api/vouchers/validate` — checks both admin vouchers (applicable to this restaurant) AND restaurant's own vouchers, returns discount amount
- [ ] Apply voucher when placing order:
  - Check `voucher.isActive`, not expired
  - If `source='restaurant'`: voucher.restaurantId must match order.restaurantId
  - If `source='admin'` + `applicableTo='specific_restaurants'`: restaurantId must be in applicableRestaurants
  - Check `usageLimit`: atomic `findOneAndUpdate({ usedCount: { $lt: usageLimit } }, { $inc: { usedCount: 1 } })` — prevents over-use under concurrent requests (skip if `usageLimit = 0` = unlimited)
  - Check `perUserLimit`: count VoucherUsage for this userId — reject if count >= `perUserLimit`
  - Check `restrictedToUserId`: if set, reject if different user
  - If promotion already applied (`promotionDiscount > 0`): reject voucher — cannot stack
- [ ] Track VoucherUsage on successful order placement

**admin-web:**

- [ ] Convert admin-web from TS → JS
- [ ] Install: `@tanstack/react-query`, `zustand`, `axios`
- [ ] Login page
- [ ] Dashboard layout (sidebar)
- [ ] Vouchers list page (shows all vouchers — admin + restaurant-created)
- [ ] Create voucher form (code, type, value, expiry, usage limits, applicable restaurants)
- [ ] Toggle active/inactive for any voucher

**restaurant-web:**

- [ ] Vouchers section in restaurant dashboard
- [ ] List own restaurant's vouchers (usage stats: usedCount / usageLimit)
- [ ] Create voucher form (code, type, value, minOrder, usageLimit, perUserLimit, expiry)
- [ ] Toggle active/inactive, delete own vouchers

**customer-app:**

- [ ] Voucher input field on checkout screen — **hidden/disabled if a restaurant promotion is already applied** (show "Promotion applied — voucher not combinable")
- [ ] If no promotion active → voucher input enabled, validate on blur → show discount preview
- [ ] Apply to order total

### Test

- Admin creates: "WELCOME50" — 50% off, max 100 BDT, min order 200 BDT (applies to all restaurants)
- Restaurant owner creates: "BIRYANI20" — ৳20 off, min order 300 BDT, usageLimit 50
- Customer applies "BIRYANI20" at that restaurant's checkout → discount applied
- Customer tries "BIRYANI20" at a different restaurant → rejected
- VoucherUsage record created, usedCount increments
- Try to use same code twice (perUserLimit=1) → rejected
- Restaurant has active promotion → voucher field hidden
- usageLimit reached → code rejected for next customer

---

## Milestone 10 — Super Admin Dashboard

**Goal:** Admin can manage all entities from the web dashboard.

### Tasks

**admin-web:**

- [ ] Dashboard overview: total orders, total revenue (gross), commission earned (FoodBela's cut), active restaurants, active riders (with charts)
- [ ] Users page: list all users, filter by role, activate/deactivate
- [ ] Riders page: list, approve/reject pending riders, view each rider's earnings
- [ ] Restaurants page: list, approve/reject, deactivate, toggle `isFeatured`
- [ ] Restaurant detail page: view menu, orders, payout history
- [ ] Orders page: all orders, filter by status/restaurant/date, force-cancel
- [ ] Banners page: create/edit/delete banners (image, type, link to restaurant or voucher)
- [ ] Commission settings: (future) per-restaurant override of default 10%
- [ ] **Live Map page** (`/map`): full-screen map showing entire city operations in real-time:
  - All online riders as pins with 3 colors: **green=idle** (online, no orders), **yellow=queued** (has assigned orders, at restaurant), **blue=delivering** (picked_up, en route) — idle location via `rider_location_idle` event every 30s; delivering location via `admin_rider_location` socket event
  - All approved restaurants as pins (color: green=open+preparing, yellow=open+idle, red=closed)
  - Click rider pin → popup: name, phone, online status, current order (if any), earnings today
  - Click restaurant pin → popup: name, isOpen, active orders count, total orders today
  - TanStack Query polls `GET /api/admin/map` every 30s for restaurant data; rider pins update live via `admin_rider_location` socket event
  - Admin receives `unassigned_order_alert` socket events → toast notification with "Assign Rider" button → opens rider picker modal

**Backend (map route):**

- [ ] `GET /api/admin/map` — returns:
  - `riders`: all approved riders with `{ _id, name, phone, isOnline, currentLocation, activeOrderId }`
  - `restaurants`: all approved+active restaurants with `{ _id, name, location, isOpen, activeOrderCount, totalOrdersToday }`
- [ ] `PUT /orders/:id/assign-rider` — admin manually assigns/switches rider (already in order routes)

**Payout Management (admin-web):**

- [ ] Rider payout page: list riders with `earnings.pending > 0` → "Pay Now" button → enter amount + bKash TrxID → creates Payout record, resets pending
- [ ] Restaurant payout page: list restaurants with pending payout → same flow
- [ ] COD collection page: list COD orders with `payoutStatus = 'pending_collection'` → "Mark Collected" button → creates `cod_collection` Payout record
- [ ] Payout history page: full log of all payouts/collections with filters

**Backend (payout routes):**

- [ ] `POST /api/payouts/rider` — admin pays rider, creates Payout record
- [ ] `POST /api/payouts/restaurant` — admin pays restaurant, creates Payout record
- [ ] `POST /api/payouts/cod-collection` — admin marks COD cash collected from rider
- [ ] `GET /api/payouts` — list all payouts (admin)
- [ ] `GET /api/payouts/pending` — summary of all pending payouts (bKash) + pending collections (COD)

### Test

- New restaurant registers → admin sees pending approval
- Admin approves → restaurant can now accept orders
- New rider registers → admin approves
- Admin views all orders, filters by date
- Complete a bKash order → order shows in "Pending Payouts" list
- Admin pays rider → Payout record created, rider.earnings.pending = 0
- Complete a COD order → order shows in "Pending COD Collections" list
- Admin marks collected → payoutStatus = 'collection_completed'

---

## Milestone 11 — Notifications

**Goal:** Real-time and persistent notifications for all actors.

### Tasks

**Backend:**

- [ ] `notification.service.js` — createNotification helper
- [ ] Emit `notification` socket event to `user:{userId}` room
- [ ] Notification endpoints (list, mark read, unread count)
- [ ] Add notification creation to all key events (order placed, confirmed, etc.)

**All Apps:**

- [ ] Notification bell icon in header with unread count badge
- [ ] Notifications screen
- [ ] TanStack Query polling or socket update for count
- [ ] Mark as read on open

**Mobile — FCM Push Notifications (required):**

- [ ] Install `expo-notifications` on customer-app/rider-app
- [ ] On app launch: request permission + get Expo push token → POST to `/api/v1/auth/push-token`
- [ ] Server saves token to `user.expoPushToken`
- [ ] Install `firebase-admin` on server
- [ ] Set up Firebase project + download service account key
- [ ] `services/pushNotificationService.js`: Send FCM push with image + sound + groupKey + action data
- [ ] All notification types: include `image`, `sound`, `groupKey`, `actionType`, `actionData` fields
- [ ] Expo app receives FCM → handles notification tap with `actionType` (navigate to order, etc.)

### Test

- Place order → customer, restaurant both receive notifications
- Order confirmed → customer notification
- Rider assigned → customer notification
- All notifications appear in notification screen

---

## Milestone 12 — Reviews Display & Referral Rewards

**Goal:** Show reviews publicly, restaurant can see reviews, referral reward auto-triggers.

### Tasks

**Backend:**

- [ ] `GET /api/restaurants/:id/reviews` — list reviews for a restaurant (public, paginated)
- [ ] Referral reward logic: when a referred user's first order is delivered → auto-create ৳50 voucher for referrer (capped at 50 referrals), send notification to referrer

**customer-app:**

- [ ] Restaurant detail screen: show reviews section (recent reviews with food rating, comment)
- [ ] Show average rating on restaurant cards/header

**restaurant-web:**

- [ ] Reviews section on restaurant dashboard (list of all reviews with ratings + comments)

### Test

- Complete a delivery → see review on restaurant detail screen
- User A refers User B → User B places first order → User B's order delivered → User A gets ৳50 voucher automatically
- User A sees voucher in profile referral section
- Restaurant owner sees reviews on dashboard

---

## Milestone 13 — Polish & Production Prep

**Goal:** Handle edge cases, cleanup, and prepare for deployment.

### Tasks

- [ ] Input validation with `express-validator` on all endpoints
- [ ] Rate limiting with `express-rate-limit`
- [ ] CORS configuration for production URLs
- [ ] Helmet.js for security headers
- [ ] Order number auto-generation (FB-2024-00001 format)
- [ ] Handle socket disconnections gracefully
- [ ] Loading states and error states in all apps
- [ ] Empty states (no restaurants, no orders, etc.)
- [ ] Image compression before upload
- [ ] Environment-based API URLs in all apps
- [ ] Deployment: Server on Railway/Render, Web apps on Vercel

---

## Dependency Summary

### Server

```json
{
  "express": "latest",
  "mongoose": "latest",
  "socket.io": "latest",
  "jsonwebtoken": "latest",
  "bcryptjs": "latest",
  "dotenv": "latest",
  "cors": "latest",
  "multer": "latest",
  "cloudinary": "latest",
  "axios": "latest",
  "express-validator": "latest",
  "express-rate-limit": "latest",
  "helmet": "latest",
  "winston": "latest",
  "morgan": "latest",
  "expo-server-sdk": "latest"
}
```

### Web Apps (admin-web, restaurant-web)

```json
{
  "@tanstack/react-query": "latest",
  "zustand": "latest",
  "axios": "latest",
  "socket.io-client": "latest"
}
```

### Mobile Apps (customer-app, rider-app, restaurant-app)

```json
{
  "@tanstack/react-query": "latest",
  "zustand": "latest",
  "axios": "latest",
  "socket.io-client": "latest",
  "expo-location": "latest",
  "react-native-webview": "latest",
  "expo-notifications": "latest"
}
```

---

## Quick Reference — Order Status Flow

```
[bKash]  payment_pending → pending → confirmed → preparing → ready → assigned → picked_up → delivered
[COD]                       pending → confirmed → preparing → ready → assigned → picked_up → delivered
                                                                                      ↓
                                                                               cancelled (any actor)

Note: new_order socket event fires when status becomes 'pending' (NOT at order creation for bKash)
```

## Quick Reference — Who Does What

| Action                               | Actor    | App                             |
| ------------------------------------ | -------- | ------------------------------- |
| Browse + order food                  | Customer | customer-app                    |
| Pay via bKash                        | Customer | customer-app                    |
| Track live delivery                  | Customer | customer-app                    |
| Rate order                           | Customer | customer-app                    |
| Toggle online                        | Rider    | rider-app                       |
| Accept order                         | Rider    | rider-app                       |
| Share live location                  | Rider    | rider-app                       |
| Update status (picked up, delivered) | Rider    | rider-app                       |
| Toggle restaurant open/closed        | Owner    | restaurant-app                  |
| Confirm/prepare/ready order          | Owner    | restaurant-app + restaurant-web |
| Build restaurant + menus             | Owner    | restaurant-web                  |
| Set item discounts                   | Owner    | restaurant-web                  |
| Approve restaurants + riders         | Admin    | admin-web                       |
| Create vouchers                      | Admin    | admin-web                       |
| Create/manage banners                | Admin    | admin-web                       |
| Feature a restaurant                 | Admin    | admin-web                       |
| View commission revenue + stats      | Admin    | admin-web                       |
| View all orders + stats              | Admin    | admin-web                       |
| Force cancel orders                  | Admin    | admin-web                       |
| View rider earnings                  | Admin    | admin-web                       |
