# 🔧 Fix: Card Revert Issue - Summary

## 📋 Problem Description
Ketika user klik button "Approve All" atau "Reject All" pada Lark card:
1. ✅ Card berubah dari Tipe A (dengan buttons) → Tipe B (result card tanpa buttons)
2. ❌ **Card kemudian revert kembali ke Tipe A** (dengan buttons lagi)

## 🔍 Root Cause Analysis

### Issue #1: Duplicate Card Action Processing
Card action di-process **DUA KALI** oleh webhook handler:
1. **Legacy Format Handler** (line 110-115 dalam index.js lama)
   - Mendeteksi `body.action.tag === 'button'`
   - Memanggil `handleCardAction(body)`

2. **Schema 2.0 Handler** (line 144-148 dalam index.js lama)
   - Mendeteksi `header.event_type === 'card.action.trigger'`
   - Memanggil `handleCardAction(event)` LAGI

**Result:** Event yang sama di-process 2x → race condition → card bisa revert

### Issue #2: Bot Message Triggering Re-send
Ketika bot meng-update card (Tipe A → Tipe B), Lark mengirim message event dengan `message_type === 'interactive'`. Jika tidak di-filter, ini bisa trigger bot untuk mengirim ulang card Tipe A.

### Issue #3: No Event Deduplication
Tidak ada mekanisme untuk track event yang sudah di-process, sehingga event yang sama bisa di-process multiple times dalam window waktu yang singkat.

## ✅ Solutions Implemented

### Fix #1: In-Memory Event Cache
```javascript
// Added in index.js line 11-23
const processedEvents = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of processedEvents.entries()) {
        if (now - timestamp > CACHE_TTL) {
            processedEvents.delete(key);
        }
    }
}, CACHE_TTL);
```

**Purpose:** Track event IDs yang sudah di-process untuk prevent duplicate processing dalam 5 menit.

### Fix #2: Disable Legacy Card Action Handler
```javascript
// index.js line 113-116
if (isLegacyCardAction) {
    console.log('⏭️ Skipping legacy card action format (will be handled by Schema 2.0)');
    return res.json({ ok: true });
}
```

**Purpose:** Hanya gunakan Schema 2.0 handler (`card.action.trigger`) untuk avoid duplicate processing.

### Fix #3: Event Deduplication in Card Action Handler
```javascript
// index.js line 147-167
const eventId = header.event_id;
const actionValue = event.action?.value;
const dedupeKey = eventId || (actionValue ? `action_${actionValue}` : null);

if (dedupeKey && processedEvents.has(dedupeKey)) {
    console.log(`⏭️ Skipping duplicate event: ${dedupeKey}`);
    return res.json({ ok: true });
}

processedEvents.set(dedupeKey, Date.now());
```

**Purpose:** Check apakah event sudah pernah di-process menggunakan unique event_id.

### Fix #4: Ignore Interactive Card Messages
```javascript
// index.js line 135-139
if (event.message && event.message.message_type === 'interactive') {
    console.log('⏭️ Skipping interactive card message (likely a card update)');
    return res.json({ ok: true });
}
```

**Purpose:** Prevent bot dari respond ke card update messages (yang bisa trigger re-send card Tipe A).

### Fix #5: messageService.js Function Order Fix
**Before:** `updateMessageCard` di-export sebelum didefinisikan → undefined error

**After:** Function didefinisikan dulu, baru di-export

## 🧪 Testing Instructions

### Test Case 1: Normal Card Action Flow
1. Kirim pesan ke bot Lark
2. Bot mengirim card Tipe A dengan buttons "Approve All" dan "Reject All"
3. Klik salah satu button
4. **Expected:** Card berubah ke Tipe B (result card) dan **TIDAK revert** ke Tipe A
5. **Expected Log Output:**
   ```
   🔘 Card action event received (Schema 2.0)
   ⏳ Starting database update...
   ✅ Update success: X records
   🔄 Updating message [message_id]...
   ```

### Test Case 2: Duplicate Event Prevention
1. Jika Lark mengirim duplicate events (edge case)
2. **Expected Log Output:**
   ```
   🔘 Card action event received (Schema 2.0)
   ⏭️ Skipping duplicate event: [event_id]
   ```

### Test Case 3: Message Event Filtering
1. Ketika card di-update
2. Bot tidak boleh respond dengan mengirim card baru
3. **Expected Log Output:**
   ```
   💬 Message event received
   ⏭️ Skipping interactive card message (likely a card update)
   ```

## 🚀 Deployment Checklist

- [x] Fix implemented in `index.js`
- [x] Fix implemented in `messageService.js`
- [x] Code tested locally (optional)
- [ ] Deploy to Vercel: `git push origin main`
- [ ] Monitor Vercel logs for any errors
- [ ] Test end-to-end flow in Lark

## 📊 Files Modified

1. **d:\report\index.js**
   - Added in-memory event cache (line 11-23)
   - Disabled legacy card action handler (line 113-116)
   - Added event deduplication for card actions (line 147-167)
   - Added interactive message filtering (line 135-139)

2. **d:\report\services\messageService.js**
   - Moved `updateMessageCard` function before `module.exports` to fix undefined error

## 🔮 Future Improvements

1. **Persistent Event Cache** - Use Redis instead of in-memory Map for distributed systems
2. **Webhook Signature Verification** - Add cryptographic signature verification
3. **Retry Logic** - Add exponential backoff for failed database updates
4. **Monitoring** - Add metrics/alerting for duplicate events and card revert incidents

## 📝 Notes

- Event cache uses **in-memory Map**, so akan reset jika server restart
- Cache TTL adalah **5 menit** - bisa di-adjust sesuai kebutuhan
- Legacy card action format di-skip untuk force use Schema 2.0 only
