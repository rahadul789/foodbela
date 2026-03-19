# Socket.IO Events

Server runs Socket.IO on the same Express server.
Client auth: send JWT in handshake → `socket.handshake.auth.token`

---

## Connection & Rooms

```
When connected, server verifies JWT and attaches user to socket.
Each socket automatically joins its personal room: `user:{userId}`
```

### Client → Server: Join Rooms

| Event | Payload | Who | Description |
|-------|---------|-----|-------------|
| `join_order_room` | `{ orderId }` | customer, rider, restaurant | Join room for a specific order. Rider emits this after accepting an order |
| `leave_order_room` | `{ orderId }` | any | Leave order room |
| `join_restaurant_room` | `{ restaurantId }` | restaurant_owner | Listen for new orders |
| `join_admin_room` | — | admin | Listen to all events |

### When Customer Joins `order:{orderId}` Room

Order status updates (`order_confirmed`, `order_preparing`, etc.) are sent to the customer's **personal room** `user:{customerId}` — these always reach the customer regardless of which screen they're on.

The customer joins `order:{orderId}` specifically for **live location tracking**:
```
Customer opens Order Detail screen → emit join_order_room({ orderId })
Customer taps "Track Order"        → already in room, starts receiving rider_location events
Customer navigates away from order → emit leave_order_room({ orderId })
```
This means: no need to be in the order room to receive status updates. The order room is only for tracking.

---

## Location Events (Rider → Server → Customer)

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `rider_location_update` | Rider → Server | `{ orderId, lat, lng }` | Rider sends location every 5s during active delivery |
| `rider_location` | Server → Customer | `{ lat, lng, orderId, timestamp }` | Server broadcasts to `order:{orderId}` room |
| `rider_nearby` | Server → Customer | `{ orderId, distanceMeters }` | Sent ONCE when rider comes within 500m of delivery address |
| `admin_rider_location` | Server → Admin | `{ riderId, lat, lng, orderId }` | Also emitted to `admin` room on every location update (for live map) |

---

## Order Events

### New Order Flow
| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `new_order` | Server → Restaurant | `{ order }` | Sent to `restaurant:{restaurantId}` room |
| `order_confirmed` | Server → Customer | `{ orderId, estimatedTime }` | Restaurant confirmed |
| `order_preparing` | Server → Customer | `{ orderId }` | Restaurant started preparing |
| `order_ready` | Server → Customer + Admin | `{ orderId }` | Food ready, broadcast to nearby riders |
| `order_accepted_by_rider` | Server → Customer + Restaurant | `{ orderId, rider: { name, phone, vehicleType } }` | Rider accepted → status: assigned |
| `order_picked_up` | Server → Customer + Restaurant | `{ orderId }` | Rider picked up → live location begins |
| `order_delivered` | Server → Customer + Restaurant | `{ orderId }` | Order delivered |
| `order_cancelled` | Server → Customer + Restaurant + Rider | `{ orderId, cancelledBy, reason }` | Order cancelled |
| `order_reassigned` | Server → Customer + Old Rider + New Rider | `{ orderId, newRider: { name, phone, vehicleType } }` | Admin switched rider manually |
| `unassigned_order_alert` | Server → Admin | `{ orderId, orderNumber, restaurantName, waitedSeconds }` | No rider accepted after 60s — needs manual assignment |
| `unprocessed_refund_alert` | Server → Admin | `{ orderId, orderNumber, amount, reason }` | bKash refund API failed — admin must process manually from bKash merchant dashboard |

### Refund Events (Manual Refund Flow)
| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `refund_processing` | Server → Customer | `{ orderId, amount, processingUntil }` | Refund initiated. Shows "Processing within 2 hours" message with SLA deadline |
| `refund_completed` | Server → Customer | `{ orderId, amount, refundedAt }` | Admin processed refund successfully. Notification: "Refund of ৳X completed! Check your bKash account" |
| `refund_failed` | Server → Customer | `{ orderId, amount, reason }` | Refund processing failed. Notification: "Refund failed. Our team will contact you shortly" |
| `pending_refunds_updated` | Server → Admin | `{ pendingCount, overdueCount }` | Real-time dashboard update when new refunds added or refund SLA exceeded |

---

## Rider Availability Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `rider_online` | Rider → Server | `{ lat, lng }` | Rider goes online → server joins rider to `riders_online` room, updates `user.currentLocation` |
| `rider_location_idle` | Rider → Server | `{ lat, lng }` | Rider online but no active delivery — emitted every 30s to keep admin map fresh |
| `rider_offline` | Rider → Server | — | Rider goes offline → **blocked if rider has `assigned` orders in queue**. Server checks and returns error if queue not empty |
| `new_order_available` | Server → Rider | `{ order, restaurant, distance }` | Emitted to each nearby rider's `user:{riderId}` room individually (NOT a room broadcast) |

---

## Notification Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `notification` | Server → User | `{ title, body, type, data }` | Real-time in-app notification to `user:{userId}` |

---

## Socket Room Structure

```
Rooms:
  user:{userId}           → personal room, one per user
  order:{orderId}         → tracking room for an order (customer + rider both join on accept)
  restaurant:{id}         → restaurant receives new orders
  admin                   → admin dashboard room
  riders_online           → all currently online riders (joined on rider_online, left on rider_offline/disconnect)
```

---

## Implementation Notes

### Rider Location Update — Every 5 Seconds (Active Delivery Only)
```js
// Rider app sends ONLY when an order is picked_up (active delivery):
socket.emit('rider_location_update', { orderId, lat, lng })

// Server:
// 1. Update DeliveryTracking.currentLat/Lng in DB
// 2. Update user.currentLocation (so admin map stays accurate even during delivery)
// 3. Broadcast location to order room:
io.to(`order:${orderId}`).emit('rider_location', { lat, lng, timestamp })
// 4. Also emit to admin room for live map:
io.to('admin').emit('admin_rider_location', { riderId: socket.userId, lat, lng, orderId })
// 5. Check nearby alert — only if order.nearbyAlertSent = false:
//    Calculate distance between rider (lat, lng) and order.deliveryAddress (lat, lng)
//    If distance <= 500m:
//      → emit 'rider_nearby' to customer's personal room: user:{customerId}
//      → send push notification to customer.expoPushToken
//      → set order.nearbyAlertSent = true  (never sends again for this order)
```

### Rider Location Idle — Every 30 Seconds (Online, No Active Delivery)
```js
// Rider app sends when online but no picked_up order:
socket.emit('rider_location_idle', { lat, lng })

// Server:
// 1. Update user.currentLocation in DB
// 2. Emit to admin room for live map:
io.to('admin').emit('admin_rider_location', { riderId: socket.userId, lat, lng, orderId: null })
```

### Rider Online / Offline
```js
// rider_online: server adds rider to riders_online room + updates user.currentLocation
socket.on('rider_online', async ({ lat, lng }) => {
  await User.findByIdAndUpdate(socket.userId, {
    isOnline: true,
    'currentLocation.coordinates': [lng, lat]
  })
  socket.join('riders_online')
})

// rider_offline: BLOCKED if rider has assigned orders in queue
socket.on('rider_offline', async () => {
  const activeOrders = await Order.countDocuments({ riderId: socket.userId, status: 'assigned' })
  if (activeOrders > 0) {
    socket.emit('error', { message: 'Complete your queued orders before going offline' })
    return
  }
  await User.findByIdAndUpdate(socket.userId, { isOnline: false })
  socket.leave('riders_online')
})

// On socket disconnect (internet loss — NOT intentional offline):
// → Do NOT remove from riders_online room here. Socket.IO handles reconnection.
// → Only mark offline if rider was intentionally going offline via rider_offline event.
```

### New Order Available — Initial Broadcast to Nearby Riders
```js
// When order status → 'ready', server finds nearby online riders and emits individually:
const nearbyRiders = await User.find({
  role: 'rider',
  isOnline: true,
  isApproved: true,
  currentLocation: {
    $near: {
      $geometry: { type: 'Point', coordinates: [restaurant.lng, restaurant.lat] },
      $maxDistance: 5000  // 5km radius
    }
  }
})
nearbyRiders.forEach(rider => {
  io.to(`user:${rider._id}`).emit('new_order_available', { order, restaurant, distance: riderDistance })
})
startRiderTimeout(orderId, restaurant.name, order.orderNumber)
```

### Restaurant New Order
```js
// When order is placed, server emits:
io.to(`restaurant:${restaurantId}`).emit('new_order', { order: populatedOrder })
// Also save notification to DB
```

### Rider Accepts Order — Join Room
```js
// When rider accepts via PUT /orders/:id/accept:
// Server-side: find rider's socket and join them to the order room
const riderSocket = [...io.sockets.sockets.values()].find(s => s.userId === riderId.toString())
if (riderSocket) riderSocket.join(`order:${orderId}`)
// This ensures rider receives order_cancelled events for this order
```

### Rider Assignment Notification
```js
// When rider accepts order:
io.to(`order:${orderId}`).emit('order_accepted_by_rider', {
  orderId,
  rider: { name, phone, vehicleType, vehicleNumber }
})
```

### No Rider Timeout — DB-Based Cron (Kubernetes-Safe)
```js
// ⚠️ Old approach (in-memory setTimeout Map) removed — breaks with 2+ Kubernetes pods
// New approach: store deadline in Order.riderAssignmentDeadline, check via node-cron

// When restaurant marks order 'ready' (order controller):
order.riderAssignmentDeadline = new Date(Date.now() + 60000) // 60s from now
await order.save()

// jobs/riderAssignment.job.js — runs every 30s on ALL pods (idempotent DB query):
import cron from 'node-cron'
cron.schedule('*/30 * * * * *', async () => {
  const now = new Date()
  const overdueOrders = await Order.find({
    status: 'ready',
    riderId: null,
    riderAssignmentDeadline: { $lt: now }
  }).populate('restaurantId')

  for (const order of overdueOrders) {
    // Re-broadcast to all online riders
    io.to('riders_online').emit('new_order_available', {
      order, restaurant: order.restaurantId, distance: null
    })
    // Alert admin
    io.to('admin').emit('unassigned_order_alert', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      restaurantName: order.restaurantId.name,
      waitedSeconds: Math.floor((now - order.riderAssignmentDeadline) / 1000) + 60
    })
    // Push deadline forward 60s to avoid repeat alerts every 30s
    await Order.findByIdAndUpdate(order._id, {
      riderAssignmentDeadline: new Date(Date.now() + 60000)
    })
  }
})

// When rider accepts / admin assigns / order cancelled:
// Simply set order.riderAssignmentDeadline = null — cron query won't pick it up
```

---

## Kubernetes Deployment Note

```
Socket.IO requires sticky sessions (session affinity) when running 2+ pods.
Without sticky sessions, a client's WebSocket handshake may hit Pod A but
subsequent requests hit Pod B → connection fails.

Kubernetes Ingress config (add to ingress.yaml):
  nginx.ingress.kubernetes.io/affinity: "cookie"
  nginx.ingress.kubernetes.io/session-cookie-name: "io-session"
  nginx.ingress.kubernetes.io/session-cookie-expires: "172800"

With sticky sessions:
  - Each client always routes to the same pod ✅
  - Socket rooms (riders_online, admin, order:X) work correctly per pod ✅
  - DB-based cron (riderAssignment.job.js) runs on all pods but is idempotent ✅
  - No Redis adapter needed for this scale ✅
```

---

## Client-Side Socket Setup (All Apps)

```js
// services/socket.js
import { io } from 'socket.io-client'
import useAuthStore from '../store/authStore'

let socket = null

export const connectSocket = () => {
  const token = useAuthStore.getState().token
  socket = io(process.env.EXPO_PUBLIC_API_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,          // auto-reconnect on connection loss
    reconnectionDelay: 1000,     // wait 1s before first retry
    reconnectionAttempts: Infinity // keep trying until restored
  })
  return socket
}

export const getSocket = () => socket
export const disconnectSocket = () => socket?.disconnect()
```

### Reconnection Behavior — Internet Loss During Delivery

```
Rider loses internet:
  → Socket.IO auto-retries in background (reconnectionDelay: 1s)
  → rider-app: location tracking continues buffering in background (expo-location still runs)
  → On reconnect: rider-app listens for socket 'connect' event
      → if activeOrderStore has an active order → re-emit rider_location_update immediately
  → Customer tracking screen: if no rider_location received for 15s → show "Connecting..." indicator
      → REST fallback: fetch last known location from GET /api/delivery/track/:orderId
      → On socket reconnect → live updates resume automatically (already in room)

Customer loses internet:
  → Socket.IO auto-retries
  → On reconnect: re-join order:{orderId} room
  → Fetch current location via REST fallback
  → Live updates resume
```
