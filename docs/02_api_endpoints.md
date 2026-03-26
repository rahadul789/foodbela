# API Endpoints

Base URL: `http://localhost:5000/api/v1`

Auth header: `Authorization: Bearer <jwt_token>`

## Pagination Standard

All list endpoints use: `?page=1&limit=20` (default: page=1, limit=20)

```js
// Standard paginated response:
{
  success: true,
  data: [...],
  pagination: {
    total: 100,
    page: 1,
    limit: 20,
    pages: 5
  }
}
```

## Health Check — `/health`
> Outside `/api/v1/` — used by Kubernetes liveness + readiness probes. No auth required.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/health` | Public | Returns server + DB status. Kubernetes probe hits this every 10s |

```js
// Response (200 — healthy):
{ "status": "ok", "db": "connected", "uptime": 342.5, "timestamp": "2026-03-18T..." }

// Response (503 — unhealthy, DB down):
{ "status": "error", "db": "disconnected", "uptime": 342.5 }
```

Roles: `customer` | `rider` | `restaurant_owner` | `admin`

---

## Auth Routes — `/api/v1/auth`

| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| POST | `/auth/register` | `{ name, email, password, phone, role, referralCode? }` | Public | Register any user. If referralCode provided, saves referredBy |
| POST | `/auth/login` | `{ email, password }` | Public | Login, returns JWT. **If `maintenanceMode=true` in SystemSettings → non-admin users get 503 with `maintenanceMessage`. Admin role bypasses maintenance check.** |
| GET | `/auth/me` | — | Any auth | Get current user profile |
| PUT | `/auth/change-password` | `{ currentPassword, newPassword }` | Any auth | Change password |
| PUT | `/auth/profile` | `{ name, phone, profileImage }` | Any auth | Update own profile |
| GET | `/auth/notification-preferences` | — | Any auth | Get notification preferences (`{ orderUpdates, promotions, riderUpdates }` — all default true) |
| PUT | `/auth/notification-preferences` | `{ orderUpdates?, promotions?, riderUpdates? }` | Any auth | Update notification preferences. Server checks these before sending push notifications — if `promotions=false`, skip promo pushes |
| POST | `/auth/forgot-password` | `{ email }` | Public | Generate reset token → send email with reset link. Rate limited: 3 req/hour |
| POST | `/auth/reset-password` | `{ token, newPassword }` | Public | Validate token (15min expiry) → update password → clear token fields |

---

## User Routes — `/api/v1/users`

| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| GET | `/users` | — | admin | List all users with filters |
| GET | `/users/:id` | — | admin | Get user by ID |
| PUT | `/users/:id/status` | `{ isActive }` | admin | Activate/deactivate user |
| PUT | `/users/:id/approve-rider` | `{ isApproved }` | admin | Approve/reject rider → emit `rider_approved` to rider's socket room + push notification |
| GET | `/users/addresses` | — | customer | Get saved addresses |
| POST | `/users/addresses` | `{ label, address, lat, lng, isDefault }` | customer | Add address (max 3) |
| PUT | `/users/addresses/:addressId` | `{ label, address, lat, lng, isDefault }` | customer | Update address |
| DELETE | `/users/addresses/:addressId` | — | customer | Delete address |
| GET | `/users/favorites` | — | customer | Get favourite restaurants |
| POST | `/users/favorites/:restaurantId` | — | customer | Add to favourites |
| DELETE | `/users/favorites/:restaurantId` | — | customer | Remove from favourites |
| GET | `/users/referral` | — | customer | Get own referral code + referralCount |

---

## Restaurant Routes — `/api/v1/restaurants`

| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| POST | `/restaurants` | (see schema) | restaurant_owner | Create restaurant |
| GET | `/restaurants/my` | — | restaurant_owner | Get own restaurant(s) |
| PUT | `/restaurants/:id` | (partial update) | restaurant_owner | Update restaurant info |
| PUT | `/restaurants/:id/toggle-open` | `{ isOpen }` | restaurant_owner | Toggle open/close. **Policy:** `isOpen=false` only blocks NEW orders — existing active orders (pending/confirmed/preparing/ready) continue normally and must be fulfilled |
| GET | `/restaurants` | `?lat&lng&radius&cuisine&search&page` | customer | Search nearby restaurants. Always filters: isApproved=true, isActive=true. Optional: isOpen, minRating, maxDeliveryTime, maxDeliveryFee, hasDiscount, sortBy |
| GET | `/restaurants/:id` | — | Public | Get restaurant detail |
| GET | `/restaurants/:id/menu` | — | Public | Get full menu by restaurant |
| GET | `/restaurants/:id/reviews` | `?page` | Public | Get reviews for a restaurant (paginated) |
| GET | `/restaurants/all` | — | admin | List all restaurants |
| PUT | `/restaurants/:id/approve` | `{ isApproved }` | admin | Approve/reject restaurant → emit `restaurant_approved` to owner's socket room + push notification |
| PUT | `/restaurants/:id/admin-status` | `{ isActive }` | admin | Activate/deactivate |
| PUT | `/restaurants/:id/feature` | `{ isFeatured, featuredSortOrder }` | admin | Feature/unfeature + set display order |
| DELETE | `/restaurants/:id` | — | admin | Delete restaurant |

---

## Promotion Routes — `/api/v1/promotions`

| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| POST | `/promotions` | `{ restaurantId, title, thresholdAmount, discountType, discountValue, maxDiscount, expiresAt }` | restaurant_owner | Create promotion (replaces existing active one) |
| GET | `/promotions/:restaurantId` | — | Public | Get active promotion for a restaurant (used by customer app cart) |
| PUT | `/promotions/:id` | (partial update) | restaurant_owner | Update promotion |
| DELETE | `/promotions/:id` | — | restaurant_owner | Delete promotion |
| PUT | `/promotions/:id/toggle` | `{ isActive }` | restaurant_owner | Activate/deactivate |

---

## Menu Category Routes — `/api/v1/menu/categories`

| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| POST | `/menu/categories` | `{ restaurantId, name, description, image, sortOrder }` | restaurant_owner | Create category |
| GET | `/menu/categories/:restaurantId` | — | Public | Get all categories for restaurant |
| PUT | `/menu/categories/:id` | `{ name, description, image, sortOrder, isActive }` | restaurant_owner | Update category |
| DELETE | `/menu/categories/:id` | — | restaurant_owner | Delete category |

---

## Menu Item Routes — `/api/v1/menu/items`

| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| POST | `/menu/items` | `{ restaurantId, categoryId, name, price, ... }` | restaurant_owner | Create item |
| GET | `/menu/items/:restaurantId` | `?categoryId` | Public | Get menu items |
| GET | `/menu/items/single/:id` | — | Public | Get single item |
| PUT | `/menu/items/:id` | (partial update) | restaurant_owner | Update item |
| PUT | `/menu/items/:id/availability` | `{ isAvailable }` | restaurant_owner | Toggle availability |
| PUT | `/menu/items/:id/discount` | `{ type, value, validUntil }` | restaurant_owner | Set/remove discount |
| DELETE | `/menu/items/:id` | — | restaurant_owner | Delete item |

---

## Order Routes — `/api/v1/orders`

| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| POST | `/orders` | `{ restaurantId, items, deliveryAddress, paymentMethod, voucherCode?, specialInstructions? }` | customer | Place order. **Validates**: restaurant.isOpen=true (400 if closed), restaurant.isApproved=true, restaurant has ≥1 menu item, items exist and are available, minOrderAmount check (from SystemSettings), promotion/voucher mutual exclusivity. COD → status:'pending', emits new_order immediately. bKash → status:'payment_pending', restaurant NOT notified yet |
| GET | `/orders/my` | `?status&page` | customer | Get own orders |
| GET | `/orders/:id` | — | customer/rider/owner/admin | Get order detail |
| PUT | `/orders/:id/cancel` | `{ reason }` | customer | Cancel order. Allowed: status='payment_pending' or 'pending' only. **bKash + paymentStatus='paid'** → set refundStatus='processing', refundProcessingUntil=now+2h, emit `refund_processing` socket event, notify customer of 2-hour SLA. Admin processes manually via `/refunds` dashboard. **COD** → no refund needed (paymentStatus is still 'pending', no money collected). **bKash + paymentStatus='pending'** → just cancel, no refund. |
| POST | `/orders/:id/rate` | `{ foodRating, deliveryRating, comment }` | customer | Rate delivered order. Saves foodRating/deliveryRating/review to Order, creates Review document, updates restaurant.rating avg, sets order.isRated=true |

### Restaurant Owner Order Management
| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| GET | `/orders/restaurant/:restaurantId` | `?status&page` | restaurant_owner | Get restaurant orders |
| PUT | `/orders/:id/confirm` | `{ estimatedDeliveryTime }` | restaurant_owner | Confirm order — sets initial ETA |
| PUT | `/orders/:id/update-eta` | `{ estimatedDeliveryTime }` | restaurant_owner | Update ETA during preparing stage — emits `order_eta_updated` socket event + push notification to customer |
| PUT | `/orders/:id/preparing` | — | restaurant_owner | Mark as preparing |
| PUT | `/orders/:id/ready` | — | restaurant_owner | Mark as ready for pickup |
| PUT | `/orders/:id/restaurant-cancel` | `{ reason }` | restaurant_owner | Cancel order |

### Rider Order Management
| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| GET | `/orders/available-for-rider` | — | rider | Get ready orders near rider (rider can accept multiple) |
| PUT | `/orders/:id/accept` | — | rider | Accept order → status: `assigned`. Atomic, returns 409 if already taken |
| PUT | `/orders/:id/picked-up` | — | rider | Mark picked up → status: `picked_up`. Only one order in this state at a time. Starts live location sharing |
| PUT | `/orders/:id/delivered` | — | rider | Mark delivered. COD orders auto-set `paymentStatus: paid` |
| GET | `/orders/rider/queue` | — | rider | Get all rider's queued (assigned) orders |
| GET | `/orders/rider/history` | `?page` | rider | Get rider's order history |

### Admin Order Management
| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| GET | `/orders/admin/all` | `?status&restaurantId&page` | admin | Get all orders |
| PUT | `/orders/:id/admin-cancel` | `{ reason }` | admin | Force cancel |
| PUT | `/orders/:id/assign-rider` | `{ riderId }` | admin | Manually assign or switch rider — notifies old rider (removed from queue), new rider (order added), customer (updated rider info) |

### Admin Refund Management
| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| GET | `/refunds/pending` | `?page&limit` | admin | Get all pending refunds (refundStatus='processing'). Shows order number, customer, amount, SLA deadline, time remaining |
| GET | `/refunds/completed` | `?page&limit` | admin | Get completed refunds (history). Shows order, customer, amount, completion date |
| POST | `/orders/:id/refund` | `{ amount }` | admin | Manually process refund. **Idempotent** — uses atomic `findOneAndUpdate({ _id, refundStatus: 'processing', paymentStatus: 'paid' })`. Returns 400 if refundStatus≠'processing', 409 if already refunded. On success → refundStatus='completed', notify customer. On bKash API failure → refundStatus='failed', notify admin |

---

## Payment Routes — `/api/v1/payments`

| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| POST | `/payments/bkash/create` | `{ orderId }` | customer | Initiate bKash payment — returns paymentURL. Order must be status='payment_pending' |
| POST | `/payments/bkash/execute` | `{ paymentID, orderId }` | customer | Execute after customer pays. On success → order.status='pending', order.paymentStatus='paid', emits new_order to restaurant. On fail → order.status='cancelled', paymentStatus='failed' |
| POST | `/payments/bkash/callback` | — | Public (bKash webhook) | bKash server callback |
| GET | `/payments/bkash/status/:orderId` | — | customer | Query payment status |
| POST | `/payments/bkash/status-check` | `{ paymentID }` | internal | Query bKash payment status directly (internal use only — not exposed to client) |

---

## Delivery / Tracking Routes — `/api/v1/delivery`

| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| GET | `/delivery/track/:orderId` | — | customer/admin | Get current rider location for order |
| POST | `/delivery/location` | `{ orderId, lat, lng }` | rider | Update rider location (also via socket) |
| PUT | `/delivery/online-status` | `{ isOnline }` | rider | Go online/offline |

---

## Voucher Routes — `/api/v1/vouchers`

### Admin Vouchers (FoodBela-wide)
| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| POST | `/vouchers` | `{ code, type, value, minOrderAmount, maxDiscount, usageLimit, perUserLimit, applicableTo, applicableRestaurants?, expiresAt?, description }` | admin | Create FoodBela-wide voucher (source: 'admin') |
| GET | `/vouchers` | — | admin | List all vouchers (admin + restaurant) |
| GET | `/vouchers/:id` | — | admin | Get any voucher detail |
| PUT | `/vouchers/:id` | (partial update) | admin | Update any voucher |
| DELETE | `/vouchers/:id` | — | admin | Delete any voucher |
| PUT | `/vouchers/:id/toggle` | `{ isActive }` | admin | Activate/deactivate any voucher |

### Restaurant Vouchers (per restaurant)
| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| POST | `/restaurants/:id/vouchers` | `{ code, type, value, minOrderAmount, maxDiscount, usageLimit, perUserLimit, expiresAt?, description }` | restaurant_owner | Create voucher for own restaurant (source: 'restaurant', auto-sets restaurantId) |
| GET | `/restaurants/:id/vouchers` | — | restaurant_owner | List own restaurant's vouchers |
| PUT | `/vouchers/:id` | (partial update) | restaurant_owner | Update own voucher only |
| DELETE | `/vouchers/:id` | — | restaurant_owner | Delete own voucher only |
| PUT | `/vouchers/:id/toggle` | `{ isActive }` | restaurant_owner | Activate/deactivate own voucher |

### Public
| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| POST | `/vouchers/validate` | `{ code, restaurantId, orderTotal }` | customer | Validate code — checks admin vouchers (applicable to this restaurant) + restaurant's own vouchers |

---

## Notification Routes — `/api/v1/notifications`

| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| GET | `/notifications` | `?page` | Any auth | Get own notifications |
| PUT | `/notifications/:id/read` | — | Any auth | Mark as read |
| PUT | `/notifications/read-all` | — | Any auth | Mark all as read |
| GET | `/notifications/unread-count` | — | Any auth | Get unread count |

---

## Admin Routes — `/api/v1/admin`

| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| GET | `/admin/dashboard` | — | admin | Stats: orders, revenue, users, restaurants |
| GET | `/admin/riders` | — | admin | List all riders |
| GET | `/admin/riders/:id` | — | admin | Rider detail + stats |
| GET | `/admin/map` | — | admin | Live operations map data: all riders (location, online status, active order) + all restaurants (location, isOpen, active order count, total orders today) |

---

## Payout Routes — `/api/v1/payouts`

| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| GET | `/payouts/pending` | — | admin | Summary: pending bKash payouts + pending COD collections |
| POST | `/payouts/rider` | `{ riderId, amount, method, reference, orders[], periodFrom, periodTo, note }` | admin | Pay rider delivery fees |
| POST | `/payouts/restaurant` | `{ restaurantId, amount, method, reference, orders[], periodFrom, periodTo, note }` | admin | Pay restaurant earnings |
| POST | `/payouts/cod-collection` | `{ riderId, amount, orders[], note }` | admin | Record that rider submitted COD cash |
| GET | `/payouts` | `?type&recipientId&page` | admin | Full payout history |
| GET | `/payouts/rider/:riderId` | — | admin | All payouts for a specific rider |
| GET | `/payouts/restaurant/:restaurantId` | — | admin | All payouts for a specific restaurant |

---

## Cuisine Type Routes — `/api/v1/cuisine-types`

| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| GET | `/cuisine-types` | — | Public | Get all active cuisine types (for home screen filter chips) |
| GET | `/cuisine-types/all` | — | admin | Get all cuisine types including inactive |
| POST | `/cuisine-types` | `{ name, slug, icon?, isActive?, sortOrder? }` | admin | Create new cuisine type |
| PUT | `/cuisine-types/:id` | (partial update) | admin | Update cuisine type (name, icon, isActive, sortOrder) |
| DELETE | `/cuisine-types/:id` | — | admin | Delete cuisine type (only if no restaurants use it) |

> **Restaurant ↔ CuisineType:** `Restaurant.cuisineType` stores the slug string (not ObjectId) — keeps restaurant docs portable. Admin manages the master list here.

---

## Analytics Routes — `/api/v1/analytics`

> All analytics routes: admin only.

| Method | Endpoint | Query | Description |
|--------|----------|-------|-------------|
| GET | `/analytics/overview` | `?from&to` | Platform totals: total orders, total revenue (gross), commission earned, active customers, active riders, active restaurants for the period |
| GET | `/analytics/orders` | `?from&to&groupBy=day\|week\|month` | Orders + revenue over time (chart data). Returns `[{ date, orderCount, revenue, commission }]` |
| GET | `/analytics/restaurants` | `?from&to&page` | Top restaurants by revenue. Returns `[{ restaurant, orderCount, revenue, commission, avgOrderValue }]` |
| GET | `/analytics/riders` | `?from&to&page` | Top riders by deliveries. Returns `[{ rider, deliveryCount, totalEarnings, avgDeliveryTime }]` |
| GET | `/analytics/customers` | `?from&to&page` | Top customers by spend. Returns `[{ customer, orderCount, totalSpend, lastOrderAt }]` |
| GET | `/analytics/payments` | `?from&to` | Payment method breakdown: `{ bkash: { count, total }, cod: { count, total }, refunds: { count, total } }` |
| GET | `/analytics/export` | `?type=orders\|payouts\|riders&from&to` | CSV export (see Export Routes below) |

```js
// Example overview response:
{
  "success": true,
  "data": {
    "totalOrders": 1243,
    "totalRevenue": 524800,      // BDT (gross: food + delivery fee)
    "commissionEarned": 52480,   // 10% of food subtotal
    "activeCustomers": 389,      // placed at least 1 order in period
    "activeRiders": 24,
    "activeRestaurants": 31,
    "period": { "from": "2026-03-01", "to": "2026-03-26" }
  }
}
```

---

## Review Moderation Routes — `/api/v1/reviews`

| Method | Endpoint | Query/Body | Access | Description |
|--------|----------|-----------|--------|-------------|
| GET | `/reviews` | `?page&limit&status=pending\|approved\|rejected&restaurantId` | admin | List all reviews with filters. `status=pending` shows newly submitted reviews awaiting moderation |
| GET | `/reviews/:id` | — | admin | Get single review detail |
| PUT | `/reviews/:id/approve` | — | admin | Approve review — becomes visible on restaurant public page |
| PUT | `/reviews/:id/reject` | `{ reason }` | admin | Reject review — hidden from public, reason stored for audit |
| DELETE | `/reviews/:id` | — | admin | Permanently delete review (only for spam/abuse) |
| GET | `/restaurants/:id/reviews` | `?page&limit` | Public | Get approved reviews for a restaurant (customer-facing) |
| POST | `/orders/:id/review` | `{ rating, comment?, foodRating?, deliveryRating? }` | customer | Submit review after order delivered (only once per order) |

```js
// Review Schema additions (add to Review model in schema doc):
// status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
// rejectedReason: { type: String }
// moderatedBy: { type: ObjectId, ref: 'User' }
// moderatedAt: { type: Date }
// Index: reviews.status → index (admin moderation queue)
// Index: reviews.restaurantId, status → compound index
```

---

## Notification Broadcast Routes — `/api/v1/broadcasts`

| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| POST | `/broadcasts` | `{ title, body, imageUrl?, targetRole, targetIds?, data? }` | admin | Send mass push + in-app notification. `targetRole='all'` targets everyone. `targetIds[]` overrides to specific users. `data` is deep-link payload e.g. `{ screen: 'Promotions' }` |
| GET | `/broadcasts` | `?page&limit` | admin | List all past broadcasts with stats (recipient count, delivered count, status) |
| GET | `/broadcasts/:id` | — | admin | Get broadcast detail |

```js
// POST /broadcasts — server behavior:
// 1. Resolve recipients: if targetIds[], use those; else query users by role
// 2. Create BroadcastNotification doc (status='sending')
// 3. Create Notification docs in bulk for all recipients (so they appear in in-app bell)
// 4. Send FCM push via pushNotificationService.js (batch, 500 tokens per FCM request)
// 5. Update BroadcastNotification.deliveredCount + status='completed'
// 6. Log to AdminActivityLog: action='broadcast_notification'
```

---

## Export Routes — `/api/v1/export`

> All export routes: admin only. Returns CSV file (Content-Type: text/csv).

| Method | Endpoint | Query | Description |
|--------|----------|-------|-------------|
| GET | `/export/orders` | `?from&to&status&restaurantId` | Export filtered orders as CSV: orderNumber, customer, restaurant, total, status, paymentMethod, createdAt |
| GET | `/export/payouts` | `?from&to&type=rider\|restaurant` | Export payout history as CSV: recipient, amount, method, reference, date |
| GET | `/export/riders` | `?from&to` | Export rider earnings report as CSV: rider name, phone, deliveries, totalEarnings, pending |
| GET | `/export/customers` | `?from&to` | Export customer list as CSV: name, email, phone, totalOrders, totalSpend, registeredAt |
| GET | `/export/restaurants` | — | Export restaurant list as CSV: name, owner, phone, isApproved, isOpen, totalOrders, revenue |

```js
// Server-side: use 'fast-csv' or 'csv-stringify' npm package
// Response headers:
res.setHeader('Content-Type', 'text/csv')
res.setHeader('Content-Disposition', `attachment; filename="${type}_export_${datePart}.csv"`)
// Stream large datasets — do NOT load all docs into memory at once
// Use cursor: Model.find(...).cursor() → pipe to csv transformer → pipe to res
```

---

## System Settings Routes — `/api/v1/settings`

| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| GET | `/settings` | — | Any auth | Get current system settings. All apps call this on launch to check `maintenanceMode`. Returns full settings for admin, limited fields (maintenanceMode, maintenanceMessage, supportPhone, supportEmail, appName) for non-admin |
| PUT | `/settings` | (partial update) | admin | Update any setting fields. Server upserts the singleton. Logs action to AdminActivityLog |

```js
// Allowed fields for PUT /settings:
// commissionRate, defaultDeliveryFee, minOrderAmount, maxDeliveryRadius,
// maintenanceMode, maintenanceMessage, refundSlaHours, riderAssignmentTimeout,
// supportPhone, supportEmail, socialLinks, appName

// maintenanceMode=true behavior:
// → All /auth/login responses (except admin role) return 503 with maintenanceMessage
// → Apps show maintenance screen until maintenanceMode=false
// → Admin can still log in and change settings

// GET /settings is also accessible by any authenticated user (for maintenance mode check on app launch)
```

---

## Admin Activity Log Routes — `/api/v1/activity-log`

| Method | Endpoint | Query | Access | Description |
|--------|----------|-------|--------|-------------|
| GET | `/activity-log` | `?page&limit&adminId&action&targetType&from&to` | admin | Get paginated admin activity log. Filter by admin, action type, target entity, or date range |
| GET | `/activity-log/:id` | — | admin | Get single log entry detail (includes full `details` object with before/after values) |

```js
// Actions automatically logged (server middleware in adminActivity.middleware.js):
// "approve_rider"         → targetType: "User"
// "reject_rider"          → targetType: "User"
// "approve_restaurant"    → targetType: "Restaurant"
// "reject_restaurant"     → targetType: "Restaurant"
// "force_cancel_order"    → targetType: "Order"
// "assign_rider"          → targetType: "Order"
// "process_refund"        → targetType: "Order"
// "payout_rider"          → targetType: "User"
// "payout_restaurant"     → targetType: "Restaurant"
// "create_voucher"        → targetType: "Voucher"
// "update_voucher"        → targetType: "Voucher"
// "delete_voucher"        → targetType: "Voucher"
// "moderate_review"       → targetType: "Review"
// "broadcast_notification"→ targetType: "BroadcastNotification"
// "update_settings"       → targetType: "SystemSettings"
// "update_banner"         → targetType: "Banner"
// "delete_banner"         → targetType: "Banner"

// Middleware usage (wraps admin controller functions):
// router.put('/riders/:id/approve', auth, isAdmin, logAdminAction('approve_rider', 'User'), approveRider)
```

---

## Search Routes — `/api/v1/search`

| Method | Endpoint | Query | Access | Description |
|--------|----------|-------|--------|-------------|
| GET | `/search` | `?q=burger&lat&lng` | customer | Returns `{ restaurants: [...], dishes: [...] }` |

---

## Banner Routes — `/api/v1/banners`

| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| POST | `/banners` | `{ title, image, type, restaurantId/voucherCode/link, sortOrder, expiresAt }` | admin | Create banner |
| GET | `/banners` | — | Public | Get active banners (for customer home screen) |
| GET | `/banners/all` | — | admin | Get all banners including inactive |
| PUT | `/banners/:id` | (partial update) | admin | Update banner |
| DELETE | `/banners/:id` | — | admin | Delete banner |
| PUT | `/banners/:id/toggle` | `{ isActive }` | admin | Activate/deactivate |

---

## Push Token Route

| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| POST | `/auth/push-token` | `{ expoPushToken }` | Any auth | Save device push token |

---

## Upload Routes — `/api/v1/upload`

| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| POST | `/upload/image` | `FormData { image }` | Any auth | Upload single image, returns URL |

---

## Standard Response Format

```js
// Success
{
  "success": true,
  "message": "...",
  "data": { ... }       // or array
}

// Paginated
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}

// Error
{
  "success": false,
  "message": "Error description",
  "errors": [...]       // validation errors if any
}
```

---

## HTTP Status Codes Used

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (no token) |
| 403 | Forbidden (wrong role) |
| 404 | Not Found |
| 409 | Conflict (e.g. email exists) |
| 500 | Internal Server Error |
