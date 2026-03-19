# API Endpoints

Base URL: `http://localhost:5000/api/v1`

Auth header: `Authorization: Bearer <jwt_token>`

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
| POST | `/auth/login` | `{ email, password }` | Public | Login, returns JWT |
| GET | `/auth/me` | — | Any auth | Get current user profile |
| PUT | `/auth/change-password` | `{ currentPassword, newPassword }` | Any auth | Change password |
| PUT | `/auth/profile` | `{ name, phone, profileImage }` | Any auth | Update own profile |
| POST | `/auth/forgot-password` | `{ email }` | Public | Generate reset token → send email with reset link. Rate limited: 3 req/hour |
| POST | `/auth/reset-password` | `{ token, newPassword }` | Public | Validate token (15min expiry) → update password → clear token fields |

---

## User Routes — `/api/v1/users`

| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| GET | `/users` | — | admin | List all users with filters |
| GET | `/users/:id` | — | admin | Get user by ID |
| PUT | `/users/:id/status` | `{ isActive }` | admin | Activate/deactivate user |
| PUT | `/users/:id/approve-rider` | `{ isApproved }` | admin | Approve/reject rider |
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
| PUT | `/restaurants/:id/toggle-open` | `{ isOpen }` | restaurant_owner | Toggle open/close |
| GET | `/restaurants` | `?lat&lng&radius&cuisine&search&page` | customer | Search nearby restaurants. Always filters: isApproved=true, isActive=true. Optional: isOpen, minRating, maxDeliveryTime, maxDeliveryFee, hasDiscount, sortBy |
| GET | `/restaurants/:id` | — | Public | Get restaurant detail |
| GET | `/restaurants/:id/menu` | — | Public | Get full menu by restaurant |
| GET | `/restaurants/:id/reviews` | `?page` | Public | Get reviews for a restaurant (paginated) |
| GET | `/restaurants/all` | — | admin | List all restaurants |
| PUT | `/restaurants/:id/approve` | `{ isApproved }` | admin | Approve/reject restaurant |
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
| POST | `/orders` | `{ restaurantId, items, deliveryAddress, paymentMethod, voucherCode?, specialInstructions? }` | customer | Place order. COD → status:'pending', emits new_order immediately. bKash → status:'payment_pending', restaurant NOT notified yet |
| GET | `/orders/my` | `?status&page` | customer | Get own orders |
| GET | `/orders/:id` | — | customer/rider/owner/admin | Get order detail |
| PUT | `/orders/:id/cancel` | `{ reason }` | customer | Cancel order. Allowed: status='payment_pending' or 'pending'. If bKash+paid → auto-trigger refund (POST /payments/bkash/refund) before cancelling |
| POST | `/orders/:id/rate` | `{ foodRating, riderRating, comment }` | customer | Rate delivered order. Saves foodRating/riderRating/review to Order, creates Review document, updates restaurant.rating avg, sets order.isRated=true |

### Restaurant Owner Order Management
| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| GET | `/orders/restaurant/:restaurantId` | `?status&page` | restaurant_owner | Get restaurant orders |
| PUT | `/orders/:id/confirm` | `{ estimatedDeliveryTime }` | restaurant_owner | Confirm order |
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
| POST | `/orders/:id/refund` | `{ amount }` | admin | Manually process refund for a pending order. Calls bKash refund API. On success → order.refundStatus='completed'. On failure → order.refundStatus='failed', notifies admin. Returns 400 if refundStatus≠'processing', 409 if already refunded |

---

## Payment Routes — `/api/v1/payments`

| Method | Endpoint | Body | Access | Description |
|--------|----------|------|--------|-------------|
| POST | `/payments/bkash/create` | `{ orderId }` | customer | Initiate bKash payment — returns paymentURL. Order must be status='payment_pending' |
| POST | `/payments/bkash/execute` | `{ paymentID, orderId }` | customer | Execute after customer pays. On success → order.status='pending', order.paymentStatus='paid', emits new_order to restaurant. On fail → order.status='cancelled', paymentStatus='failed' |
| POST | `/payments/bkash/callback` | — | Public (bKash webhook) | bKash server callback |
| GET | `/payments/bkash/status/:orderId` | — | customer | Query payment status |
| POST | `/payments/bkash/refund` | `{ orderId }` | admin | Initiate refund. Also called internally when customer cancels a paid bKash order |

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
