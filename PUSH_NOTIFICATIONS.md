# 🔔 Push Notifications — Setup Guide

Aapke app me push notifications ka **poora code ready hai** (backend + mobile). Bas
Android ke liye ek chhota Firebase step karna hai jab aap final APK banate ho.

## Kya already ho chuka hai (code me)

- ✅ Mobile app login pe **Expo push token** register karta hai (`pushService.ts`)
- ✅ Backend token save karta hai (`POST /api/notifications/push-token`)
- ✅ Match / new message / new like par backend **Expo Push API** ko call karta hai
  (`ExpoPushService.java`) → device ko real push milta hai
- ✅ App ke andar banner bhi dikhta hai (jab app khuli ho)

## ⚠️ Zaroori baat
Push **sirf real phone pe built APK me** kaam karta hai — browser aur simulator me nahi.
Isliye ise aap final APK me hi test kar paoge.

---

## Android ke liye Firebase setup (~10 min, ek baar)

Expo push Android pe FCM (Firebase) ke through jaata hai, isliye ek Firebase project chahiye.

### Step 1 — Firebase project banao
1. https://console.firebase.google.com → **Add project** → naam do (e.g. SparkMatch) → create
2. Left menu → **Project settings** (gear icon) → **Cloud Messaging** tab

### Step 2 — Android app add karo
1. Project overview me **Android icon** dabao
2. **Android package name** daalo: `com.sparkmatch.app`  *(app.json me yahi hai)*
3. Register app → **`google-services.json`** download karo

### Step 3 — google-services.json app me daalo
1. Downloaded `google-services.json` ko yahan rakho:
   ```
   mobile/google-services.json
   ```
2. `mobile/app.json` me android section me ye line add karo:
   ```json
   "android": {
     "package": "com.sparkmatch.app",
     "googleServicesFile": "./google-services.json",
     ...
   }
   ```

### Step 4 — Expo ko FCM key do (EAS Build use karo toh)
Agar aap **EAS Build** (`eas build`) use karte ho:
```bash
eas credentials
```
→ Android → **Push Notifications: Upload an FCM key** → Firebase → Cloud Messaging → **Server key** copy karke daalo.

Agar aap **local gradle build** karte ho (jaise ab tak kiya), `google-services.json` hi kaafi hai.

### Step 5 — EAS project ID (push token ke liye)
`app.json` me `extra.eas.projectId` hona chahiye (EAS Build khud add karta hai):
```json
"extra": { "eas": { "projectId": "your-project-id" } }
```
`eas build:configure` chalane par ye automatically add ho jata hai.

---

## iOS ke liye
iOS push ke liye Apple Developer account ($99/year) + APNs key chahiye. Android se shuru
karo; iOS baad me.

---

## Test kaise karein (APK ban jaane ke baad)
1. Do phone (ya do accounts) pe app install karo, dono me login karo (push token register hoga)
2. Phone A se phone B ko like/message karo
3. Phone B pe (app band ho tab bhi) **push notification** aani chahiye 🔔

Agar na aaye:
- Dono ne login kiya? (token tabhi register hota hai)
- `google-services.json` sahi package (`com.sparkmatch.app`) ka hai?
- Backend log me `Expo push sent` ya `Expo push failed` dekho.
