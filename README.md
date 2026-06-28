# SparkMatch 💜 — Dating App

A modern, scalable dating application inspired by Tinder & Bumble with improved UX.

## 🏗️ Architecture

- **Backend**: Java 21, Spring Boot 3.2, JWT Auth, WebSocket (STOMP)
- **Database**: MySQL 8.0 with optimized schema & spatial indexes
- **Mobile**: React Native (Expo), TypeScript, Reanimated, Zustand
- **Infrastructure**: Docker Compose, Redis, LocalStack (S3)

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- JDK 21+ & Maven 3.9+ (for backend dev)
- Expo CLI (`npm install -g expo-cli`)

### 1. Start Backend Services

```bash
# Start MySQL (host port 3307), Redis, and LocalStack
docker-compose up -d mysql redis localstack

# Or start everything including the backend:
docker-compose up -d
```

### 2. Run Backend (Development)

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

The API will be available at `http://localhost:8080`
Swagger UI: `http://localhost:8080/swagger-ui`

On first run with the `dev` profile, the database is **automatically seeded**
with demo users, profiles, photos, matches, and conversations so the app is
usable immediately (see *Demo Data* below). Seeding is idempotent — it only runs
when the `users` table is empty.

### 3. Run Mobile App

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press:
- `i` for iOS Simulator
- `a` for Android Emulator

The app auto-detects your machine's LAN IP so a physical phone on the same
Wi-Fi can reach the local backend. To override (VPN/remote backend), copy
`mobile/.env.example` to `mobile/.env` and set `EXPO_PUBLIC_API_URL`.

## 🎭 Demo Data & Login

Seeded by `DataSeeder` on first dev run (toggle with `APP_SEED_ENABLED`):

| Field | Value |
|-------|-------|
| Demo email | `arjun@demo.com` |
| Password (all demo users) | `Password123` |
| Demo users | 13 (12 nearby profiles + you), all in Bangalore |
| Pre-built | 2 matches + chat threads, 5 inbound likes (premium "Likes You") |

The Login screen has a **"Use demo account"** shortcut. In **production**, disable
seeding with `APP_SEED_ENABLED=false` (it already defaults to off outside the
`dev` profile).

## 📁 Project Structure

```
DATING APP/
├── backend/         → Spring Boot API (Java 21)
├── mobile/          → React Native app (Expo + TypeScript)
├── database/        → MySQL schema & migrations
├── docker-compose.yml
└── README.md
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/oauth/google` | Google OAuth |
| POST | `/api/auth/oauth/apple` | Apple OAuth |
| POST | `/api/auth/otp/send` | Send OTP |
| POST | `/api/auth/otp/verify` | Verify OTP |

### User & Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get my profile |
| PUT | `/api/users/me` | Update profile |
| PUT | `/api/users/me/location` | Update location |
| PUT | `/api/users/me/preferences` | Update match preferences |
| POST | `/api/users/me/photos` | Upload photo |
| DELETE | `/api/users/me/photos/{id}` | Delete photo |

### Discovery & Swiping
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/discover` | Get swipeable profiles |
| POST | `/api/swipes` | Record a swipe |
| POST | `/api/swipes/undo` | Undo last swipe (premium) |
| GET | `/api/matches` | Get all matches |
| DELETE | `/api/matches/{id}` | Unmatch |
| GET | `/api/premium/likes` | See who liked you (premium) |
| POST | `/api/users/me/boost` | Boost profile for 30 min |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations` | List conversations |
| GET | `/api/conversations/{id}/messages` | Get messages |
| POST | `/api/conversations/{id}/messages` | Send message |
| WS | `/ws/chat` | WebSocket endpoint |

## 🔐 Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | (built-in) | JWT signing secret |
| `SPRING_DATASOURCE_URL` | localhost:3307 (dev) | MySQL connection |
| `SPRING_REDIS_HOST` | localhost | Redis host |
| `APP_SEED_ENABLED` | `true` (dev) / `false` (prod) | Seed demo data on first run |
| `AWS_S3_ENDPOINT` | (empty) | S3/LocalStack endpoint |
| `AWS_ACCESS_KEY_ID` | test | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | test | AWS secret key |

### Mobile

| Variable | Default | Description |
|----------|---------|-------------|
| `EXPO_PUBLIC_API_URL` | auto-detected LAN IP (dev) | Backend base URL override |

## 📱 Features

- ✅ Email, Phone, Google, Apple login
- ✅ OTP verification
- ✅ Profile creation with photos & interests
- ✅ Location-based matching (GPS/Haversine)
- ✅ Tinder-like swipe cards with animations
- ✅ Mutual like = match system
- ✅ Real-time chat (WebSocket/STOMP)
- ✅ Typing indicators & read receipts
- ✅ Daily swipe limits & rate limiting
- ✅ Premium features (undo, see who liked, super likes)
- ✅ Profile verification (blue tick)
- ✅ Report & block users
- ✅ Dark mode
- ✅ Ice breaker prompts
