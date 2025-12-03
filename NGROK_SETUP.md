# 🚀 Quick Guide: Testing dengan ngrok + Lark Setup

## 📋 Yang Anda Butuhkan:
1. ✅ Server sudah running (sudah ✓)
2. ⏳ ngrok untuk expose server
3. ⏳ Lark App credentials
4. ⏳ Setup webhook di Lark

---

## Step 1: Download & Setup ngrok

### Download ngrok:
1. Buka: https://ngrok.com/download
2. Download untuk Windows (64-bit)
3. Extract file `ngrok.zip` ke folder (contoh: `C:\ngrok\`)

### Atau gunakan command (jika sudah ada):
```powershell
# Cek apakah ngrok sudah terinstall
ngrok version
```

---

## Step 2: Jalankan ngrok

### Buka Terminal/PowerShell BARU (jangan tutup yang lama!)

```powershell
# Jika ngrok di C:\ngrok\
cd C:\ngrok
.\ngrok http 3000

# Atau jika ngrok sudah di PATH
ngrok http 3000
```

### Output yang Anda dapatkan:
```
ngrok

Session Status                online
Account                       Your Account (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://xxxx-xxx-xxx-xxx.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

### ⭐ PENTING: Copy URL ngrok Anda!
```
https://xxxx-xxx-xxx-xxx.ngrok-free.app
```

**Webhook URL Anda:**
```
https://xxxx-xxx-xxx-xxx.ngrok-free.app/webhook/event
```

---

## Step 3: Setup Lark App

### 3.1 Buat Lark App (jika belum)

1. **Buka Lark Developer Console:**
   - International: https://open.larksuite.com/
   - China: https://open.feishu.cn/

2. **Login** dengan akun Lark/Feishu

3. **Create Custom App:**
   - Klik "Create custom app" / "创建企业自建应用"
   - App Name: `Weekly Report Bot`
   - Description: `Bot untuk weekly report analytics`
   - Klik "Create"

### 3.2 Dapatkan Credentials

**Di tab "Credentials & Basic Info":**
- Copy **App ID**: `cli_xxxxxxxxxxxxxxxxx`
- Copy **App Secret**: `xxxxxxxxxxxxxxxxxxxxx`

**Simpan dulu di notepad!**

---

## Step 4: Enable Bot & Permissions

### 4.1 Enable Bot
1. Tab **"Add capabilities"** → Klik **"Bot"**
2. Enable bot
3. Set Bot Name: `Weekly Report Bot`
4. Save

### 4.2 Add Permissions
1. Tab **"Permissions & Scopes"**
2. Klik **"Add scopes"**
3. Tambahkan:
   - ✅ `im:message` - Send and receive messages
   - ✅ `im:message.group_at_msg`
   - ✅ `im:message.p2p_msg`
   - ✅ `bitable:app` - Access bitable
   - ✅ `contact:user.base` - Get user info
   - ✅ `contact:user.base:readonly`
4. **Save**

---

## Step 5: Setup Event Subscriptions

### 5.1 Configure Webhook
1. Tab **"Event Subscriptions"**
2. **Request URL**: Paste URL ngrok Anda
   ```
   https://xxxx-xxx-xxx-xxx.ngrok-free.app/webhook/event
   ```
3. Klik **"Verify"**
   - Jika sukses: ✅ "Verification successful"
   - Jika gagal: Cek apakah server & ngrok masih running

### 5.2 Dapatkan Verification Token
Di halaman yang sama, copy:
- **Verification Token**: `xxxxxxxxxxxxxxxxx`
- **Encrypt Key**: `xxxxxxxxxxxxxxxxx` (optional, boleh kosong)

**Simpan di notepad!**

### 5.3 Subscribe to Events
1. Scroll ke **"Subscribe to Bot Events"**
2. Klik **"Add Event"**
3. Tambahkan:
   - ✅ `im.message.receive_v1` - Receive message
   - ✅ `card.action.trigger` - Card button action
4. **Save**

---

## Step 6: Setup Lark Base (Bitable)

### 6.1 Buat/Buka Base
1. Buka Lark → Klik "+" → **Base**
2. Buat tabel "Weekly Report" (atau gunakan yang ada)

### 6.2 Pastikan Field Berikut Ada:

| Field Name | Type | Wajib |
|------------|------|-------|
| Senior Manager | Person | ✅ |
| Status | Single Select / Text | ✅ |
| Title / Subject | Text | ✅ |
| created_time / date | DateTime | ✅ |

### 6.3 Dapatkan Base Token & Table ID

**Dari URL Base:**
```
https://xxx.larksuite.com/base/bascnXXXXXXXXXXXX?table=tblXXXXXXXXXX
                              ↑                        ↑
                         Base Token              Table ID
```

Copy:
- **Base Token**: `bascnXXXXXXXXXXXX`
- **Table ID**: `tblXXXXXXXXXX`

### 6.4 Grant Bot Access ke Base
1. Di Base, klik **"..."** → **"Manage Collaborators"**
2. **Add** → Cari bot: `Weekly Report Bot`
3. Permission: **"Can edit"**
4. **Save**

---

## Step 7: Isi File .env

### Buat file `.env` di `d:/report/`

**Copy dari .env.example:**
```powershell
Copy-Item .env.example .env
```

**Edit file `.env`** dengan semua credentials yang sudah dikumpulkan:

```env
# Dari Lark App (Step 3.2)
LARK_APP_ID=cli_xxxxxxxxxxxxxxxxx
LARK_APP_SECRET=xxxxxxxxxxxxxxxxxxxxx

# Dari Event Subscriptions (Step 5.2)
LARK_VERIFICATION_TOKEN=xxxxxxxxxxxxxxxxx
LARK_ENCRYPT_KEY=xxxxxxxxxxxxxxxxx

# Dari Lark Base (Step 6.3)
LARK_BASE_TOKEN=bascnXXXXXXXXXXXX
LARK_TABLE_ID=tblXXXXXXXXXX

# Server
PORT=3000
```

---

## Step 8: Restart Server

### Stop server yang lama (Ctrl+C di terminal)
### Jalankan lagi:
```powershell
npm run start
```

Server akan load `.env` yang baru!

---

## Step 9: Testing!

### 9.1 Tambahkan Bot
1. Buka Lark app
2. Search: `Weekly Report Bot`
3. Klik bot → **"Add"** / **"添加"**

### 9.2 Tambahkan Test Data
Di Lark Base, tambahkan beberapa data:
- **Senior Manager**: Pilih diri Anda sendiri
- **Status**: `Pending`
- **Title**: `Test Report 1`
- **created_time**: Hari ini

Tambahkan 2-3 data lagi dengan SM yang sama (Anda).

### 9.3 Test Bot
1. Buka chat dengan bot
2. Kirim pesan apa saja: `test` atau `hello`
3. Bot akan reply dengan **interactive card** berisi:
   - Nama SM (Anda)
   - Jumlah laporan (contoh: 3 laporan)
   - Ringkasan laporan
   - Tombol **Approve All** & **Reject All**

### 9.4 Test Button
1. Klik tombol **"Approve All"**
2. Card akan update → "3 laporan berhasil disetujui!"
3. Cek Base → Status berubah jadi **"Approved"** ✅

---

## 🎯 Checklist:

- [ ] ngrok running → dapat URL
- [ ] Lark App dibuat → dapat App ID & Secret
- [ ] Bot enabled & permissions ditambahkan
- [ ] Webhook URL di-setup & verified ✅
- [ ] Verification Token didapat
- [ ] Base Token & Table ID didapat
- [ ] Bot punya akses ke Base
- [ ] File `.env` sudah diisi
- [ ] Server di-restart
- [ ] Bot ditambahkan di Lark
- [ ] Test data ditambahkan
- [ ] Bot reply dengan card ✅
- [ ] Button approve/reject works ✅

---

## 🐛 Troubleshooting:

### Webhook verification gagal:
- Cek server masih running
- Cek ngrok masih running
- Cek URL ngrok benar (dengan `/webhook/event`)

### Bot tidak reply:
- Cek logs di terminal server
- Pastikan event `im.message.receive_v1` sudah di-subscribe
- Pastikan `.env` sudah terisi dengan benar

### "No reports found":
- Pastikan ada data di Base
- Pastikan field "Senior Manager" terisi dengan user Anda
- Pastikan data dibuat dalam 2 minggu terakhir

### Button tidak bekerja:
- Pastikan event `card.action.trigger` sudah di-subscribe
- Cek logs di terminal

---

## 📝 Notes:

- **ngrok free** akan expired setelah 2 jam atau restart
- Setiap kali ngrok restart, URL berubah → update webhook URL di Lark
- Untuk production, deploy ke Vercel (URL tetap)

---

## ✅ Setelah Testing Sukses:

Jika semua sudah works, lanjut deploy ke Vercel:
1. Stop ngrok
2. Install Vercel CLI: `npm install -g vercel`
3. Deploy: `vercel`
4. Set env variables di Vercel
5. Update webhook URL di Lark dengan URL Vercel
6. Done! 🎉
