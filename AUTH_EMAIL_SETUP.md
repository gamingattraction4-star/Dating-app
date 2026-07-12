# 🔐 Auth, Email & Security — Setup Guide

## Kya ready hai (code me, tested)

- ✅ **Signup**: email + password → account bante hi email par OTP jata hai → OTP verify → account active + **welcome email**
- ✅ **Login**: email + password → OTP email jata hai → OTP verify → login + **new-device login alert email**
- ✅ **Forgot password**: OTP se reset (pehle se tha)
- ✅ **Google Sign-In button**: ready, sirf client ID daalna hai (neeche)
- ✅ **Real SMTP** (Hostinger) se emails jaate hain — branded HTML
- ✅ **Security**: BCrypt passwords, JWT, OTP 2-factor, no error leakage, CORS lockable

---

## 1. Email (SMTP) — Railway/prod pe ye env vars set karo

```
MAIL_ENABLED=true
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_SSL=true
MAIL_STARTTLS=false
MAIL_USERNAME=business@wevsync.com
MAIL_PASSWORD=<your-email-password>
MAIL_FROM=business@wevsync.com
MAIL_FROM_NAME=SparkMatch
```

> ⚠️ **Security:** email ka password kabhi code me commit mat karna — sirf env var me. Aur jo password chat me share hua tha, use **badal dena** safe rahega.
> `MAIL_ENABLED` na set karo to emails sirf log me dikhte hain (OTP dev me testable rehta hai).

## 2. Security — prod env vars

```
JWT_SECRET=<lamba-random-64-char-string>       # openssl rand -base64 48
CORS_ALLOWED_ORIGINS=https://yourdomain.com    # apni website domain (ya * mobile-only ke liye)
APP_SEED_ENABLED=false                          # prod me demo data band
```

## 3. Google Sign-In (jab activate karna ho)

1. https://console.cloud.google.com → naya project
2. **APIs & Services → Credentials → Create OAuth client ID**
   - **Web application** (Expo Go / web ke liye)
   - **Android** (package: `com.sparkmatch.app`, SHA-1 EAS credentials se)
3. Client IDs ko mobile me daalo — `mobile/.env` me:
   ```
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxx.apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxxx.apps.googleusercontent.com
   ```
4. Bas — Google button apne aap activate ho jayega. Bina client ID ke button "configure to enable" message dikhata hai.

Backend Google endpoint (`/api/auth/oauth/google`) pehle se hai — abhi ID token ko trust karta hai. Production me Google ke public keys se token verify karna behtar (baad me).

---

## Flow diagram

```
SIGNUP:  email+password ─► OTP email ─► verify ─► ✅ account + welcome email
LOGIN:   email+password ─► OTP email ─► verify ─► ✅ tokens + device-login email
GOOGLE:  tap button ─► Google consent ─► ✅ tokens   (jab client ID set ho)
```

## Test (dev)
`MAIL_ENABLED=false` ho to OTP backend log me dikhta hai (`📩 OTP for ...`).
`MAIL_ENABLED=true` + creds ho to real email inbox me aata hai.
