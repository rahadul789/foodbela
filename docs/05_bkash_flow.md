# bKash Payment Flow

bKash Tokenized Checkout (Payment Gateway for merchants)

---

## How It Works

```
Customer places order
      ↓
POST /orders → order created with status:'payment_pending', paymentStatus:'pending'
               (Restaurant NOT notified yet)
      ↓
App calls POST /payments/bkash/create
      ↓
Server gets bKash token → calls bKash Create Payment API
      ↓
Server returns { paymentURL, paymentID }
      ↓
Customer opens paymentURL in WebView (Expo) or redirect (Web)
      ↓
Customer pays on bKash page
      ↓
bKash redirects to your callbackURL with paymentID + status
      ↓
App/Server calls POST /payments/bkash/execute with paymentID
      ↓
                      ┌─ SUCCESS: order.status='pending', paymentStatus='paid'
                      │           → emit new_order to restaurant NOW
bKash responds ───────┤
                      └─ FAIL/CANCEL: order.status='cancelled', paymentStatus='failed'
                                      → notify customer, no restaurant notification
      ↓ (success path)
Restaurant sees order, confirms
      ↓
Customer sees success screen
```

### When Refund Is Triggered

```
1. Customer cancels order BEFORE paying  (status='payment_pending')
   → Simple cancel — no refund needed

2. Customer cancels order AFTER paying   (status='pending', paymentMethod='bkash', paymentStatus='paid')
   → Server auto-triggers refund (full amount)

3. Admin manually refunds                (edge case: wrong items, food quality complaint)
   → Admin calls POST /payments/bkash/refund with { orderId, amount, reason }
   → Can be full or partial refund
```

---

## Refund Flow

```
POST /payments/bkash/refund called
      ↓
Validate: order.paymentMethod === 'bkash' && order.paymentStatus === 'paid'
      ↓
Get bKash token (getToken)
      ↓
Call bKash Refund API (see below)
      ↓
              ┌─ SUCCESS (statusCode='0000'):
              │    order.paymentStatus = 'refunded'
              │    order.refundStatus = 'completed'
              │    order.bkashRefundTrxID = response.refundTrxID
              │    order.refundedAmount = refundAmount
              │    order.refundReason = reason
              │    order.status = 'cancelled'        (if triggered by cancellation)
bKash ────────┤    → notify customer: "Refund of ৳X processed to your bKash"
              │    → save Notification (type: 'refund')
              │
              └─ FAILURE:
                   order.refundStatus = 'failed'
                   order.status = 'cancelled'         (order still cancelled regardless)
                   → notify customer: "Order cancelled — refund processing delayed, contact support"
                   → emit 'unprocessed_refund_alert' to admin room: { orderId, amount }
                   → admin manually processes refund from bKash merchant dashboard
```

---

## bKash Refund API

```js
POST /tokenized/checkout/payment/refund
Headers:
  Authorization: Bearer {id_token}
  X-APP-Key: {app_key}
Body:
  {
    paymentID: order.bkashPaymentID,       // original payment ID
    trxID: order.bkashTrxID,              // original transaction ID
    amount: refundAmount.toFixed(2),       // string, 2 decimal places
    reason: "order_cancelled",             // or 'admin_manual'
    sku: order.orderNumber                 // optional — use orderNumber for traceability
  }

Response (success):
  {
    statusCode: "0000",
    statusMessage: "Successful",
    originalTrxID: "...",
    refundTrxID: "...",          ← save as order.bkashRefundTrxID
    transactionStatus: "Completed",
    amount: "...",               ← save as order.refundedAmount
    completedTime: "..."
  }
```

---

## Refund Error Codes

| Code | Meaning |
|------|---------|
| 0000 | Success |
| 2062 | Insufficient merchant balance to refund |
| 2063 | Refund not allowed (time window passed) |
| 2064 | Already refunded |
| 9999 | System error |

---

## bKash API Endpoints (Sandbox)

Base URL: `https://tokenized.sandbox.bka.sh/v1.2.0-beta`

| Step            | Method | Endpoint                             |
| --------------- | ------ | ------------------------------------ |
| Get Token       | POST   | `/tokenized/checkout/token/grant`    |
| Create Payment  | POST   | `/tokenized/checkout/create`         |
| Execute Payment | POST   | `/tokenized/checkout/execute`        |
| Query Payment   | POST   | `/tokenized/checkout/payment/status` |
| Refund          | POST   | `/tokenized/checkout/payment/refund` |

---

## Environment Variables (Server)

```env
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
BKASH_APP_KEY=your_app_key
BKASH_APP_SECRET=your_app_secret
BKASH_USERNAME=your_username
BKASH_PASSWORD=your_password
BKASH_CALLBACK_URL=http://yourserver.com/api/v1/payments/bkash/callback
```

---

## Server Flow (bkash.service.js)

### Step 1 — Get Token

```js
// Called before every bKash API call (token expires in 1 hour)
// Cache the token in memory (or re-fetch on expiry)
POST /tokenized/checkout/token/grant
Headers:
  username: BKASH_USERNAME
  password: BKASH_PASSWORD
  Content-Type: application/json
Body:
  { app_key: BKASH_APP_KEY, app_secret: BKASH_APP_SECRET }

Response:
  { id_token, token_type, expires_in, refresh_token }
```

### Step 2 — Create Payment

```js
POST /tokenized/checkout/create
Headers:
  Authorization: Bearer {id_token}
  X-APP-Key: {app_key}
Body:
  {
    mode: "0011",               // fixed (checkout via URL)
    payerReference: userId,
    callbackURL: BKASH_CALLBACK_URL,
    amount: order.total.toFixed(2),  // string, 2 decimal places — use order.total (final price after all discounts)
    currency: "BDT",
    intent: "sale",
    merchantInvoiceNumber: orderNumber   // unique per payment
  }

Response:
  {
    paymentID,
    bkashURL,         ← open this in WebView
    callbackURL,
    successCallbackURL,
    failureCallbackURL,
    cancelledCallbackURL,
    amount,
    currency,
    intent,
    merchantInvoiceNumber,
    statusCode: "0000"
  }
```

### Step 3 — Customer Pays in WebView

```js
// Mobile: use expo WebView
// Web: redirect to bkashURL
// After payment, bKash does TWO things simultaneously:
//   1. Redirects the WebView to successCallbackURL → app detects this, calls execute API
//   2. Makes a server-to-server POST to callbackURL (bKash webhook)
//
// IMPORTANT — avoid double execute:
//   - The APP calls execute (primary path via WebView onNavigationStateChange)
//   - The server POST /payments/bkash/callback should NOT call execute again
//     It should only log/verify. The execute is always done by the app.
//   - In execute endpoint: add idempotency check:
//       if (order.status !== 'payment_pending') return { already processed }
//     This prevents any double-execute edge case
```

### Step 4 — Execute Payment

```js
POST /tokenized/checkout/execute
Headers:
  Authorization: Bearer {id_token}
  X-APP-Key: {app_key}
Body:
  { paymentID }

Response (success):
  {
    paymentID,
    trxID,            ← save this as bkashTrxID
    customerMsisdn,   ← bKash account number
    amount,
    currency,
    intent,
    merchantInvoiceNumber,
    statusCode: "0000",
    statusMessage: "Successful"
  }
```

### Step 5 — Update Order

```js
// If statusCode === "0000":
Order.paymentStatus = "paid";
Order.bkashPaymentID = paymentID;
Order.bkashTrxID = trxID;
Order.status = "pending"; // transitions from 'payment_pending'
// NOW emit new_order to restaurant
io.to(`restaurant:${order.restaurantId}`).emit("new_order", { order });
// save notification for restaurant
// If failed/cancelled:
Order.paymentStatus = "failed";
Order.status = "cancelled";
Order.cancelledBy = "system";
// notify customer of payment failure
```

---

## Mobile WebView Implementation (customer-app)

```jsx
// app/payment/bkash.jsx
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function BkashPayment() {
  const { paymentURL, orderId } = useLocalSearchParams();
  const router = useRouter();

  const handleNavigationChange = (navState) => {
    const url = navState.url;
    if (url.includes("status=success")) {
      // Extract paymentID from URL
      const paymentID = new URL(url).searchParams.get("paymentID");
      // Call execute API
      executePayment(paymentID, orderId).then(() =>
        router.replace(`/payment/success?orderId=${orderId}`),
      );
    }
    if (url.includes("status=failure") || url.includes("status=cancel")) {
      router.replace(`/order/${orderId}?paymentFailed=true`);
    }
  };

  return (
    <WebView
      source={{ uri: paymentURL }}
      onNavigationStateChange={handleNavigationChange}
    />
  );
}
```

---

## Token Caching Strategy

```js
// bkash.service.js
let cachedToken = null
let tokenExpiry = null

const getToken = async () => {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }
  // fetch new token
  const res = await axios.post(...)
  cachedToken = res.data.id_token
  tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000  // 60s buffer
  return cachedToken
}
```

---

## Error Codes

| Code | Meaning                   |
| ---- | ------------------------- |
| 0000 | Success                   |
| 2001 | Insufficient balance      |
| 2002 | Invalid payment           |
| 2003 | Payment already completed |
| 2004 | Payment expired           |
| 9999 | System error              |
