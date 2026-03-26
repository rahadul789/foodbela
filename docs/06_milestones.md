# Development Milestones

Each milestone is self-contained: implement → test → move on.
Test each milestone before starting the next one.

---

## Milestone 1 — Project Setup & Server Foundation

**Goal:** Working Express server with DB connection, auth, and file structure.

### Tasks

- [ ] Set up `server/` with Express, MongoDB, Socket.IO
- [ ] Create all 18 Mongoose models (from database schema doc — includes Counter, CuisineType, SystemSettings, AdminActivityLog, BroadcastNotification)
- [ ] JWT auth middleware (`auth.middleware.js`)
- [ ] Role middleware (`role.middleware.js`)
- [ ] Global error handler (`error.middleware.js`)
- [ ] Rate limiter middleware (`rateLimiter.middleware.js`) — apply to all routes: 100 req/15min general; auth routes stricter: 10 req/15min
- [ ] Input validation middleware (`validate.middleware.js`) — wraps `express-validator` check arrays, returns 400 with `errors[]` on failure
- [ ] Admin activity logger middleware (`adminActivity.middleware.js`) — wraps admin controllers, logs action/targetType/targetId/ip to AdminActivityLog
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
- [ ] On register (role=rider or restaurant_owner): emit `new_registration_alert` to `admin` room + push notification to admin → admin sees pending approval badge on dashboard
- [ ] On `PUT /users/:id/approve-rider`: emit `rider_approved` to `user:{riderId}` room + push notification to rider ("আপনার account approve হয়েছে!" or "Rejected: reason")
- [ ] On `PUT /restaurants/:id/approve`: emit `restaurant_approved` to `user:{ownerId}` room + push notification to restaurant owner
- [ ] `isOpen=false` policy enforced in backend: toggle-open only blocks NEW orders — do NOT cancel existing active orders
- [ ] Forgot password endpoint (`POST /api/v1/auth/forgot-password`) → generate crypto token → hash → save to `user.passwordResetToken` + `user.passwordResetExpiry` (15min) → send plain token via email (nodemailer)
- [ ] Reset password endpoint (`POST /api/v1/auth/reset-password`) → hash incoming token → find user where token matches + expiry > now → update password → clear token fields
- [ ] `GET /health` endpoint (outside `/api/v1/`) → returns DB connection status — for Kubernetes liveness + readiness probes
- [ ] Rider assignment cron job (`jobs/riderAssignment.job.js`) — runs every 30s via `node-cron`:
  - Query: `{ status: 'ready', riderId: null, riderAssignmentDeadline: { $lt: Date.now() } }`
  - Re-broadcast: query online riders `{ role:'rider', isOnline:true, isApproved:true }` → emit `new_order_available` to each `user:{riderId}` room individually (NOT `riders_online` room broadcast — riders_online is for server-side tracking only)
  - If deadline passed by 60s+ → emit `unassigned_order_alert` to admin room
  - **Kubernetes-safe**: DB-based check, works across all pods (replaces old in-memory `pendingOrderTimeouts` Map)
- [ ] Proper logging: Winston (structured logs to file) + Morgan (HTTP request logs)
  - See `docs/07_email_fcm_setup.md` Part 4 for Winston configuration + usage
- [ ] Firebase Admin SDK setup for push notifications (FCM)
  - See `docs/07_email_fcm_setup.md` Part 2 for Firebase setup + service account key
- [ ] Nodemailer setup for email service (password reset, order confirmations)
  - See `docs/07_email_fcm_setup.md` Part 1 for Nodemailer configuration
- [ ] All new files across all apps → write in `.js` or `.jsx` only (existing `.ts`/`.tsx` files stay unchanged)
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

- [ ] New files → write in `.js`/`.jsx` (existing files stay as-is)
- [ ] Install: `@tanstack/react-query`, `zustand`, `axios`
- [ ] `authStore.js` with Zustand (token, user, login/logout)
- [ ] API service with Axios interceptors — **401 response → auto logout → redirect to /login** (JWT expired or invalid)
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

- [ ] New files → write in `.js`/`.jsx` (existing files stay as-is)
- [ ] Install: `@tanstack/react-query`, `zustand`, `axios`, `socket.io-client`, `expo-location`, `react-native-maps`
- [ ] `authStore.js`, `cartStore.js`, `locationStore.js`
- [ ] Axios interceptor: **401 response → authStore.logout() → navigate to Login screen** (handles JWT expiry mid-session)
- [ ] App open: request location permission → store in `locationStore`
- [ ] Guest mode: app fully browsable without login
- [ ] Login + Register screens (shown only when placing order or accessing profile/orders)
- [ ] Home screen: location bar at top (tap to change) + banner slider + featured restaurants (sorted by `featuredSortOrder` asc) + nearby restaurants list (TanStack Query)
- [ ] Address picker: map screen opens → fixed pin at center of screen (absolutely positioned, not a map marker) → user drags/pans the map to align pin with their location → `onRegionChangeComplete` fires → reverse geocode center coords via OpenStreetMap Nominatim (free) → show address string below map → "Confirm Location" button saves `{ lat, lng, address }`
- [ ] Max 3 saved addresses per user (label: Home/Work/Other)
- [ ] Home screen: fetch cuisine types from `GET /api/v1/cuisine-types` (TanStack Query, cache 30min) → render as horizontal scrollable icon chips → tap filters restaurant list. **Do NOT hardcode categories** — admin manages the list
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
- [ ] `PUT /orders/:id/update-eta` — restaurant owner updates ETA. Allowed only when status = 'confirmed' or 'preparing'. Saves new `estimatedDeliveryTime` → emits `order_eta_updated` socket event to customer → sends push notification: "⏱ Your order will take a bit longer — new ETA: X mins"
- [ ] One restaurant per owner enforced: `POST /restaurants` → check if owner already has a restaurant → return 400 if yes

**restaurant-app (mobile):**

- [ ] New files → write in `.js`/`.jsx` (existing files stay as-is)
- [ ] Install: `@tanstack/react-query`, `zustand`, `axios`, `socket.io-client`, `expo-notifications`
- [ ] Axios interceptor: **401 response → authStore.logout() → navigate to Login screen**
- [ ] Login → `GET /restaurants/my` → if `restaurant.isApproved = false` → show "Pending admin approval" screen → listen for `restaurant_approved` socket event → if approved: navigate to dashboard; if rejected: show reason
- [ ] If `restaurant.isApproved = true` → auto-load dashboard normally
- [ ] Dashboard: open/closed toggle, incoming orders list
- [ ] Order card with action buttons (Confirm → Preparing → Ready → Cancel)
- [ ] On Confirm: show ETA input (minutes) → `PUT /orders/:id/confirm { estimatedDeliveryTime }`
- [ ] On Preparing: show "Update ETA" button → input new minutes → `PUT /orders/:id/update-eta { estimatedDeliveryTime }`
- [ ] Socket: join `restaurant:{id}` room on login, listen for `new_order` event
- [ ] `new_order` arrives → play sound + show in-app alert + add to orders list
- [ ] FCM push: `new_order` notification → tap → deep link to OrderDetail screen
- [ ] On notification tap → `addNotificationResponseReceivedListener` → navigate to OrderDetail
- [ ] Cold start: `getLastNotificationResponseAsync()` → navigate if pending notification
- [ ] Token refresh: sync `expoPushToken` on launch → POST `/api/v1/auth/push-token`
- [ ] Permission denied: show soft banner "Enable notifications to get new orders instantly"

**restaurant-web (backup order management):**
> restaurant-app = PRIMARY (push notifications + sound alerts). restaurant-web = BACKUP (no push, browser must be open).
- [ ] Orders page: live list of orders filtered by status tabs (New / Active / Done)
- [ ] Socket: join `restaurant:{id}` room → `new_order` event → show in-app toast + badge count on Orders tab
- [ ] Persistent banner on Orders page: "📱 For real-time alerts, use the FoodBela Restaurant App"
- [ ] Full action buttons: Confirm → Preparing → Ready → Cancel (same API as restaurant-app)
- [ ] On Confirm: ETA input field (minutes) required before confirming
- [ ] On Preparing: "Update ETA" button → input new time → `PUT /orders/:id/update-eta`
- [ ] Order detail modal: items, customer note, delivery address, payment method
- [ ] Auto-refresh order list on socket events (new order, status change, cancellation, ETA update)

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
- [ ] `POST /api/orders/:id/rate` — save foodRating, deliveryRating, review to Order fields; create Review document in reviews collection; recalculate `restaurant.rating` avg and increment `restaurant.totalRatings`; set `order.isRated = true`
- [ ] `PUT /orders/:id/assign-rider` (admin) — manually assign or switch rider. Notify old rider (removed from queue), new rider (added to queue), customer (new rider info via `order_reassigned` event) → call `cancelRiderTimeout(orderId)`

**rider-app:**

- [ ] New files → write in `.js`/`.jsx` (existing files stay as-is)
- [ ] Install: `@tanstack/react-query`, `zustand`, `axios`, `socket.io-client`, `expo-location`, `expo-task-manager`
- [ ] Axios interceptor: **401 response → authStore.logout() → navigate to Login screen**
- [ ] Login + Register screens
- [ ] On register success → show "Pending admin approval" screen (rider cannot use app until approved)
- [ ] Listen for `rider_approved` socket event → if approved: navigate to main app; if rejected: show reason
- [ ] Available Orders tab: cards with restaurant name, distance, payout (= delivery fee shown upfront) — rider can accept multiple
- [ ] Accept order button → POST accept API → if **409** (already taken by another rider) → show toast "Order already taken" → remove from available list → navigate back (do NOT crash)
- [ ] Listen for `order_accepted_by_rider` socket event → if that `orderId` exists in available orders list → **auto-remove it immediately** (prevents other riders from tapping a stale card)
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
- [ ] POST `/api/v1/orders/:id/refund` (admin only) → validate `refundStatus='processing'` (400 if not), validate not already refunded (409 if yes) → call bKash refund API → on success: save `bkashRefundTrxID`, set `refundStatus='completed'`, `refundCompletedAt=now`, `paymentStatus='refunded'`, emit `refund_completed` to customer → on failure: set `refundStatus='failed'`, `refundFailureReason`, emit `refund_failed` to customer + `unprocessed_refund_alert` to admin room
- [ ] Cancel endpoint: if `paymentMethod='bkash'` && `paymentStatus='paid'` → set `refundStatus='processing'`, `refundInitiatedAt=now`, `refundProcessingUntil=now+2h` → emit `refund_processing` to customer → emit `pending_refunds_updated` to admin room (NO automatic bKash API call — admin processes manually)

**admin-web:**

- [ ] GET `/api/v1/refunds/pending` → show table: order number, customer name, amount, time remaining until SLA deadline, "Process Refund" button
- [ ] GET `/api/v1/refunds/completed` → refund history table
- [ ] Listen for `pending_refunds_updated` socket event → re-fetch pending count badge in real-time
- [ ] "Process Refund" button → POST `/api/v1/orders/:id/refund { amount }` → show success/failure toast

**customer-app:**

- [ ] Install: `react-native-webview`
- [ ] Checkout screen: bKash option → POST /orders (status:'payment_pending') → POST /payments/bkash/create → navigate to bKash WebView screen
- [ ] bKash payment screen: WebView opening paymentURL
- [ ] Handle redirect callbacks via `onNavigationStateChange`: success → call execute API → navigate to success screen; failure/cancel → navigate back with error
- [ ] Payment success screen — show order number, "Your order is being prepared"
- [ ] Order detail screen: if `refundStatus='processing'` → show "Refund processing — will be completed by [refundProcessingUntil]" banner
- [ ] Listen for `refund_processing` socket event → show "Refund initiated" toast + update UI
- [ ] Listen for `refund_completed` socket event → show "Refund of ৳X completed! Check your bKash" notification
- [ ] Listen for `refund_failed` socket event → show "Refund failed. Contact support" notification

### Test

- Use bKash sandbox credentials
- Place order with bKash payment → verify order.status = 'payment_pending' before paying
- Complete mock payment in WebView
- Verify order.status = 'pending', paymentStatus = 'paid', bkashTrxID saved
- **Verify restaurant receives `new_order` socket event AFTER execute (not before)**
- Test payment failure → order.status = 'cancelled', customer notified
- Test cancel during payment (status='payment_pending') → cancelled, no refund
- Test cancel after payment (status='pending') → verify `refundStatus='processing'`, customer receives `refund_processing` socket event, admin dashboard shows pending refund
- Admin manually processes refund → verify `bkashRefundTrxID` saved, `refundStatus='completed'`, customer receives `refund_completed` notification
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

- [ ] New files → write in `.js`/`.jsx` (existing files stay as-is)
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

- [ ] Axios interceptor: **401 response → authStore.logout() → redirect to /login**
- [ ] Dashboard overview: total orders, total revenue (gross), commission earned (FoodBela's cut), active restaurants, active riders (with charts)
- [ ] **Pending Approvals badge** in sidebar → count of unapproved riders + restaurants
- [ ] Listen for `new_registration_alert` socket event → increment badge count in real-time → show toast "নতুন rider registration আছে"
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

**7 Admin Features — Backend:**

- [ ] `cuisineType.routes.js` + `cuisineType.controller.js`: CRUD for cuisine types (admin) + `GET /cuisine-types` (public, active only)
- [ ] `analytics.routes.js` + `analytics.controller.js`: Overview, orders over time, top restaurants/riders/customers, payment breakdown — all use MongoDB aggregation pipeline with `$match` (date range), `$group`, `$sort`
- [ ] `review.routes.js` + `review.controller.js`: Submit review (customer, once per delivered order), moderation queue (admin: approve/reject with reason). Add `status`, `rejectedReason`, `moderatedBy`, `moderatedAt` fields to Review model
- [ ] `broadcast.routes.js` + `broadcast.controller.js`: Create broadcast → resolve recipients by targetRole → bulk create Notification docs → batch send FCM push (500 tokens/request) → update deliveredCount + status
- [ ] `export.routes.js` + `export.controller.js`: Streaming CSV export for orders, payouts, riders, customers, restaurants. Uses `fast-csv` + Mongoose cursor → pipe to response (no memory bloat)
- [ ] `settings.routes.js` + `settings.controller.js`: GET + PUT singleton SystemSettings (`_id='global'`). Upsert on first access. Logs changes to AdminActivityLog with before/after diff
- [ ] `activityLog.routes.js` + `activityLog.controller.js`: Paginated read-only log with filters (adminId, action, targetType, date range)
- [ ] Seed default CuisineTypes on first boot: Bengali, Chinese, Indian, Thai, Italian, Japanese, Korean, Fast Food, Pizza, Burger, Biryani, Kebab
- [ ] Seed default SystemSettings (`_id='global'`) on first boot if not exists
- [ ] Wire `adminActivity.middleware.js` to all admin-mutating routes (approve, reject, cancel, refund, payout, voucher CRUD, banner CRUD, settings update, review moderation, broadcast)

**7 Admin Features — admin-web:**

- [ ] **Analytics page** (`/analytics`): Date range picker (default: last 30 days) → overview cards (orders, revenue, commission, active users) + revenue/orders line chart (recharts) + top restaurants/riders tables + payment method pie chart
- [ ] **Review Moderation page** (`/reviews`): Table with status tabs (Pending / Approved / Rejected) → click row → expand review (customer, restaurant, rating, comment) → Approve or Reject (with reason modal) → API call → toast success → refresh list
- [ ] **Notification Broadcast page** (`/notifications`): Composer form (title, body, image upload, target role dropdown, optional specific user multiselect) → preview card → Send button → POST /broadcasts → history table below with sent date, recipients, delivered count, status
- [ ] **Cuisine Types page** (`/cuisine-types`): Sortable table (drag to reorder sortOrder) → Add button → modal form (name, slug auto-generated from name, icon upload, isActive toggle) → Edit/Delete actions. Delete blocked if restaurants use this type
- [ ] **System Settings page** (`/settings`): Form with sections: General (appName), Fees (commissionRate, defaultDeliveryFee, minOrderAmount), Delivery (maxDeliveryRadius, riderAssignmentTimeout), Maintenance (toggle + message), Support (phone, email), Social (facebook, instagram) → Save button → PUT /settings → toast success
- [ ] **Activity Log page** (`/activity-log`): Table with columns: Date, Admin, Action, Target, Details → filters: admin dropdown, action type dropdown, date range → click row → expand details JSON (before/after values)
- [ ] **Export Data page** (`/export`): Cards for each export type (Orders, Payouts, Riders, Customers, Restaurants) → each card has date range picker + optional filters + Download CSV button → triggers `GET /export/{type}?from&to` → browser downloads file
- [ ] Add sidebar navigation items for all 7 new pages with icons
- [ ] Wire `recharts` library for analytics charts (line chart, bar chart, pie chart)

### Test

- New restaurant registers → admin sees pending approval
- Admin approves → restaurant can now accept orders
- New rider registers → admin approves
- Admin views all orders, filters by date
- Complete a bKash order → order shows in "Pending Payouts" list
- Admin pays rider → Payout record created, rider.earnings.pending = 0
- Complete a COD order → order shows in "Pending COD Collections" list
- Admin marks collected → payoutStatus = 'collection_completed'
- **Analytics**: Select date range → overview shows correct totals → charts render → top restaurants sorted by revenue
- **Reviews**: Submit review as customer → appears in admin Pending tab → admin approves → visible on restaurant page → admin rejects another → hidden with reason
- **Broadcast**: Admin sends push to all customers → BroadcastNotification doc created → Notification docs created for each customer → FCM push sent → history shows delivered count
- **Cuisine Types**: Admin adds "Mexican" → appears in public GET → admin reorders → customer app shows new order → admin deactivates → hidden from customer
- **Settings**: Admin updates commissionRate to 12% → next order uses 12% → admin enables maintenanceMode → non-admin login returns 503 → admin disables → login works again
- **Activity Log**: Every admin action above appears in log with correct action type, target, and admin name
- **Export**: Admin exports orders CSV → file downloads with correct columns and filtered data → large dataset streams without timeout

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
- [ ] On app launch: request push notification permission → if denied → show banner "Enable notifications to get order updates" (do NOT crash or block app)
- [ ] Get Expo push token → compare with stored token → if changed (reinstall/new device) → POST to `/api/v1/auth/push-token` to update DB
- [ ] Server saves token to `user.expoPushToken`
- [ ] Install `firebase-admin` on server
- [ ] Set up Firebase project + download service account key
- [ ] `services/pushNotificationService.js`: Send FCM push with image + sound + groupKey + action data
- [ ] All notification payloads include: `{ title, body, sound, image?, groupKey, data: { screen, orderId?, restaurantId? } }`
- [ ] **Deep link on notification tap** — `addNotificationResponseReceivedListener`:
  ```
  data.screen === 'OrderDetail'      → navigate to Order Detail screen (orderId)
  data.screen === 'TrackingScreen'   → navigate to Live Tracking screen (orderId)
  data.screen === 'AvailableOrders'  → navigate to Available Orders tab (rider)
  data.screen === 'RefundDetail'     → navigate to Order Detail with refund banner
  data.screen === 'Notifications'    → navigate to Notifications screen
  ```
- [ ] **Cold start deep link** (app was completely killed when notification arrived) → on app mount call `Notifications.getLastNotificationResponseAsync()` → if exists → navigate to correct screen (same logic as above)
- [ ] **Token refresh** — call `addPushTokenListener` → if token changes → POST new token to `/api/v1/auth/push-token` immediately

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

## Milestone 14 — Bela Cat Mascot (customer-app)

**Goal:** Interactive cat mascot that guides users, reacts to actions, and emotionally connects with customers. Fully modular — all code in `modules/bela/`.

> See `docs/12_bela_cat_mascot.md` for full spec: moods, dialogues, touch interactions, animations, architecture.

### Tasks

**Setup & Core:**

- [ ] Create `modules/bela/` folder structure inside `customer-app/`
- [ ] Install `lottie-react-native` in customer-app
- [ ] Create `BelaProvider` context — manages mood, message queue, visibility, minimized state
- [ ] Create `useBela` hook — returns `triggerMood()`, `showMessage()`, graceful no-op if outside provider
- [ ] Wrap `app/_layout.jsx` with `BelaProvider` (single integration line)
- [ ] Create `BelaOverlay` — floating absolute-positioned container (bottom-right), renders character + bubble
- [ ] Create `BelaCharacter` — Lottie animation renderer, swaps animation file based on current mood
- [ ] Create `BelaBubble` — speech bubble component with auto-dismiss (4s default), queue system, cooldown (same message within 5min blocked), frequency cap (max 1 auto-bubble per 30s, taps bypass)

**Mood Engine (Passive — works without any screen using useBela):**

- [ ] `useBelaMood` hook inside BelaProvider — resolves current mood from priority: screen override > user action > time-based > context > default happy
- [ ] `useBelaScreen` hook — watches `usePathname()`, auto-triggers screen-specific dialogues from `data/dialogues.js`
- [ ] Time-based moods: morning greeting (6-11am), lunch prompt (12-2pm), evening (6-9pm), sleepy (12am-5am)
- [ ] Idle detection: 15s → wave, 30s → food suggestion, 60s → dramatic, 2min → falls asleep
- [ ] Socket listener in BelaProvider: listens to `order_confirmed`, `order_preparing`, `order_ready`, `order_picked_up`, `rider_nearby`, `order_delivered`, `order_cancelled` → triggers matching mood + dialogue

**Touch Interactions:**

- [ ] `useBelaTouch` hook — gesture handlers using React Native Gesture Handler or Pressable
- [ ] Single tap → random reaction (jump/meow/spin) + random Bangla response from pool
- [ ] Double tap → food tip or joke bubble
- [ ] Long press (1s+) → purring animation + optional haptic vibration
- [ ] Swipe right → Bela slides off screen → shows small paw icon at edge (minimized)
- [ ] Tap paw icon → Bela bounces back
- [ ] Shake device → easter egg: Bela gets dizzy (use `expo-sensors` Accelerometer)

**Dialogues & Data:**

- [ ] `data/dialogues.js` — all dialogue strings organized by screen + mood + context (all in Bangla)
- [ ] `data/moods.js` — 13 mood definitions with priority levels and animation mappings
- [ ] `data/achievements.js` — achievement definitions (1st order, 5th, 10th, 25th, 50th, first 5-star, first referral, first voucher, 3-day streak)
- [ ] `data/animations.js` — maps mood → Lottie file path

**Onboarding (First-Time User):**

- [ ] `BelaOnboarding` component — 4-step full-screen walkthrough (Welcome → Home guide → Search guide → Order flow guide)
- [ ] Store `hasCompletedOnboarding` in AsyncStorage — show only once
- [ ] After onboarding: Bela settles into floating position with intro message

**Achievements:**

- [ ] `useBelaAchievements` hook — tracks milestones in AsyncStorage (`belaAchievements` key)
- [ ] Triggers: first order, 5th/10th/25th/50th order, first 5-star review, first referral, first voucher, 3-day ordering streak
- [ ] Each achievement triggers special animation + unique Bangla celebration message
- [ ] Client-side only — no server/API calls needed

**Smart Behavior:**

- [ ] Auto-minimize during: bKash WebView, live tracking map full screen, any modal/bottom sheet
- [ ] If dismissed (swiped), stays minimized for session, returns on next app open
- [ ] `BelaMinimized` component — small paw icon that bounces when tapped

**User Settings:**

- [ ] Add to Profile > Settings screen: "Show Bela" toggle (default: on), "Bela Sound" toggle (default: off), "Bela Bubbles" toggle (default: on)
- [ ] Store in AsyncStorage under `belaSettings` key
- [ ] Respect settings in BelaProvider — if disabled, render nothing

**Animation Assets:**

- [ ] Create/source 20 Lottie animation JSON files (happy, excited, hungry, sleepy, curious, celebrating, sad, angry, proud, love, thinking, waving, pointing, tap-reaction, purring, sleeping, dizzy, slide-out, slide-in + 4 onboarding)
- [ ] Place in `modules/bela/assets/`
- [ ] Total target: ~1.5MB for all animations
- [ ] Lazy load — only one animation active at a time

**Performance:**

- [ ] `BelaContext` split so mood changes only re-render overlay, not screen children
- [ ] Lottie: one animation at a time (swap on mood change, unmount previous)
- [ ] Absolute positioning — zero layout impact on scroll/content
- [ ] AsyncStorage reads on mount only, cached in state

### Packages to Install (customer-app)

```bash
npx expo install lottie-react-native
npx expo install expo-sensors    # For shake detection easter egg
npx expo install expo-haptics    # For purr vibration on long press
```

### Test

- Fresh install → Bela onboarding appears → complete 4 steps → Bela settles bottom-right
- Home screen → Bela says greeting based on time of day
- Idle 30s → Bela suggests food
- Idle 2min → Bela falls asleep → tap → wakes up
- Add items to cart → Bela happy → empty cart → Bela sad
- Checkout screen → Bela guides through steps
- Apply voucher → Bela celebrates discount
- Place order → Bela celebrates
- Order confirmed via socket → Bela reacts "Restaurant confirm করেছে!"
- Order delivered via socket → Bela party animation
- Order cancelled → Bela sad
- Tap Bela → random Bangla response
- Double tap → food joke/tip
- Long press → purring + haptic
- Swipe right → Bela minimizes → tap paw → returns
- Shake phone → dizzy easter egg
- First order complete → achievement celebration
- Profile > Settings > disable Bela → cat disappears entirely → enable → returns
- Remove `BelaProvider` from layout → app works perfectly, `useBela()` returns no-ops

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
  "expo-notifications": "latest",
  "lottie-react-native": "latest",
  "expo-sensors": "latest",
  "expo-haptics": "latest"
}
```

### customer-app Only (Bela Mascot)

```
lottie-react-native, expo-sensors, expo-haptics are only needed in customer-app.
rider-app and restaurant-app do NOT need these packages.
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
