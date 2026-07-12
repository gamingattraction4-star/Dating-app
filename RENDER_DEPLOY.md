# 🚀 Render pe Free Deploy (backend + database ek jagah, hamesha free)

App ab **PostgreSQL** use karti hai, isliye Render pe **backend + database dono ek hi jagah free** me chalenge. Koi 1-month limit nahi, koi card nahi.

> ✅ Migration tested: app Postgres pe pura chalta hai (login, discover, filters, chat sab).
> ⚠️ Free tier: 15 min idle pe backend "so jaata" hai (pehli request 30-50s slow). App khud retry karti hai, fail nahi hoti.

---

## Sabse aasan: Blueprint (1-click, recommended)

Repo me `render.yaml` daal diya hai — Render isse backend + Postgres dono khud bana deta hai.

1. https://render.com → **Sign up with GitHub** (free, no card)
2. Dashboard → **New +** → **Blueprint**
3. Apna **Dating-app** repo choose karo
4. Render `render.yaml` padhkar 2 cheezein banayega:
   - **sparkmatch-backend** (web service)
   - **sparkmatch-db** (free PostgreSQL)
5. **Apply** dabao. Ye poochega 2 secret values (email ke liye) — bharo:
   - `MAIL_USERNAME` = `business@wevsync.com`
   - `MAIL_PASSWORD` = `<aapka-email-password>`
6. Deploy hoga (5-8 min). Ho jaane par upar **URL** milega jaise
   `https://sparkmatch-backend.onrender.com`
7. Test: browser me `<URL>/api/health` → `{"status":"UP"}` 🎉

---

## Manual tareeka (agar Blueprint na chale)

### A. Database banao
1. New + → **PostgreSQL** → name `sparkmatch-db` → **Free** → Create
2. Ban jaane par **"Internal Database URL"** copy karo (postgres://... form)

### B. Backend banao
1. New + → **Web Service** → apna repo → **Docker** runtime
2. **Environment variables** (Add karo):
   ```
   SPRING_PROFILES_ACTIVE=prod
   APP_SEED_ENABLED=true
   REDIS_ENABLED=false
   JWT_SECRET=<koi-lamba-random-string>
   DATABASE_URL=<step A me copy kiya postgres:// URL>
   MAIL_ENABLED=true
   MAIL_HOST=smtp.hostinger.com
   MAIL_PORT=465
   MAIL_SSL=true
   MAIL_STARTTLS=false
   MAIL_FROM=business@wevsync.com
   MAIL_USERNAME=business@wevsync.com
   MAIL_PASSWORD=<aapka-email-password>
   ```
3. **Health Check Path**: `/api/health`
4. Create → deploy → URL milega

---

## Deploy ke baad — APK ko naye URL se jodo

Render ka URL Railway se alag hoga. APK me naya URL daalna hoga:

1. `mobile/src/config/index.ts` me `PROD_API_URL` ki value badlo:
   ```
   'https://sparkmatch-backend.onrender.com'
   ```
2. `mobile/eas.json` me bhi `EXPO_PUBLIC_API_URL` wahi karo
3. **APK dobara build karo** (main kar dunga jab aap URL do)

---

## Deploy logs me ye dikhna chahiye (sab sahi hai)
```
[DatabaseUrlEnvironmentPostProcessor] Parsed database connection -> jdbc:postgresql://...
Seeded 22 interests
✅ Seed complete: 13 users, 2 matches
Started SparkMatchApplication
```

Agar koi error aaye to **Deploy Logs ka text** bhejo, main fix kar dunga.
