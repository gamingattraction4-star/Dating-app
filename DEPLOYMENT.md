# 🚀 SparkMatch — Internet pe Live kaise karein (A to Z)

Yeh guide aapko **free me** poori app live karne ka step-by-step process deta hai.

## Aapko kya-kya karna hai (3 hisse)

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  1. BACKEND     │     │  2. ANDROID APK      │     │  3. DOWNLOAD PAGE   │
│  (Railway free) │ <-- │  (EAS Build free)    │ --> │  (Hostinger)        │
│  Java + MySQL   │     │  app banegi .apk     │     │  log download karenge│
│  = data yahan   │     │                      │     │                     │
└─────────────────┘     └──────────────────────┘     └─────────────────────┘
```

**Zaroori samajh lo:** Aapka Hostinger (HTML/CSS/JS) plan sirf **#3 (download page)** chala sakta hai.
Java backend (#1) Hostinger pe nahi chalega — uske liye Railway use karenge (free).

---

## 📍 DATA KAHAN STORE HOGA?

| Data | Jagah |
|------|-------|
| Users, profiles, swipes, matches, messages | **Railway ka MySQL database** (aapke control me) |
| Passwords | MySQL me, **BCrypt se encrypted** (kabhi plain nahi) |
| Photos jo user upload karega | Backend server ki disk (`uploads/` folder) |
| Login token | **User ke phone me** (server pe nahi) |

Sab kuch aapke Railway account ke andar. Aap kabhi bhi dekh/export kar sakte ho.

---

# HISSA 1 — Backend live karna (Railway, free)

> Railway free trial me ~$5 credit/month milta hai — ek choti app + MySQL ke liye kaafi.
> (Alternative: Render.com bhi free hai, par MySQL alag se chahiye.)

### Step 1.1 — Code ko GitHub pe daalo
```bash
cd "/Users/aakarshitraj/DATING APP"
git init
git add .
git commit -m "SparkMatch full app"
# GitHub pe ek new repo banao (github.com/new), phir:
git remote add origin https://github.com/<tumhara-username>/sparkmatch.git
git branch -M main
git push -u origin main
```

### Step 1.2 — Railway pe project banao
1. https://railway.app pe jao → GitHub se sign up (free).
2. **New Project** → **Deploy from GitHub repo** → apna `sparkmatch` repo choose karo.
3. Railway poochhega root directory — set karo: **`backend`** (kyunki Dockerfile wahan hai).

### Step 1.3 — MySQL database add karo
1. Usi project me **New** → **Database** → **Add MySQL**.
2. Railway automatically MySQL bana dega aur connection details dega.

### Step 1.4 — Backend ko env variables do
Backend service → **Variables** tab → ye add karo
(MySQL ke values Railway ke MySQL service ke "Connect" tab se milenge):

```
SPRING_PROFILES_ACTIVE = prod
SPRING_DATASOURCE_URL = jdbc:mysql://<MYSQLHOST>:<PORT>/railway?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME = <MYSQL_USER>
SPRING_DATASOURCE_PASSWORD = <MYSQL_PASSWORD>
JWT_SECRET = <koi-lamba-random-64-char-string-yahan-daalo>
APP_SEED_ENABLED = true
CDN_BASE_URL = https://<tumhara-railway-app>.up.railway.app
```

> 💡 `APP_SEED_ENABLED=true` pehli baar demo data daal dega (taaki app khaali na lage).
> Baad me ise `false` kar dena.
> 💡 `JWT_SECRET` ke liye terminal me: `openssl rand -base64 48`

### Step 1.5 — Deploy + URL lo
- Railway khud build karega (Dockerfile se). 2-4 min lagenge.
- **Settings → Networking → Generate Domain** → ek public URL milega jaise
  `https://sparkmatch-production.up.railway.app`
- Test karo: browser me `<URL>/actuator/health` → `{"status":"UP"}` aana chahiye. ✅

**Yeh URL note kar lo — agle hisse me chahiye.**

---

# HISSA 2 — Android APK banana (EAS Build, free)

### Step 2.1 — Backend URL app me daalo
`mobile/eas.json` kholo, dono jagah `REPLACE-WITH-YOUR-BACKEND-URL` ko apne
Railway URL se badlo:
```json
"EXPO_PUBLIC_API_URL": "https://sparkmatch-production.up.railway.app"
```

### Step 2.2 — EAS setup (ek baar)
```bash
cd "/Users/aakarshitraj/DATING APP/mobile"
npm install -g eas-cli
eas login        # Expo account banao (free) — expo.dev pe
eas build:configure
```

### Step 2.3 — APK build karo (cloud me banta hai, free)
```bash
eas build -p android --profile preview
```
- 10-20 min lagega (Expo ke server pe banta hai, tumhare laptop pe nahi).
- Ho jaane par ek **download link** dega `.apk` ka. Download kar lo.
- File ka naam `sparkmatch.apk` rakh lo.

> 📱 iPhone: iOS app ke liye Apple Developer account ($99/year) chahiye —
> abhi skip kar sakte ho, Android se shuru karo.

---

# HISSA 3 — Download page Hostinger pe daalna

### Step 3.1 — Files taiyaar hain
`website/` folder me pehle se ready hai:
- `index.html` (download page)
- `style.css`
- `icon.png`

### Step 3.2 — APK isi folder me daalo
Step 2 wali `sparkmatch.apk` file ko `website/` folder me copy karo:
```bash
cp ~/Downloads/sparkmatch.apk "/Users/aakarshitraj/DATING APP/website/sparkmatch.apk"
```
(Page ka download button `sparkmatch.apk` dhoondta hai — naam yahi rakhna.)

### Step 3.3 — Hostinger pe upload
1. Hostinger panel → **hPanel** → **File Manager** → `public_html` folder kholo.
2. `website/` ke andar ki **saari files** (`index.html`, `style.css`, `icon.png`, `sparkmatch.apk`)
   ko `public_html` me upload karo.
3. Bas! Apni domain kholo (jaise `https://tumhardomain.com`) → download page dikhega.

> ⚠️ APK download ke liye Hostinger me kuch nahi badalna — `.apk` ek normal file ki tarah
> download ho jaati hai. Agar browser block kare to user ko "anyway download" dabana hoga (normal hai).

---

## ✅ Final flow (user kya karega)

1. User aapki website kholega → **"Download for Android"** dabayega.
2. `sparkmatch.apk` phone me download hoga → install karega.
3. App khulegi → **Railway backend** se connect hogi → register/login karega.
4. Uska data **Railway MySQL** me save hoga.

---

## ⚠️ Free tier ki 2 limitations (jaan lo)

1. **Railway free idle pe so jaata hai** — pehli request slow (15-30 sec) ho sakti hai.
   Always-on chahiye to Railway ka $5 Hobby plan ya Hostinger VPS lo.
2. **Uploaded photos** Railway disk pe save hote hain. Free deploy me redeploy pe
   purani photos mit sakti hain. Permanent ke liye baad me **AWS S3 / Cloudinary**
   (dono free tier dete hain) jodna behtar — code already S3-ready hai.

---

## 🔧 Production checklist (live karne se pehle)
- [ ] `JWT_SECRET` strong + secret (kabhi GitHub pe mat daalo)
- [ ] `APP_SEED_ENABLED=false` (jab real users aa jayein)
- [ ] CORS: `SecurityConfig` me `*` ki jagah apni website domain daalo (zyada secure)
- [ ] `eas.json` me sahi backend URL
- [ ] App test: register → swipe → match → chat (real device pe)
