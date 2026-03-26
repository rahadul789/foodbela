# Bela (বেলা) — Interactive Cat Mascot

The soul of FoodBela. Bela is a cute, expressive cat that lives in the customer-app as a floating companion. She guides users, reacts to their actions, celebrates wins, and emotionally connects with users.

**Core rule:** Bela is modular. All her code lives in `modules/bela/` — zero coupling with other app code.

---

## Personality

Bela is a Bengal cat. She's:
- **Adorable & friendly** — default state, always welcoming
- **Foodie** — obsessed with food, drools at food images, suggests dishes
- **Moody** — gets hangry when cart is empty too long, sleepy late at night
- **Funny** — drops random food jokes, makes silly faces
- **Encouraging** — cheers users through the ordering process
- **Emotional** — sad when order cancelled, ecstatic when food arrives
- **Responsive** — reacts to touch (tap, long press, drag)

Language: **Bangla (বাংলা)** — all dialogues in Bangla with occasional Banglish.

---

## Mood System

Bela has moods that change based on context. Each mood maps to a specific animation + set of dialogues.

| Mood | Trigger | Animation | Example Dialogue |
|------|---------|-----------|------------------|
| `happy` | Default, browsing food | Tail wagging, eyes bright | "আজকে কি খাবে? 😺" |
| `excited` | Order placed, order arriving | Jumping, sparkling eyes | "অর্ডার হয়ে গেছে! 🎉" |
| `hungry` | Empty cart, idle on home 30s+ | Rubbing belly, drooling | "পেটে ছুঁচো নাচতেছে... কিছু অর্ডার কর না! 🍕" |
| `sleepy` | Late night (12am-5am) | Yawning, half-closed eyes | "এত রাতে? Late night snack নাকি? 😴" |
| `curious` | First time on any screen | Head tilt, big eyes | "এইটা নতুন! দেখি দেখি... 🔍" |
| `celebrating` | Order delivered | Party hat, confetti | "খাবার এসে গেছে! Enjoy কর! 🥳" |
| `sad` | Order cancelled, empty search | Droopy ears, teary eyes | "😿 অর্ডার cancel হয়ে গেছে..." |
| `angry` | Payment failed, error | Puffed up, hissing | "কি হলো! আবার try কর! 😾" |
| `proud` | First order complete, review submitted | Chest puffed, crown | "তোমার প্রথম অর্ডার! তুমি তো pro! 👑" |
| `love` | User gives 5-star rating | Heart eyes | "5 star! তুমি best! ❤️" |
| `thinking` | Loading states, searching | Paw on chin | "খুঁজতেছি... একটু wait কর... 🤔" |
| `waving` | App open, return after absence | Waving paw | "ফিরে এসেছ! Miss করেছিলাম! 👋" |
| `pointing` | Guiding to a button/action | Pointing paw at direction | "ওইখানে tap কর! 👆" |

### Mood Priority (highest → lowest)
1. Screen-specific override (e.g., order delivered → `celebrating`)
2. User action trigger (e.g., cart emptied → `sad`)
3. Time-based (e.g., late night → `sleepy`)
4. Context-based (e.g., first visit → `curious`)
5. Default → `happy`

---

## Screen-Specific Behavior

### Home Screen
| Context | Mood | Bela Does |
|---------|------|-----------|
| First open today | `waving` | "আসসালামু আলাইকুম! আজকে কি খাওয়ার ইচ্ছা?" |
| Return after 3+ days | `waving` | "কোথায় ছিলে এতদিন! 😿 আমি একা একা বসে ছিলাম!" |
| Idle 30s+ (not scrolling) | `hungry` | "Scroll কর না! এত restaurant আছে! 🍔" |
| Near featured restaurant | `pointing` | "ওই restaurant টা try কর! সবাই বলে ভালো! ⭐" |
| Morning (6-11am) | `happy` | "সকালে নাস্তা খেয়েছ? না খেলে অর্ডার দাও! 🥞" |
| Lunch (12-2pm) | `hungry` | "দুপুরের খাবার time! ক্ষুধা লাগেনি? 🍛" |
| Evening (6-9pm) | `excited` | "রাতের menu দেখ! কি কি আছে আজ! 🌙" |
| Rainy weather (if available) | `happy` | "বৃষ্টির দিনে খিচুড়ি-ইলিশ ছাড়া চলে? 🌧️" |

### Restaurant List / Search
| Context | Mood | Bela Does |
|---------|------|-----------|
| Browsing restaurants | `curious` | "কোনটা ভালো লাগতেছে? আমি বলি — ratings দেখ! ⭐" |
| Empty search results | `sad` | "কিছু পাইনি 😿 অন্য কিছু search কর!" |
| Searching | `thinking` | "খুঁজতেছি... 🔍" |
| Found many results | `excited` | "এত options! তোমার জন্য best টা বাছাই কর! 🎯" |

### Restaurant Detail / Menu
| Context | Mood | Bela Does |
|---------|------|-----------|
| Viewing menu | `hungry` | "এই items গুলা দেখ! আমার পেটে ক্ষুধা! 🤤" |
| Item has discount | `excited` | "Discount আছে! তাড়াতাড়ি নাও! 🏷️" |
| Popular item visible | `pointing` | "এইটা সবচেয়ে popular! Try কর! 🔥" |
| Added first item to cart | `happy` | "Nice choice! আরো নিবে? 😺" |
| Restaurant closed | `sad` | "বন্ধ এখন 😿 পরে আবার আসো!" |

### Cart Screen
| Context | Mood | Bela Does |
|---------|------|-----------|
| Viewing full cart | `happy` | "ভালো selection! Checkout করবে? 🛒" |
| Cart empty | `sad` | "Cart খালি! কিছু add কর! 😿" |
| Minimum order not met | `pointing` | "আরো ৳XX add করো — minimum order amount হয়নি!" |
| Removing items | `sad` | "নাহ সেটা রাখ না... 🥺" |
| Cart total high | `excited` | "বড় order! Voucher code আছে? Use কর! 🎟️" |

### Checkout Screen
| Context | Mood | Bela Does |
|---------|------|-----------|
| First time checkout | `curious` | "প্রথমবার? চিন্তা নাই — আমি guide করছি! Step by step 👆" |
| Address selection | `pointing` | "ঠিকানা select কর — ডেলিভারি এখানে আসবে! 📍" |
| Payment method selection | `pointing` | "bKash নাকি Cash on Delivery? যেটা comfortable! 💳" |
| Voucher available hint | `excited` | "Voucher code থাকলে লাগাও! Discount পাবে! 🎟️" |
| Voucher applied | `celebrating` | "Discount applied! ৳XX save হলো! 🎉" |
| About to place order | `excited` | "সব ঠিক আছে? Place Order চাপ! 🚀" |

### Order Placed / Confirmation
| Context | Mood | Bela Does |
|---------|------|-----------|
| Order just placed | `celebrating` | "অর্ডার হয়ে গেছে! 🎉 Restaurant confirm করবে একটু wait কর!" |
| bKash payment success | `celebrating` | "Payment successful! এখন বসে থাক, খাবার আসবে! ✅" |
| bKash payment failed | `angry` | "Payment হয়নি! 😾 আবার try কর — balance check কর!" |

### Order Tracking Screen
| Context | Mood | Bela Does |
|---------|------|-----------|
| Order confirmed | `happy` | "Restaurant confirm করেছে! রান্না শুরু হবে! 🍳" |
| Preparing | `thinking` | "রান্না হচ্ছে... একটু patience! 👨‍🍳" |
| Ready for pickup | `excited` | "খাবার ready! Rider আসতেছে নিতে! 🏃" |
| Rider assigned | `happy` | "Rider পেয়ে গেছ! উনি আসতেছেন! 🏍️" |
| Rider picked up | `excited` | "খাবার নিয়ে আসতেছে! Track কর map এ! 🗺️" |
| Rider nearby (500m) | `celebrating` | "প্রায় পৌঁছে গেছে! দরজা খোল! 🚪" |
| Delivered | `celebrating` | "এসে গেছে! Enjoy কর! 🥳 Rating দিতে ভুলো না!" |
| Long wait (ETA passed) | `sad` | "একটু late হচ্ছে... sorry! আসবে আসবে! 😿" |

### Order Cancelled
| Context | Mood | Bela Does |
|---------|------|-----------|
| User cancelled | `sad` | "Cancel করে দিলে? 😿 পরের বার আবার দিও!" |
| Restaurant cancelled | `angry` | "Restaurant cancel করে দিয়েছে! 😾 অন্য restaurant try কর!" |
| Refund processing | `thinking` | "Refund process হচ্ছে... ২ ঘন্টার মধ্যে হবে! 💰" |
| Refund completed | `happy` | "Refund হয়ে গেছে! bKash এ check কর! ✅" |

### Rating Screen
| Context | Mood | Bela Does |
|---------|------|-----------|
| Rating prompt | `curious` | "কেমন ছিল খাবার? Rating দাও! ⭐" |
| 5 stars given | `love` | "5 star! তুমি best customer! ❤️" |
| 4 stars given | `happy` | "4 star — pretty good! 😺" |
| 1-2 stars given | `sad` | "এত কম? 😿 কি problem হয়েছিল? Comment এ বলো!" |
| Review submitted | `proud` | "ধন্যবাদ! তোমার feedback অনেক কাজে আসবে! 👑" |

### Profile / Settings
| Context | Mood | Bela Does |
|---------|------|-----------|
| Viewing profile | `happy` | "তোমার profile! সব ঠিক আছে? 😺" |
| No addresses saved | `pointing` | "Address add কর — order দিতে লাগবে! 📍" |
| Referral section | `excited` | "Friends দের invite কর! তুমিও voucher পাবে! 🎁" |

### Notifications Screen
| Context | Mood | Bela Does |
|---------|------|-----------|
| Many unread | `pointing` | "অনেক notification! দেখ কি কি আছে! 🔔" |
| All read | `happy` | "সব দেখা হয়ে গেছে! ✅" |

### Empty States (Any Screen)
| Context | Mood | Bela Does |
|---------|------|-----------|
| No orders yet | `curious` | "এখনো কোনো order নাই! প্রথম order দাও! 🍕" |
| No notifications | `sleepy` | "কোনো notification নাই... শান্তি! 😴" |
| No restaurants nearby | `sad` | "কাছে কোনো restaurant নাই 😿 location check কর!" |
| Network error | `angry` | "Internet নাই! 😾 Connection check কর!" |

---

## Touch Interactions

Bela responds to touch — making her feel alive.

| Gesture | Response | Animation | Sound (optional) |
|---------|----------|-----------|-------------------|
| **Single tap** | Random reaction | Jump / Meow / Spin / Wave | Soft "meow" |
| **Double tap** | Food tip or joke | Thought bubble appears | Playful "mew" |
| **Long press (1s+)** | Purring + special animation | Eyes close, purring vibration | Purr sound |
| **Swipe away** | Bela hides (minimizes to small icon) | Slides off screen | Sad "mew" |
| **Tap minimized icon** | Bela returns | Bounces back | Happy "meow" |
| **Shake device** | Easter egg: Bela gets dizzy | Spinning eyes, wobble | Dizzy meow |

### Random Tap Responses (Bangla)
```
"কি? আমাকে ডাকছ? 😺"
"হ্যাঁ হ্যাঁ, বলো! 🐱"
"গুদগুদি লাগতেছে! 😹"
"আমাকে touch করো না! ...ok একটু পারো 🙈"
"খাবার order দেবে? নাকি শুধু আমার সাথে খেলবে? 😏"
"Purrrr... 😻"
"বোরিং! কিছু order কর! 🍔"
"আমি hungry! তুমিও hungry না? 🤤"
"*meow* (translation: তাড়াতাড়ি খাবার দাও) 🐾"
"তুমি আমার favorite human! ❤️"
```

### Double Tap — Food Tips & Jokes
```
"জানো? বিরিয়ানি বাঙালির DNA তে আছে! 🧬🍗"
"Pro tip: ভাতের সাথে ডাল না থাকলে কি ভাত? 🤔"
"Fun fact: পিৎজার জন্ম Italy তে, কিন্তু heart এ বাংলাদেশে! 🍕❤️"
"আমি যদি মানুষ হতাম, সারাদিন শুধু খেতাম! ...wait, আমি তাই করি! 😹"
"Today's tip: নতুন restaurant try কর! Adventure! 🗺️"
"বৃষ্টির দিনে পেঁয়াজু ছাড়া চলে? আমি বলি না! 🌧️"
"5 star rating দিলে restaurant owner খুশি হয়! দিও কিন্তু! ⭐"
```

---

## Onboarding Flow (First-Time User)

When a user opens the app for the very first time after registration, Bela walks them through the app.

### Step 1 — Welcome
```
Bela appears center screen with sparkle animation
"আমি বেলা! 🐱 তোমার food buddy!"
"আমি তোমাকে help করবো সবচেয়ে tasty খাবার খুঁজে পেতে!"
[Next →]
```

### Step 2 — Home Screen Guide
```
Bela points at restaurant list
"এখানে কাছের সব restaurant দেখতে পাবে!"
"Scroll কর আর যেটা ভালো লাগে সেটায় tap কর! 👆"
[Next →]
```

### Step 3 — Search & Categories
```
Bela points at search bar and category filters
"কিছু specific খুঁজলে search কর!"
"অথবা category থেকে filter কর — Biryani, Pizza, Chinese... 🍕"
[Next →]
```

### Step 4 — Ordering
```
Bela shows mini order flow animation
"Menu থেকে item select কর → Cart → Checkout → Done! ✅"
"bKash দিয়ে pay কর অথবা Cash on Delivery দাও!"
[Got it! 🎉]
```

### Post-Onboarding
```
Bela settles into her floating position (bottom-right)
"আমি এখানেই আছি! যখন help লাগবে, আমাকে tap কর! 😺"
```

**Store flag:** `hasCompletedOnboarding` in AsyncStorage. Show onboarding only once.

---

## Achievement Celebrations

Bela celebrates user milestones with special animations.

| Achievement | Bela's Reaction |
|-------------|-----------------|
| First order placed | Crown animation + "তোমার প্রথম অর্ডার! Welcome to FoodBela family! 👑" |
| 5th order | Party hat + "5টা order! তুমি তো regular হয়ে গেছ! 🎉" |
| 10th order | Gold star + "10 orders complete! তুমি FoodBela champion! 🏆" |
| 25th order | Special cat costume + "25 orders! তুমি legend! 🌟" |
| 50th order | Fireworks + "50! তোমাকে ছাড়া FoodBela অচল! 🎆" |
| First 5-star review | Heart explosion + "প্রথম 5 star! Restaurant owner অনেক খুশি! ❤️" |
| First referral used | Gift box + "তোমার friend ও এখন FoodBela তে! Voucher নাও! 🎁" |
| First voucher used | Confetti + "Discount নিয়ে নিলে! Smart! 🎟️" |
| Ordering streak (3 consecutive days) | Fire animation + "3 দিন streak! তুমি on fire! 🔥" |

**Storage:** Track achievements in `AsyncStorage` as `belaAchievements: { firstOrder: true, orderCount: 5, ... }`.
Don't send to server — purely client-side delight.

---

## Idle Engagement

If the user opens the app but doesn't interact for a while, Bela tries to engage.

| Idle Time | Bela Does |
|-----------|-----------|
| 15 seconds | Waves paw to get attention |
| 30 seconds | Shows food suggestion bubble: "এই restaurant এর burger নাকি খুব ভালো! 🍔" |
| 60 seconds | Gets dramatic: "আমি এখানে একা একা বসে আছি... 😿" |
| 2 minutes | Falls asleep: *zzz animation* — tapping wakes her up: "হুম? কি? অর্ডার দিবে? 😴" |

---

## Minimize / Dismiss Behavior

- **Default position:** Bottom-right corner, floating above content (not blocking key UI)
- **Swipe right on Bela:** She slides off screen → small paw icon remains at edge
- **Tap paw icon:** Bela bounces back
- **Settings toggle:** User can disable Bela entirely from Profile > Settings
- **Bela remembers:** If dismissed, stays minimized for the session. Comes back next app open.
- **Smart hiding:** Auto-minimizes during:
  - bKash payment WebView
  - Live tracking map (full screen)
  - Any modal/bottom sheet open

---

## Animation System

Use **Lottie** (`lottie-react-native`) for all Bela animations.

### Animation Files Needed
```
assets/bela/
├── happy.json           # Default happy state (looping)
├── excited.json         # Jumping with sparkles (looping)
├── hungry.json          # Rubbing belly, drooling (looping)
├── sleepy.json          # Yawning, zzz (looping)
├── curious.json         # Head tilt, big eyes (looping)
├── celebrating.json     # Party hat, confetti (play once → loop idle)
├── sad.json             # Droopy ears (looping)
├── angry.json           # Puffed up, tail big (looping)
├── proud.json           # Crown, chest puff (play once → loop idle)
├── love.json            # Heart eyes (play once → loop idle)
├── thinking.json        # Paw on chin (looping)
├── waving.json          # Paw wave (play once → loop happy)
├── pointing.json        # Pointing paw (play once → loop idle)
├── tap-reaction.json    # Random tap response (play once)
├── purring.json         # Long press purr (looping while pressed)
├── sleeping.json        # Idle too long (looping)
├── dizzy.json           # Shake easter egg (play once)
├── slide-out.json       # Dismiss animation (play once)
├── slide-in.json        # Return animation (play once)
└── onboarding/
    ├── welcome.json     # Sparkle entrance
    ├── guide-scroll.json
    ├── guide-search.json
    └── guide-order.json
```

**Lottie files:** Will be custom-designed. Each file ~30-80KB. Total: ~1.5MB.

### Animation Transitions
```
mood change → play transition animation → loop new mood animation
tap → interrupt current → play tap-reaction → resume mood animation
```

---

## Speech Bubble System

Bela's dialogues appear in a cute speech bubble above her.

### Bubble Behavior
- Appears on mood change, screen change, or tap
- Auto-dismisses after 4 seconds (configurable per message)
- Max 2 lines of text (truncate with "..." if needed)
- Tap bubble to dismiss immediately
- Queue system: if multiple messages trigger, show one at a time (3s gap)
- **Cooldown:** Don't show same message within 5 minutes
- **Frequency cap:** Max 1 automatic bubble per 30 seconds (taps bypass this)

### Bubble Style
```
  ┌─────────────────────────┐
  │ আজকে কি খাবে? 😺      │
  └────────────┬────────────┘
               ▼
          [Bela Cat]
```

---

## Technical Architecture

### Module Structure (customer-app)
```
customer-app/
└── modules/
    └── bela/
        ├── index.js                    # Module exports
        ├── components/
        │   ├── BelaOverlay.jsx         # Main floating overlay (wraps everything)
        │   ├── BelaCharacter.jsx       # Lottie animation renderer
        │   ├── BelaBubble.jsx          # Speech bubble component
        │   ├── BelaMinimized.jsx       # Small paw icon (when dismissed)
        │   └── BelaOnboarding.jsx      # Full-screen onboarding flow
        ├── context/
        │   └── BelaProvider.jsx        # Context provider — mood, visibility, message queue
        ├── hooks/
        │   ├── useBela.js              # Main hook — controls mood, message, animation
        │   ├── useBelaTouch.js         # Gesture handlers (tap, long press, swipe)
        │   ├── useBelaMood.js          # Mood engine — resolves current mood from context
        │   ├── useBelaScreen.js        # Screen-aware hook — detects current route
        │   └── useBelaAchievements.js  # Achievement tracker
        ├── data/
        │   ├── dialogues.js            # All dialogue strings organized by screen + mood
        │   ├── moods.js                # Mood definitions, priorities, transitions
        │   ├── achievements.js         # Achievement definitions + thresholds
        │   └── animations.js           # Animation file mapping per mood
        ├── utils/
        │   ├── belaStorage.js          # AsyncStorage helpers (onboarding, achievements, preferences)
        │   └── belaScheduler.js        # Message cooldown, frequency cap, queue logic
        └── assets/
            └── (Lottie JSON files — see Animation System section)
```

### Integration Point — Single Line

In the customer-app root layout, wrap with `BelaProvider`:

```jsx
// app/_layout.jsx
import { BelaProvider } from '../modules/bela'

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <BelaProvider>
        {/* ... existing layout ... */}
      </BelaProvider>
    </QueryClientProvider>
  )
}
```

`BelaProvider` renders the `BelaOverlay` internally — no other file needs to import Bela components.

### BelaProvider — Core Logic

```jsx
// modules/bela/context/BelaProvider.jsx
import { createContext, useState, useCallback, useEffect } from 'react'
import { usePathname } from 'expo-router'
import BelaOverlay from '../components/BelaOverlay'
import { getBelaEnabled } from '../utils/belaStorage'

export const BelaContext = createContext(null)

export function BelaProvider({ children }) {
  const [mood, setMood] = useState('happy')
  const [message, setMessage] = useState(null)
  const [isVisible, setIsVisible] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isEnabled, setIsEnabled] = useState(true)
  const pathname = usePathname()

  // Auto-hide on certain screens
  useEffect(() => {
    const hideScreens = ['/payment/bkash', '/order/track/']
    const shouldHide = hideScreens.some(s => pathname.includes(s))
    setIsVisible(!shouldHide)
  }, [pathname])

  const showMessage = useCallback((text, options = {}) => {
    // options: { duration, mood, priority }
    setMessage({ text, duration: options.duration || 4000 })
    if (options.mood) setMood(options.mood)
  }, [])

  const triggerMood = useCallback((newMood, dialogue) => {
    setMood(newMood)
    if (dialogue) setMessage({ text: dialogue, duration: 4000 })
  }, [])

  const value = {
    mood, setMood,
    message, showMessage,
    isVisible, setIsVisible,
    isMinimized, setIsMinimized,
    isEnabled, setIsEnabled,
    triggerMood,
    pathname
  }

  return (
    <BelaContext.Provider value={value}>
      {children}
      {isEnabled && <BelaOverlay />}
    </BelaContext.Provider>
  )
}
```

### How Screens Communicate with Bela

Screens never import Bela components. They use the `useBela` hook:

```jsx
// Example: Cart screen using Bela
import { useBela } from '../modules/bela'

function CartScreen() {
  const { triggerMood } = useBela()
  const { items } = useCartStore()

  useEffect(() => {
    if (items.length === 0) {
      triggerMood('sad', 'Cart খালি! কিছু add কর! 😿')
    } else {
      triggerMood('happy', 'ভালো selection! Checkout করবে? 🛒')
    }
  }, [items.length])

  // ... rest of cart UI (no Bela components here)
}
```

### useBela Hook — Simple API

```jsx
// modules/bela/hooks/useBela.js
import { useContext } from 'react'
import { BelaContext } from '../context/BelaProvider'

export function useBela() {
  const context = useContext(BelaContext)
  if (!context) {
    // If used outside BelaProvider, return no-ops (graceful degradation)
    return {
      triggerMood: () => {},
      showMessage: () => {},
      setIsVisible: () => {},
      mood: 'happy',
      isVisible: false
    }
  }
  return context
}
```

**Key:** If `BelaProvider` is removed from the layout, `useBela()` returns no-ops. Zero crashes. Zero coupling.

---

## Passive Mode (Zero Hook Usage)

Even if NO screen uses `useBela()`, Bela still works via passive detection:

1. **Route-based:** `useBelaScreen` inside `BelaProvider` watches `usePathname()` and auto-triggers screen-specific dialogues
2. **Time-based:** `useBelaMood` checks current hour and sets time-appropriate mood
3. **Idle-based:** Timer in `BelaOverlay` detects user inactivity and cycles through idle animations
4. **Order-based:** Bela listens to socket events (order_confirmed, order_delivered, etc.) directly inside BelaProvider and reacts

This means Bela is alive even without a single `useBela()` call in any screen.

### Socket Listener in BelaProvider

```jsx
// Inside BelaProvider
useEffect(() => {
  const socket = getSocket()
  if (!socket) return

  socket.on('order_confirmed', () => triggerMood('happy', 'Restaurant confirm করেছে! 🍳'))
  socket.on('order_preparing', () => triggerMood('thinking', 'রান্না হচ্ছে... 👨‍🍳'))
  socket.on('order_ready', () => triggerMood('excited', 'খাবার ready! Rider আসতেছে! 🏃'))
  socket.on('order_picked_up', () => triggerMood('excited', 'খাবার নিয়ে আসতেছে! 🏍️'))
  socket.on('rider_nearby', () => triggerMood('celebrating', 'প্রায় পৌঁছে গেছে! দরজা খোল! 🚪'))
  socket.on('order_delivered', () => triggerMood('celebrating', 'এসে গেছে! Enjoy কর! 🥳'))
  socket.on('order_cancelled', () => triggerMood('sad', 'অর্ডার cancel হয়ে গেছে... 😿'))

  return () => {
    socket.off('order_confirmed')
    socket.off('order_preparing')
    socket.off('order_ready')
    socket.off('order_picked_up')
    socket.off('rider_nearby')
    socket.off('order_delivered')
    socket.off('order_cancelled')
  }
}, [])
```

---

## Settings & User Control

User can control Bela from **Profile > Settings**:

| Setting | Default | Description |
|---------|---------|-------------|
| Show Bela | `true` | Enable/disable the cat entirely |
| Bela Sound | `false` | Enable/disable meow sounds on tap |
| Bela Bubbles | `true` | Show/hide speech bubbles (cat still animates) |

Stored in `AsyncStorage` under key `belaSettings`.

---

## Performance Considerations

- **Lottie files:** Compressed, each 30-80KB. Total bundle ~1.5MB (loaded lazily)
- **Overlay:** Uses `position: absolute` — does not affect layout or scroll performance
- **Re-renders:** `BelaContext` is split — mood changes don't re-render children (only the overlay)
- **Idle timer:** Uses `AppState` listener — no battery drain
- **Memory:** Only one Lottie animation loaded at a time (swap on mood change)
- **AsyncStorage reads:** On mount only, cached in state after
- **Bundle:** The entire `modules/bela/` can be excluded from production build if needed (feature flag)

---

## Data Dependencies — What Bela Needs From App

Bela's module imports from the app are minimal:

| Import | Source | What For |
|--------|--------|----------|
| `usePathname` | `expo-router` | Detect current screen |
| `getSocket` | `services/socket.js` | Listen to order events |
| `useCartStore` | `store/cartStore.js` | React to cart changes (optional, via useBela hook in cart screen) |
| `AsyncStorage` | `@react-native-async-storage/async-storage` | Persist settings, achievements |

That's it. Bela does not import any component, API service, or auth store directly.

---

## Summary — Why This Works

1. **Emotional connection:** Users feel like they have a friend in the app, not just a utility
2. **Guidance without friction:** First-time users get help without forced tutorials
3. **Bangla-first:** Every dialogue in Bangla — feels local, personal, familiar
4. **Touch responsiveness:** Makes the app feel alive and playful
5. **Zero coupling:** Remove `BelaProvider` from layout = Bela gone, app unchanged
6. **Performance safe:** Lottie + absolute positioning = no layout thrashing
7. **Unique differentiator:** No food delivery app in Bangladesh has this
