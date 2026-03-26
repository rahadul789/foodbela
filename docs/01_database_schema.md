# Database Schema — MongoDB Models

All collections use Mongoose. Timestamps (`createdAt`, `updatedAt`) are enabled on every model.

---

## 1. User

```js
// Collection: users
{
  _id: ObjectId,
  name: String,                      // required
  email: String,                     // required, unique, lowercase
  password: String,                  // required, hashed (bcrypt), select: false
  phone: String,                     // required
  role: String,                      // enum: ['customer','rider','restaurant_owner','admin']
  profileImage: String,              // URL (Cloudinary)
  isActive: Boolean,                 // default: true
  isVerified: Boolean,               // default: false (for future email verify)

  // Customer-specific
  savedAddresses: [
    {
      label: String,                 // e.g. "Home", "Work"
      address: String,
      lat: Number,
      lng: Number,
      isDefault: Boolean
    }
  ],

  // Rider-specific
  vehicleType: String,               // enum: ['bicycle','motorcycle','car']
  vehicleNumber: String,
  isOnline: Boolean,                 // default: false
  currentLocation: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]            // [lng, lat] — GeoJSON, updated via socket
  },
  isApproved: Boolean,               // admin approves riders, default: false
  earnings: {
    total: Number,                   // lifetime earned (BDT), default: 0
    pending: Number,                 // earned but not yet paid out, default: 0
    withdrawn: Number                // total withdrawn, default: 0
  },

  // Push notifications
  expoPushToken: String,             // saved on login from Expo device, for FCM push notifications
  notificationPreferences: {
    orderUpdates: Boolean,           // default: true — notifications for order status changes
    promotions: Boolean,             // default: true — promotional/discount notifications
    newRestaurants: Boolean,         // default: true — new restaurants in area
    sound: Boolean,                  // default: true — enable notification sound
    vibration: Boolean               // default: true — enable vibration
  },

  // Password reset
  passwordResetToken: String,        // hashed token (select: false) — set on forgot-password request
  passwordResetExpiry: Date,         // token expires after 15 minutes
  // Flow: POST /auth/forgot-password → generate token → hash → save here → send plain token via email
  //       POST /auth/reset-password  → hash incoming token → compare → if match + not expired → update password → clear these fields

  // Customer-specific extras
  favorites: [ObjectId],             // ref: Restaurant — saved favourite restaurants

  // Referral (customer-only — riders and admins get a code too but it is never used)
  referralCode: String,              // unique code, auto-generated on register for ALL users (e.g. "RAFIQ8F3A")
  referredBy: ObjectId,              // ref: User — who referred this user (null if organic)
  referralCount: Number,             // customers only — how many referred users placed their first order, default: 0

  // Restaurant owner — just references to restaurant(s)

  createdAt: Date,
  updatedAt: Date
}
```

---

## 2. Restaurant

```js
// Collection: restaurants
{
  _id: ObjectId,
  ownerId: ObjectId,                 // ref: User (restaurant_owner) — unique index (one restaurant per owner enforced at app layer)
  name: String,                      // required
  description: String,
  logo: String,                      // URL
  coverImage: String,                // URL
  phone: String,
  email: String,

  address: String,                   // full address text
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]            // [lng, lat] — GeoJSON
  },

  cuisineTypes: [String],            // e.g. ['Bangladeshi','Chinese','Burger','Pizza'] — used for home screen cuisine filter
  tags: [String],                    // e.g. ['fast food','halal']

  isOpen: Boolean,                   // owner manually toggles real-time open/closed (default: false)
                                     // NOTE: different from openingHours.day.isOpen below
                                     // isOpen = "are we accepting orders right now?"
                                     // openingHours.day.isOpen = "do we operate on this day of the week?"
  isApproved: Boolean,               // admin approves, default: false
  isActive: Boolean,                 // admin can deactivate, default: true

  openingHours: {
    monday: { open: String, close: String, isOpen: Boolean },
    tuesday: { open: String, close: String, isOpen: Boolean },
    wednesday: { open: String, close: String, isOpen: Boolean },
    thursday: { open: String, close: String, isOpen: Boolean },
    friday: { open: String, close: String, isOpen: Boolean },
    saturday: { open: String, close: String, isOpen: Boolean },
    sunday: { open: String, close: String, isOpen: Boolean }
  },

  deliveryRadius: Number,            // in km, default: 5
  minimumOrder: Number,              // in BDT, default: 0
  deliveryFee: Number,               // flat fee in BDT
  averageDeliveryTime: Number,       // in minutes

  rating: Number,                    // avg rating, default: 0
  totalRatings: Number,              // count, default: 0
  totalOrders: Number,               // count, default: 0
  isFeatured: Boolean,               // admin pins to top of home screen, default: false
  featuredSortOrder: Number,         // lower = shown first in featured section (default: 0), set by admin

  commissionRate: Number,            // % FoodBela takes, default: 10

  createdAt: Date,
  updatedAt: Date
}
// Index: location (2dsphere) for geo queries
```

---

## 3. MenuCategory

```js
// Collection: menucategories
{
  _id: ObjectId,
  restaurantId: ObjectId,            // ref: Restaurant
  name: String,                      // required, e.g. "Burgers", "Drinks"
  description: String,
  image: String,                     // URL
  sortOrder: Number,                 // for display ordering, default: 0
  isActive: Boolean,                 // default: true
  createdAt: Date,
  updatedAt: Date
}
```

---

## 4. MenuItem

```js
// Collection: menuitems
{
  _id: ObjectId,
  restaurantId: ObjectId,            // ref: Restaurant
  categoryId: ObjectId,              // ref: MenuCategory
  name: String,                      // required
  description: String,
  price: Number,                     // required, in BDT
  image: String,                     // URL
  isAvailable: Boolean,              // default: true (owner can toggle)
  isVeg: Boolean,                    // default: false
  preparationTime: Number,           // in minutes

  // Discount on this item (set by restaurant owner)
  discount: {
    type: String,                    // enum: ['percentage','fixed'], null = no discount
    value: Number,                   // e.g. 20 = 20% off or 20 BDT off
    validUntil: Date
  },

  // Customizations (flexible — works for any food type)
  customizations: [
    {
      name: String,                  // e.g. "Size", "Crust", "Add-ons", "Spice Level", "Milk Type"
      type: String,                  // enum: ['single','multiple']
                                     // single → radio (pick exactly one)
                                     // multiple → checkbox (pick one or more)
      required: Boolean,             // if true, user must pick before adding to cart
      minSelect: Number,             // for multiple: min options to pick (default 0)
      maxSelect: Number,             // for multiple: max options to pick (default unlimited)
      options: [
        {
          name: String,              // e.g. "Small", "Large", "Extra Cheese", "Oat Milk"
          price: Number,             // extra charge in BDT (0 = included in base price)
        }
      ]
    }
  ],

  tags: [String],                    // e.g. ['spicy','popular','new']
  sortOrder: Number,                 // default: 0
  createdAt: Date,
  updatedAt: Date
}
// Index: text index on name + description for dish search
```

---

## 5. Order

```js
// Collection: orders
{
  _id: ObjectId,
  orderNumber: String,               // auto-generated format: "ORD-YYYYMMDD-NNNNNN"
                                     // e.g. "ORD-20260311-000001", "ORD-20260311-000002"
                                     // NNNNNN = daily counter, resets each new day
                                     // Generated via atomic Counter model ($inc) — see Model 14
                                     // Counter _id format: "order_YYYYMMDD" (e.g., "order_20260319")
                                     // Race-condition-safe: concurrent requests never get duplicate numbers

  customerId: ObjectId,              // ref: User
  restaurantId: ObjectId,            // ref: Restaurant
  riderId: ObjectId,                 // ref: User — set when a rider accepts the order (status: 'assigned')

  items: [
    {
      menuItemId: ObjectId,          // ref: MenuItem
      name: String,                  // snapshot at order time
      basePrice: Number,             // snapshot (original price before customizations)
      discountedPrice: Number,       // base price after item discount
      selectedCustomizations: [      // what user picked
        {
          name: String,              // e.g. "Size"
          optionName: String,        // e.g. "Large"
          extraPrice: Number,        // extra charge for this option
        }
      ],
      customizationTotal: Number,    // sum of all extraPrice values
      unitPrice: Number,             // discountedPrice + customizationTotal
      quantity: Number,
      subtotal: Number               // unitPrice * quantity
    }
  ],

  subtotal: Number,                  // sum of item subtotals
  deliveryFee: Number,
  discountFromItems: Number,         // discount already applied in item prices
  promotionDiscount: Number,         // discount from restaurant promotion (auto-applied), default: 0
  promotionId: ObjectId,             // ref: Promotion (if used)
  voucherDiscount: Number,           // discount from voucher, default: 0
  // RULE: promotion and voucher are mutually exclusive.
  // If promotion applies (promotionDiscount > 0) → voucher input is blocked at checkout.
  // Customer cannot stack both discounts on the same order.
  total: Number,                     // subtotal + deliveryFee - promotionDiscount - voucherDiscount

  // Commission & payout (calculated when order is delivered)
  commissionRate: Number,            // snapshot from restaurant.commissionRate (default 10)
  commissionAmount: Number,          // subtotal * commissionRate / 100 → FoodBela revenue
                                     // NOTE: commission is calculated on 'subtotal' (item totals BEFORE
                                     // promotionDiscount/voucherDiscount). FoodBela absorbs the discount cost.
                                     // e.g. subtotal=৳1000, promotion=৳120, commission=৳100 (10% of ৳1000)
  restaurantPayout: Number,          // subtotal - commissionAmount → restaurant earns this
  riderEarning: Number,              // = deliveryFee → rider earns this

  voucherId: ObjectId,               // ref: Voucher (if used)
  voucherCode: String,

  paymentMethod: String,             // enum: ['bkash','cash_on_delivery']
  paymentStatus: String,             // enum: ['pending','paid','failed','refunded','refund_failed'], default: 'pending'
  // bKash: set to 'paid' after execute. COD: auto-set to 'paid' when order status = 'delivered' (rider collected cash).
  bkashPaymentID: String,            // from bKash create API
  bkashTrxID: String,                // from bKash execute API (original transaction ID)

  riderAssignmentDeadline: Date,     // set when status becomes 'ready' (Date.now + 60s)
                                     // cron job checks every 30s: if status='ready' && riderId=null && deadline passed
                                     //   → re-broadcast to all online riders + alert admin
                                     // Kubernetes-safe: DB-based, works across multiple pods (no in-memory Map needed)

  status: String,                    // enum: (see below) — set explicitly in controller:
                                     //   bKash order → default: 'payment_pending'
                                     //   COD order   → default: 'pending' (skips payment_pending)
  /*
    Order Status Flow:
    payment_pending → bKash order created, waiting for payment confirmation
                      (restaurant NOT notified yet — new_order event held until payment confirmed)
                      COD orders skip this status entirely → go straight to 'pending'
    pending       → payment confirmed (or COD) — waiting for restaurant to confirm
                    → new_order socket event emitted to restaurant NOW
    confirmed     → restaurant accepted
    preparing     → restaurant is making food
    ready         → food ready for pickup by rider (broadcast to nearby riders)
    assigned      → a rider accepted (riderId set), waiting for pickup
    picked_up     → rider physically picked up food, live location active
    delivered     → delivered to customer
    cancelled     → cancelled (by customer/restaurant/admin)

    bKash flow:
      POST /orders → status: 'payment_pending', paymentStatus: 'pending'
      POST /payments/bkash/execute (success) → status: 'pending', paymentStatus: 'paid'
                                             → emit new_order to restaurant
      POST /payments/bkash/execute (fail/cancel) → status: 'cancelled', paymentStatus: 'failed'

    Rider queue: a rider can hold multiple 'assigned' orders at once.
    Only ONE order is in 'picked_up' state per rider at a time (active delivery).
    Live location is shared only for the currently picked_up order.
  */

  cancelledBy: String,               // enum: ['customer','restaurant','admin','system']
  cancellationReason: String,
  // Customer cancel rule:
  //   - status = 'payment_pending': always cancellable (payment not yet confirmed)
  //   - status = 'pending': cancellable — BUT if paymentMethod='bkash' && paymentStatus='paid',
  //     refundStatus set to 'processing', refundInitiatedAt = now, refundProcessingUntil = now+2h
  //     Admin manually processes refund within 2-hour SLA (NOT automatic)
  //   - status = 'confirmed' or later: customer CANNOT cancel — restaurant or admin only

  deliveryAddress: {
    address: String,
    lat: Number,
    lng: Number
  },

  specialInstructions: String,
  distanceKm: Number,                // restaurant → delivery address (Haversine, calculated on order place)
                                     // future: replace with Google Distance Matrix value — field name stays same
  estimatedDeliveryTime: Number,     // in minutes, calculated on order place:
                                     //   = restaurant.averageDeliveryTime (prep) + ceil(distanceKm / 25 * 60) (travel @ 25km/h)
                                     // future: use Google ETA instead — field name stays same

  // Payout tracking
  // Set automatically when order reaches 'delivered' status:
  //   bKash order → payoutStatus: 'pending_payout'
  //   COD order   → payoutStatus: 'pending_collection'
  //   cancelled orders → payoutStatus stays null (no payout needed)
  payoutStatus: String,
  /*
    bKash orders:
      null               → order not yet delivered (default)
      'pending_payout'   → order delivered, FoodBela needs to pay restaurant + rider
      'payout_completed' → admin has paid both restaurant and rider out

    COD orders:
      null                    → order not yet delivered (default)
      'pending_collection'    → order delivered, rider has cash, needs to submit to FoodBela
      'collection_completed'  → admin confirmed rider submitted cash to FoodBela
                                 After this, admin separately creates restaurant_payout + rider_payout
                                 Payout records to track final settlement (same as bKash payout flow)
  */

  nearbyAlertSent: Boolean,          // default: false — true once rider_nearby event fired (prevents repeat)
  nearbyAlertSentAt: Date,           // exact timestamp when nearby alert was sent (for deduplication)

  // Refund handling — Manual, admin processes within 2-hour SLA (bKash orders only — COD has no refund)
  refundStatus: String,              // enum: ['none','processing','completed','failed'], default: 'none'
  refundAmount: Number,              // amount to refund in BDT
  refundReason: String,              // e.g. 'order_cancelled', 'wrong_items', 'quality_complaint'
  refundInitiatedAt: Date,           // when cancel was clicked / refund triggered
  refundProcessingUntil: Date,       // SLA deadline: refundInitiatedAt + 2 hours
  refundCompletedAt: Date,           // when admin successfully processed refund
  refundFailureReason: String,       // bKash API error message if refund fails
  refundProcessedBy: ObjectId,       // ref: User (admin who processed the refund via bKash API — NOT set on customer cancel, only on admin refund action)
  bkashRefundTrxID: String,          // from bKash refund API response — saved on successful refund

  // Ratings (filled after delivery — denormalized from Review model for quick access)
  // When customer submits rating: BOTH Order fields AND Review document are written simultaneously
  foodRating: Number,                // 1-5
  deliveryRating: Number,            // 1-5
  review: String,                    // copy of Review.comment
  isRated: Boolean,                  // default: false — true once Review document is created

  createdAt: Date,
  updatedAt: Date
}
```

---

## 6. Voucher

```js
// Collection: vouchers
{
  _id: ObjectId,
  createdBy: ObjectId,               // ref: User (admin or restaurant_owner)
  source: String,                    // enum: ['admin','restaurant','referral']
                                     //   admin      → FoodBela-wide voucher (can apply to all or specific restaurants)
                                     //   restaurant → created by restaurant_owner, applies only to their restaurant
                                     //   referral   → auto-generated by system for referral rewards
  restaurantId: ObjectId,            // ref: Restaurant — required if source='restaurant', null for admin/referral vouchers

  code: String,                      // required, unique, UPPERCASE

  type: String,                      // enum: ['percentage','fixed']
  value: Number,                     // e.g. 20 = 20% or 20 BDT

  minOrderAmount: Number,            // minimum cart total to apply, default: 0
  maxDiscount: Number,               // cap for percentage discounts (0 = no cap)

  usageLimit: Number,                // total uses allowed (0 = unlimited)
  usedCount: Number,                 // default: 0
  perUserLimit: Number,              // max uses per user (default: 1)

  applicableTo: String,              // enum: ['all','specific_restaurants'] — only relevant for admin vouchers
  applicableRestaurants: [ObjectId], // ref: Restaurant — for admin vouchers targeting specific restaurants

  // User-restricted vouchers (for referral rewards, personalised promos)
  restrictedToUserId: ObjectId,      // ref: User — if set, ONLY this user can apply it (null = anyone)

  // Referral-specific fields (for source='referral' only)
  referralRewardFor: ObjectId,       // ref: User — who is being rewarded (null if not referral voucher)
  referralPeriod: String,            // format: "YYYY-MM" (e.g., "2026-03") — prevents duplicate vouchers per month
                                     // Unique index: { referralRewardFor: 1, referralPeriod: 1, sparse: true }

  isActive: Boolean,                 // default: true
  expiresAt: Date,                   // null = never expires

  description: String,               // e.g. "Ramadan special 20% off"
  createdAt: Date,
  updatedAt: Date
}

// Indexes:
// db.vouchers.createIndex({ code: 1 }, { unique: true })
// db.vouchers.createIndex({ restaurantId: 1 })
// db.vouchers.createIndex({ createdBy: 1 })
// db.vouchers.createIndex({ referralRewardFor: 1, referralPeriod: 1 }, { unique: true, sparse: true })
```

---

## 7. VoucherUsage

```js
// Collection: voucherusages
// Note: timestamps disabled — usedAt replaces createdAt, no updatedAt needed (records are write-once)
{
  _id: ObjectId,
  voucherId: ObjectId,               // ref: Voucher
  userId: ObjectId,                  // ref: User
  orderId: ObjectId,                 // ref: Order
  discountAmount: Number,
  usedAt: Date                       // default: Date.now
}
// Index: { voucherId, userId } compound — used on every order placement for perUserLimit check
```

---

## 8. Promotion

```js
// Collection: promotions
// Restaurant-created automatic cart-level deals (no code needed — auto-applied)
// e.g. "Spend ৳1000, get ৳120 off"
{
  _id: ObjectId,
  restaurantId: ObjectId,            // ref: Restaurant — which restaurant this belongs to

  title: String,                     // display text, e.g. "Spend ৳1000, Save ৳120!"

  thresholdAmount: Number,           // minimum cart subtotal (BDT) to unlock, e.g. 1000
  discountType: String,              // enum: ['fixed','percentage']
  discountValue: Number,             // e.g. 120 = ৳120 off, or 15 = 15% off
  maxDiscount: Number,               // cap for percentage type (0 = no cap)

  isActive: Boolean,                 // default: true
  expiresAt: Date,                   // null = never expires

  createdAt: Date,
  updatedAt: Date
}
// Note: only ONE active promotion per restaurant at a time (enforced at application layer)
```

---

## 9. Review

```js
// Collection: reviews
{
  _id: ObjectId,
  orderId: ObjectId,                 // ref: Order (one review per order)
  restaurantId: ObjectId,            // ref: Restaurant
  customerId: ObjectId,              // ref: User
  riderId: ObjectId,                 // ref: User

  foodRating: Number,                // 1-5, required
  deliveryRating: Number,            // 1-5, optional (rate rider's delivery)
  comment: String,

  // Moderation (admin review queue)
  status: String,                    // enum: ['pending', 'approved', 'rejected'], default: 'pending'
  rejectedReason: String,            // reason for rejection (set by admin)
  moderatedBy: ObjectId,             // ref: User (admin who moderated)
  moderatedAt: Date,                 // when moderation happened

  createdAt: Date,
  updatedAt: Date
}
// Note: Only 'approved' reviews are visible on restaurant public page.
// Customer submits → status='pending' → admin approves/rejects from moderation queue.
```

---

## 10. Notification

```js
// Collection: notifications
{
  _id: ObjectId,
  userId: ObjectId,                  // ref: User (recipient)
  title: String,
  body: String,
  type: String,                      // enum: ['order_update','new_order','payment','refund','promo','system']
  data: Object,                      // extra payload, e.g. { orderId: '...' }
  image: String,                     // optional — image URL (Cloudinary) for notification
  sound: String,                     // optional — custom sound file name (e.g., 'order_alert.wav')
  groupKey: String,                  // optional — groups similar notifications (e.g., 'order_123_updates') — mobile shows as group in notification bar
  actionType: String,                // what happens on tap: enum: ['open_order','open_promotion','open_app','custom']
  actionData: Object,                // data for action (e.g., { orderId, screen: 'OrderDetail' })
  imageDisplayMode: String,          // enum: ['thumbnail','full','hidden'] — how image shows in notification bar
  isRead: Boolean,                   // default: false
  pushSent: Boolean,                 // default: false — true if FCM push was successfully sent
  pushSentAt: Date,                  // timestamp when FCM push was sent
  createdAt: Date
}
// Note: expoPushToken on User model stores latest device token only.
// Multi-device: new login overwrites previous token — one active device per user (acceptable for MVP).
```

---

## 11. DeliveryTracking

```js
// Collection: deliverytrackings
{
  _id: ObjectId,
  orderId: ObjectId,                 // ref: Order, unique
  riderId: ObjectId,                 // ref: User

  // Status tracking
  status: String,                    // enum: ['assigned','picked_up','delivered']
                                     // assigned → rider accepted, waiting to pickup
                                     // picked_up → rider has food, live tracking active
                                     // delivered → completed

  // Timing
  acceptedAt: Date,                  // when rider accepted order (status='assigned')
  pickedUpAt: Date,                  // when rider picked up food (status='picked_up', tracking starts)
  deliveredAt: Date,                 // when delivered (status='delivered')

  // Live path (appended as rider moves during picked_up status only)
  path: [
    {
      lat: Number,
      lng: Number,
      timestamp: Date
    }
  ],

  // Current position (updated frequently via socket during picked_up)
  currentLat: Number,
  currentLng: Number,
  lastUpdated: Date,

  createdAt: Date,
  updatedAt: Date

  // Timeline:
  // 1. Rider accepts order → DeliveryTracking created with status='assigned'
  // 2. Rider marked picked-up → status='picked_up', pickedUpAt set, live tracking begins
  // 3. Rider marked delivered → status='delivered', deliveredAt set, tracking stops
}
```

---

## 12. Banner

```js
// Collection: banners
// Admin creates banners shown on customer app home screen
{
  _id: ObjectId,
  createdBy: ObjectId,               // ref: User (admin)
  title: String,                     // display text on banner
  image: String,                     // URL (Cloudinary) — recommended 16:6 ratio

  type: String,                      // enum: ['restaurant','voucher','url']
  restaurantId: ObjectId,            // required if type='restaurant' — tapping opens this restaurant
  voucherCode: String,               // required if type='voucher'    — tapping auto-fills voucher at checkout
  link: String,                      // required if type='url'        — opens external link in browser

  isActive: Boolean,                 // default: true
  sortOrder: Number,                 // lower = shows first, default: 0
  expiresAt: Date,                   // null = never expires

  createdAt: Date,
  updatedAt: Date
}
```

---

## 13. Payout

```js
// Collection: payouts
// Records every financial transaction between FoodBela, restaurants, and riders
{
  _id: ObjectId,
  processedBy: ObjectId,             // ref: User (admin who recorded this)

  type: String,
  /*
    'rider_payout'         → FoodBela pays rider delivery fees (bKash orders)
    'restaurant_payout'    → FoodBela pays restaurant their earnings (bKash orders)
    'cod_collection'       → Admin records that rider submitted COD cash to FoodBela
  */

  recipientId: ObjectId,             // ref: User (rider) or Restaurant
  recipientModel: String,            // 'User' or 'Restaurant'

  amount: Number,                    // BDT amount
  method: String,                    // enum: ['bkash','bank','cash']
  reference: String,                 // bKash TrxID, bank ref, or note

  orders: [ObjectId],                // ref: Order — which orders this payment covers
  periodFrom: Date,                  // e.g. 2024-01-01
  periodTo: Date,                    // e.g. 2024-01-07 (weekly payout)

  note: String,                      // optional admin note
  createdAt: Date
}
```

---

### How payoutStatus flows

```
bKash order delivered:
  order.payoutStatus = 'pending_payout'
  Admin goes to rider page → clicks "Pay Delivery Fees" → enters bKash TrxID
  → Payout record created (type: 'rider_payout')
  → order.payoutStatus = 'payout_completed'
  → rider.earnings.pending = 0, rider.earnings.withdrawn += amount

  Admin goes to restaurant page → clicks "Pay Restaurant"
  → Payout record created (type: 'restaurant_payout')

COD order delivered:
  order.payoutStatus = 'pending_collection'
  Rider physically submits cash to FoodBela
  Admin records it → clicks "Mark COD Collected"
  → Payout record created (type: 'cod_collection')
  → order.payoutStatus = 'collection_completed'
```

---

## Referral Flow

```
1. User A registers with referralCode of User B → User A.referredBy = User B._id
   (referralCode is optional at register — users who signed up normally have no referredBy)

2. User A places their FIRST order (order.status reaches 'delivered'):
   → Check: has User A placed any previous delivered orders? No → trigger referral reward
   → User B.referralCount += 1
   → If User B.referralCount <= 50 (cap):
       → Auto-create a Voucher:
           code: auto-generated (e.g. "REF-B3F9A2")
           type: 'fixed'
           value: 50           (৳50 off)
           minOrderAmount: 200 (min cart ৳200 to use)
           usageLimit: 1
           restrictedToUserId: User B._id
           source: 'referral'
           expiresAt: 30 days from now
           isActive: true
       → Send notification to User B: "আপনার referral কাজ করেছে! ৳50 voucher পেয়েছেন"

3. User B sees voucher in Profile → Referral section
   User B applies voucher at next checkout → ৳50 off
```

---

## 14. Counter

```js
// Collection: counters
// Utility collection for atomic sequence generation — prevents orderNumber race conditions
// NOT a full model with timestamps — write-once-increment-forever
{
  _id: String,          // e.g. "order_20260311" (key = "order_" + YYYYMMDD)
  seq: Number           // auto-incremented atomically with $inc, starts at 1
}
// Usage in orderNumber generation:
//   const doc = await Counter.findOneAndUpdate(
//     { _id: `order_${datePart}` },
//     { $inc: { seq: 1 } },
//     { upsert: true, new: true }
//   )
//   const orderNumber = `ORD-${datePart}-${String(doc.seq).padStart(6, '0')}`
// This is atomic — no race condition possible even under concurrent requests.
// Old daily counter documents can be cleaned up after 30 days (cron job or TTL index).
```

---

## Model 15 — CuisineType

```js
const cuisineTypeSchema = new mongoose.Schema({
  name:     { type: String, required: true, unique: true, trim: true }, // e.g. "Bengali", "Chinese"
  slug:     { type: String, required: true, unique: true, lowercase: true }, // e.g. "bengali", "chinese"
  icon:     { type: String },  // Cloudinary image URL (emoji or custom icon)
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }   // display order on home screen filter
}, { timestamps: true })
```

---

## Model 16 — SystemSettings

> Singleton document (only one record, _id fixed as "global").

```js
const systemSettingsSchema = new mongoose.Schema({
  _id:                  { type: String, default: 'global' },
  appName:              { type: String, default: 'FoodBela' },
  commissionRate:       { type: Number, default: 10 },   // % platform commission on every order
  defaultDeliveryFee:   { type: Number, default: 50 },   // BDT — used if restaurant has no custom fee
  minOrderAmount:       { type: Number, default: 100 },  // BDT — minimum order value platform-wide
  maxDeliveryRadius:    { type: Number, default: 10 },   // km — rider search radius
  maintenanceMode:      { type: Boolean, default: false }, // if true → all apps show maintenance screen
  maintenanceMessage:   { type: String, default: '' },
  refundSlaHours:       { type: Number, default: 2 },    // hours to process refund (SLA)
  riderAssignmentTimeout: { type: Number, default: 60 }, // seconds before unassigned_order_alert
  supportPhone:         { type: String, default: '' },
  supportEmail:         { type: String, default: '' },
  socialLinks: {
    facebook:  { type: String, default: '' },
    instagram: { type: String, default: '' }
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })
// Usage: const settings = await SystemSettings.findById('global')
// Create on first boot: SystemSettings.findOneAndUpdate({ _id: 'global' }, {}, { upsert: true, new: true })
```

---

## Model 17 — AdminActivityLog

> Immutable audit trail — logs every significant admin action.

```js
const adminActivityLogSchema = new mongoose.Schema({
  adminId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action:     { type: String, required: true },  // e.g. "approve_rider", "force_cancel_order", "update_settings"
  targetType: { type: String },  // "User", "Order", "Restaurant", "Voucher", etc.
  targetId:   { type: mongoose.Schema.Types.ObjectId },
  details:    { type: mongoose.Schema.Types.Mixed }, // before/after values or extra context
  ip:         { type: String },
  userAgent:  { type: String }
}, { timestamps: true })
// No update needed — logs are append-only (never edit or delete)
```

---

## Model 18 — BroadcastNotification

> Admin sends mass push + in-app notification to a segment of users.

```js
const broadcastNotificationSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  body:        { type: String, required: true },
  imageUrl:    { type: String },                  // optional image in push notification
  targetRole:  { type: String, enum: ['all', 'customer', 'rider', 'restaurant_owner'], default: 'all' },
  targetIds:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // empty = entire targetRole segment
  data:        { type: mongoose.Schema.Types.Mixed }, // deep link data: { screen, restaurantId? }
  sentBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // admin who sent it
  sentAt:      { type: Date, default: Date.now },
  recipientCount: { type: Number, default: 0 },   // total users targeted
  deliveredCount: { type: Number, default: 0 },   // FCM delivered count (updated async)
  status:      { type: String, enum: ['pending', 'sending', 'completed', 'failed'], default: 'pending' }
}, { timestamps: true })
```

---

## Relationships Summary

```
User (customer)       → many Orders
User (customer)       → many Restaurants (via favorites[])
User (customer)       → 1 User (via referredBy — who referred them)
User (rider)          → many Orders (as riderId)
User (owner)          → many Restaurants (via ownerId)
Restaurant            → many MenuCategories
MenuCategory          → many MenuItems
MenuItem              → many customizations (embedded)
Order                 → many items (embedded, with selectedCustomizations)
Order                 → 1 Voucher (optional)
Order                 → 1 Promotion (optional, auto-applied)
Restaurant            → 1 active Promotion (optional)
Order                 → 1 DeliveryTracking
Order                 → 1 Review
Voucher               → many VoucherUsages
Payout                → many Orders (covers multiple orders per payout)
CuisineType           → many Restaurants (via slug matching)
SystemSettings        → singleton (only _id='global')
AdminActivityLog      → 1 User (adminId — who performed the action)
BroadcastNotification → 1 User (sentBy — admin who sent it)
BroadcastNotification → many Users (targetIds — optional specific targets)
```

---

## Database Indexes

```js
// User
users.email                → unique index
users.role                 → index
users.isOnline             → index (for rider queries)
users.currentLocation      → 2dsphere index (find riders near a restaurant)

// Restaurant
restaurants.location  → 2dsphere index (geo queries)
restaurants.ownerId   → unique index (one restaurant per owner)
restaurants.isApproved, isActive, isOpen → compound index

// MenuItem
menuitems.restaurantId, categoryId → compound index
menuitems.name, description         → text index (dish name search)

// Order
orders.customerId               → index
orders.restaurantId             → index
orders.riderId                  → index
orders.status                   → index
orders.orderNumber              → unique index
orders.createdAt                → index  (used to count today's orders for orderNumber daily counter)
orders.{ restaurantId, status } → compound index  (GET /orders/restaurant/:id?status queries)
orders.{ riderId, status }      → compound index  (GET /orders/rider/queue — assigned orders for rider)
orders.refundStatus             → index  (GET /refunds/pending — admin refund dashboard)
orders.riderAssignmentDeadline  → index  (cron job: find overdue unassigned orders efficiently)

// Voucher
vouchers.code         → unique index

// VoucherUsage
voucherusages.voucherId, userId → compound index  (perUserLimit check on every order placement)

// Order (additional)
orders.payoutStatus   → index  (admin payout dashboard queries pending payouts)

// Notification
notifications.userId, isRead → compound index

// DeliveryTracking
deliverytrackings.orderId → unique index

// Review
reviews.orderId            → unique index  (one review per order)
reviews.restaurantId       → index
reviews.status             → index  (admin moderation queue — filter pending/approved/rejected)
reviews.{ restaurantId, status } → compound index  (public approved reviews for a restaurant)

// CuisineType
cuisinetypes.slug       → unique index
cuisinetypes.isActive   → index

// AdminActivityLog
adminactivitylogs.adminId    → index
adminactivitylogs.targetType, targetId → compound index
adminactivitylogs.createdAt  → index  (time-range queries for audit log)

// BroadcastNotification
broadcastnotifications.sentBy    → index
broadcastnotifications.sentAt    → index
broadcastnotifications.targetRole → index
```
