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

**Fully coded character** — SVG drawn in code (`react-native-svg`) + animated with `react-native-reanimated`.

### Why Code-Drawn (not Lottie/PNG)
- **Zero assets** — no designer, no Lottie files, no PNGs. The cat IS the code.
- **Full control** — every pixel is a prop. Sad? Change the eye bezier curve. Happy? Curve the mouth up.
- **Tiny bundle** — 0KB extra assets. Just JSX + SVG paths.
- **Animatable parts** — each body part is a separate SVG element with its own Reanimated shared values
- **Moods via props** — mood changes = different SVG path values, not different files

### Cat Anatomy — SVG Parts

Bela is built from ~15 SVG parts, each independently animatable:

```
┌─────────────────────────────────┐
│         Bela's SVG Parts        │
│                                 │
│    leftEar ╲     ╱ rightEar     │
│             ╲   ╱               │
│         ┌───────────┐           │
│         │  ◉     ◉  │ ← eyes (ellipse, pupil moves)
│         │     ▽     │ ← nose (small triangle)
│         │    ───    │ ← mouth (bezier: smile/frown/open)
│         │   /   \   │ ← whiskers (lines, 3 per side)
│         └───────────┘           │
│              │ │                │
│         ┌────┴─┴────┐          │
│         │   body    │ ← body (rounded rect/ellipse)
│         │           │          │
│         └─┬──┬──┬──┬┘          │
│           │  │  │  │ ← paws (4 small rounded rects)
│           └──┘  └──┘           │
│                    ～ ← tail (bezier curve, wags)
│                                 │
│   + accessories (per mood):     │
│     crown, party hat, hearts,   │
│     zzz bubbles, tears, steam   │
└─────────────────────────────────┘
```

### SVG Part Details

| Part | SVG Element | Animatable Properties |
|------|-------------|----------------------|
| **Head** | `<Ellipse>` | scale, rotation (tilt) |
| **Left/Right Ear** | `<Path>` (triangle) | rotation (perk up / droop), fill color (pink inside) |
| **Left/Right Eye** | `<Ellipse>` + `<Circle>` (pupil) | eye height (squint/wide), pupil position (look direction), pupil size |
| **Eyebrows** | `<Path>` (optional, per mood) | rotation, translateY (raised/furrowed) |
| **Nose** | `<Path>` (inverted triangle) | tiny bounce on tap |
| **Mouth** | `<Path>` (cubic bezier) | curve control points change per mood (smile ↑ / frown ↓ / open O / tongue out) |
| **Whiskers** | `<Line>` × 6 (3 per side) | rotation (twitch on tap) |
| **Body** | `<Path>` (rounded shape) | scaleY (breathing), scaleX (puff up when angry) |
| **Front Paws** | `<Ellipse>` × 2 | translateY (wave), rotation (point) |
| **Back Paws** | `<Ellipse>` × 2 | translateX (stance) |
| **Tail** | `<Path>` (cubic bezier) | control point animation (wag, curl, droop) |
| **Blush** | `<Circle>` × 2 (semi-transparent pink) | opacity (visible in love/happy) |

### Fur Color Palette

```
Body/Head fill:     #F4A460 (warm sandy orange-brown)
Darker stripes:     #CD853F (tiger stripes on forehead + body, Path overlays)
Ear inside:         #FFB6C1 (light pink)
Nose:               #FF69B4 (hot pink, small)
Eye color:          #2E8B57 (sea green iris) + #000 (pupil)
Eye white:          #FFFAF0 (floral white)
Paw pads:           #FFB6C1 (pink, shown in waving pose)
Belly (lighter):    #FFDEAD (navajo white, subtle)
Whiskers:           #2F2F2F (dark gray, thin lines)
Blush:              #FFB6C1 opacity 0.4
```

### Mood = SVG State Changes

Each mood changes specific SVG properties. NO file swaps — just prop changes with smooth interpolation:

| Mood | Eyes | Mouth | Ears | Tail | Body | Extras |
|------|------|-------|------|------|------|--------|
| `happy` | Normal, bright | Smile curve up (↑) | Perked up | Gentle wag (slow) | Normal | Blush visible |
| `excited` | Wide open, large pupils | Big open smile (O) | Perked high | Fast wag | Bouncing | Sparkle particles above head |
| `hungry` | Half-lidded, looking at food | Open, tongue out to side | Normal | Slow swish | Slight lean forward | Drool drop from mouth, belly rumble line |
| `sleepy` | Heavy half-closed (squint) | Small yawn (open oval) | Drooped slightly | Curled around body | Slow breathing (scaleY pulse) | Zzz text floating up (animated opacity + translateY) |
| `curious` | One big, one slightly smaller | Slight "o" | One up, one tilted | Upright, slight curve | Head tilt (rotate -10deg) | "?" above head |
| `celebrating` | Sparkle/star eyes | Huge smile, teeth showing | Perked max | Straight up, vibrating | Arms/paws up | Party hat accessory + confetti particles |
| `sad` | Downturned, teary (drop below eye) | Frown curve down (↓) | Fully drooped | Limp, hanging down | Slight shrink (scale 0.95) | Tear drop animating down cheek |
| `angry` | Narrowed, sharp angle brows | Zigzag frown, showing teeth | Flat back | Puffed (thick path), rigid | Puffed up (scaleX 1.1) | Steam puffs above head |
| `proud` | Confident, slightly closed | Smug smile (one side up) | Perked, relaxed | High elegant curve | Chest puffed (scaleY 1.05) | Crown accessory on head |
| `love` | Heart-shaped (replaced with heart paths) | Dreamy smile | Relaxed, soft | Curled into heart shape | Normal, slight float | Hearts floating up around body |
| `thinking` | Looking up-left, one squinting | Flat line, slight hmm | One up, one neutral | Still, slight curl | Paw on chin (front paw raised) | "..." thought dots above head |
| `waving` | Happy normal | Smile | Perked | Gentle wag | Normal | One front paw raised, waving back-and-forth |
| `pointing` | Looking in point direction | Smile | Perked, alert | Straight | Leaning toward point direction | One front paw extended outward |

### Continuous Animations (Reanimated loops)

These run constantly regardless of mood — they make Bela feel alive:

| Animation | Implementation | Shared Values |
|-----------|---------------|---------------|
| **Breathing** | Body scaleY oscillates 1.0 → 1.02 → 1.0 | `withRepeat(withSequence(withTiming(1.02, 2000), withTiming(1.0, 2000)), -1)` |
| **Blinking** | Eyes squash to line every 3-5s (random interval) | Eye height: full → 0.1 → full in 150ms. Random `setTimeout` re-triggers. |
| **Tail idle** | Tail bezier control point sways | `withRepeat(withSequence(withSpring(10), withSpring(-10)), -1, true)` |
| **Ear twitch** | Tiny random rotation on one ear | Random ear, ±3deg, every 5-8s |
| **Floating** | Entire cat floats up/down | `translateY: withRepeat(withSequence(withSpring(-4), withSpring(0)), -1, true)` |

### Mood Transition
```
Mood changes from A → B:
1. Quick scale down (1.0 → 0.85) — 120ms withTiming
2. Interpolate all SVG props from mood A values → mood B values — 200ms
3. Scale back up (0.85 → 1.0) — 250ms withSpring (bouncy)
4. Start mood B's specific animations
```

### Tap Reaction
```
User taps Bela:
1. Squish: scaleX → 1.15, scaleY → 0.85 — 80ms
2. Spring back: scaleX → 1.0, scaleY → 1.0 — 200ms spring
3. Jump: translateY → -25px — 150ms
4. Land with overshoot: translateY → 0 — 300ms spring (damping: 6)
5. Whiskers twitch: rotate ±8deg rapidly 3 times
6. Eyes widen briefly: eye scale 1.0 → 1.2 → 1.0
7. Resume current mood animation
```

### Accessories (Rendered Conditionally per Mood)

Drawn as extra SVG elements, layered on top of base cat:

| Accessory | When Shown | SVG |
|-----------|------------|-----|
| **Crown** | `proud` mood | Small golden `<Path>` with 3 points, positioned above head |
| **Party hat** | `celebrating` mood | Triangular `<Path>` with striped fill, on head |
| **Hearts** | `love` mood | 3 small `<Path>` hearts floating up with `withRepeat` translateY + opacity fade |
| **Tear drops** | `sad` mood | Small `<Ellipse>` below each eye, animated translateY downward + fade |
| **Steam puffs** | `angry` mood | 2 small `<Circle>` groups above head, animated scale pulse |
| **Zzz** | `sleepy`/`sleeping` | "Z" `<Text>` elements floating up diagonally, staggered opacity |
| **Sparkles** | `excited` mood | Small star `<Path>` elements around head, animated rotate + opacity |
| **"?"** | `curious` mood | `<Text>` element above head, gentle bounce |
| **"..."** | `thinking` mood | 3 dots appearing sequentially (staggered opacity) |
| **Tongue** | `hungry` mood | Small pink `<Path>` sticking out side of mouth |
| **Drool drop** | `hungry` mood | `<Ellipse>` below mouth, animated translateY down + detach |
| **Confetti** | `celebrating` mood | Multiple small colored `<Rect>` elements, random positions, falling + rotating |

### Example: Simplified Component Structure
```jsx
// modules/bela/components/BelaCharacter.jsx
import Svg, { Ellipse, Path, Circle, Line, Text, G } from 'react-native-svg'
import Animated, { useAnimatedProps } from 'react-native-reanimated'

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse)
const AnimatedPath = Animated.createAnimatedComponent(Path)
// ... other animated SVG components

export default function BelaCharacter({ mood, size = 80 }) {
  // Shared values for each body part
  const bodyScaleY = useSharedValue(1)
  const eyeHeight = useSharedValue(12)
  const mouthPath = useSharedValue(MOUTH_PATHS.smile)
  const tailControl = useSharedValue(0)
  const leftEarRotate = useSharedValue(0)
  const rightEarRotate = useSharedValue(0)
  // ... more shared values

  // Start continuous animations (breathing, blinking, idle tail)
  useContinuousAnimations({ bodyScaleY, eyeHeight, tailControl, leftEarRotate })

  // Apply mood-specific overrides
  useMoodAnimation(mood, { eyeHeight, mouthPath, tailControl, ... })

  return (
    <Svg width={size} height={size * 1.3} viewBox="0 0 100 130">
      {/* Tail (behind body) */}
      <AnimatedPath ... />

      {/* Body */}
      <AnimatedEllipse cx={50} cy={80} rx={30} ry={25} fill="#F4A460" ... />

      {/* Head */}
      <G>
        {/* Ears */}
        <AnimatedPath d="..." fill="#F4A460" />  {/* left ear */}
        <AnimatedPath d="..." fill="#F4A460" />  {/* right ear */}
        <AnimatedPath d="..." fill="#FFB6C1" />  {/* left ear inside */}
        <AnimatedPath d="..." fill="#FFB6C1" />  {/* right ear inside */}

        {/* Head shape */}
        <Ellipse cx={50} cy={40} rx={28} ry={24} fill="#F4A460" />

        {/* Tiger stripes on forehead */}
        <Path d="..." stroke="#CD853F" strokeWidth={1.5} />

        {/* Eyes */}
        <AnimatedEllipse cx={38} cy={38} rx={6} fill="#FFFAF0" />   {/* left white */}
        <AnimatedEllipse cx={62} cy={38} rx={6} fill="#FFFAF0" />   {/* right white */}
        <AnimatedCircle cx={38} cy={38} r={3} fill="#2E8B57" />     {/* left iris */}
        <AnimatedCircle cx={62} cy={38} r={3} fill="#2E8B57" />     {/* right iris */}
        <AnimatedCircle cx={38} cy={37} r={1.5} fill="#000" />      {/* left pupil */}
        <AnimatedCircle cx={62} cy={37} r={1.5} fill="#000" />      {/* right pupil */}

        {/* Nose */}
        <Path d="M48,46 L50,49 L52,46 Z" fill="#FF69B4" />

        {/* Mouth (bezier — changes per mood) */}
        <AnimatedPath stroke="#333" strokeWidth={1.5} fill="none" />

        {/* Whiskers */}
        <Line x1={20} y1={44} x2={35} y2={42} stroke="#2F2F2F" />  {/* left whiskers */}
        <Line x1={65} y1={42} x2={80} y2={44} stroke="#2F2F2F" />  {/* right whiskers */}
        {/* ... 4 more whisker lines */}

        {/* Blush (conditional) */}
        <Circle cx={30} cy={48} r={5} fill="#FFB6C1" opacity={0.4} />
        <Circle cx={70} cy={48} r={5} fill="#FFB6C1" opacity={0.4} />
      </G>

      {/* Front paws */}
      <AnimatedEllipse cx={35} cy={102} rx={8} ry={5} fill="#F4A460" />
      <AnimatedEllipse cx={65} cy={102} rx={8} ry={5} fill="#F4A460" />

      {/* Mood-specific accessories */}
      {mood === 'proud' && <CrownAccessory />}
      {mood === 'celebrating' && <PartyHat />}
      {mood === 'love' && <FloatingHearts />}
      {mood === 'sad' && <TearDrops />}
      {mood === 'angry' && <SteamPuffs />}
      {mood === 'sleepy' && <ZzzBubbles />}
      {mood === 'excited' && <Sparkles />}
      {mood === 'curious' && <QuestionMark />}
      {mood === 'thinking' && <ThinkingDots />}
      {mood === 'hungry' && <DroolDrop />}
      {mood === 'celebrating' && <ConfettiParticles />}
    </Svg>
  )
}
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
        │   ├── BelaCharacter.jsx       # SVG cat rendered in code (react-native-svg + reanimated)
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
        │   └── animations.js           # Reanimated animation configs per mood (shared value targets, durations, springs)
        ├── svg/
        │   ├── catParts.js            # SVG path data for all body parts (head, ears, body, tail, paws)
        │   ├── accessories.js         # SVG components for mood accessories (crown, party hat, hearts, zzz, tears, steam, confetti)
        │   └── colors.js             # Cat color palette constants
        └── utils/
            ├── belaStorage.js          # AsyncStorage helpers (onboarding, achievements, preferences)
            └── belaScheduler.js        # Message cooldown, frequency cap, queue logic
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

- **Zero assets:** No images, no Lottie files — SVG is just JSX code, adds ~0KB to bundle
- **SVG rendering:** react-native-svg is GPU-accelerated, ~15 SVG elements is trivial
- **Reanimated:** Runs on UI thread — 60fps animations without blocking JS thread
- **Overlay:** Uses `position: absolute` — does not affect layout or scroll performance
- **Re-renders:** `BelaContext` is split — mood changes don't re-render children (only the overlay)
- **Idle timer:** Uses `AppState` listener — no battery drain
- **Animated props:** `useAnimatedProps` updates SVG paths on UI thread — no JS bridge crossing
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
6. **Performance safe:** SVG + Reanimated on UI thread + absolute positioning = no layout thrashing
7. **Unique differentiator:** No food delivery app in Bangladesh has this
