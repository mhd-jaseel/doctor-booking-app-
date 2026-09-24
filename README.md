# DoctorCare — Doctor Booking Application

A full-stack, production-style healthcare discovery and token-based appointment scheduling platform built with **React Native (Expo)** for mobile and **Node.js / Express / MongoDB** for the backend API.

---

## Overview

DoctorCare allows patients to discover hospitals, clinics, and doctors, then book numbered queue tokens for OPD consultations. The platform supports multi-location doctor practices with per-schedule consultation fees, automated waiting lists, real-time appointment tracking, and persistent image storage via MongoDB GridFS — no third-party file-hosting dependency.

---

## Features

### Patient / User
- **Registration & Login** — JWT-based secure authentication with session persistence
- **Healthcare Services Discovery** — Browse Hospitals, Clinics, and additional admin-managed categories
- **Facility Browsing** — Paginated facility listing with search and category filtering
- **Facility Detail** — Full facility profile with available doctors and schedules
- **Doctor Browsing** — Search and filter doctors by name, specialization, and facility
- **Doctor Detail** — Doctor profile with qualifications, ratings, and available schedules
- **Token Booking** — Book numbered OPD queue tokens with real-time availability
- **Patient Details** — Separate patient profile per booking
- **Appointment Confirmation** — Instant token number confirmation
- **My Tokens (History)** — View upcoming, completed, and cancelled appointments
- **Waiting List** — Auto-join waiting list when tokens are full; auto-promoted on cancellation
- **Appointment Cancellation** — Cancel upcoming appointments with waiting list cascade
- **Notifications** — In-app notifications for confirmations, cancellations, and waiting list promotions
- **Doctor Ratings** — Submit star ratings with comments after completed appointments
- **Offline Image Fallbacks** — Gender-aware and facility-type fallback avatars when images unavailable

### Admin
- **Admin Authentication** — Secure admin login; auto-bootstrapped admin account on first run
- **Dashboard** — Summary stats: total doctors, facilities, appointments, pending bookings
- **Healthcare Services Management** — Create, edit, delete, and activate/deactivate custom categories
- **Facility Management** — Add, update, delete hospitals/clinics with image upload and status toggle
- **Doctor Management** — Create and manage doctors with profile images, qualifications, facility assignments
- **Schedule Management** — Create date-specific OPD schedules with session time windows, token capacity, and consultation fees per location; calendar date-picker (up to 2 months ahead)
- **Appointment Management** — View all appointments; cancel with notification cascade
- **User Management** — View user list, activate/deactivate user accounts
- **Ratings View** — Monitor all patient ratings

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Mobile Frontend | React Native 0.74, Expo SDK 51 |
| Navigation | React Navigation 6 (Bottom Tabs + Native Stack) |
| State Management | React Context API + custom hooks |
| HTTP Client | Axios |
| Token Storage | AsyncStorage |
| Backend | Node.js ≥ 18, Express.js 4 |
| Database | MongoDB (local) with Mongoose 8 |
| File Storage | MongoDB GridFS (via multer-gridfs-storage) |
| Authentication | JSON Web Token (jsonwebtoken) |
| Password Hashing | bcryptjs |
| Security | helmet, express-rate-limit, CORS |
| Validation | express-validator |
| Dev Tooling | nodemon, dotenv |

---

## Project Structure

```
doctor-booking-app/
├── backend/                    # Node.js / Express API server
│   ├── src/
│   │   ├── config/             # Database connection & environment config
│   │   ├── constants/          # Shared enums and app-level constants
│   │   ├── controllers/        # Route handler functions
│   │   ├── middleware/         # Auth, role guard, validation, error handler
│   │   ├── models/             # Mongoose data models
│   │   ├── routes/             # Express route definitions
│   │   ├── services/           # Business logic layer
│   │   ├── utils/              # Helpers: seed, date, pagination, JWT, etc.
│   │   ├── validations/        # Request validation schemas
│   │   ├── app.js              # Express app setup & middleware registration
│   │   └── server.js           # HTTP server entry point
│   ├── .env.example            # Environment variable template
│   ├── package.json
│   └── package-lock.json
│
├── mobile/                     # React Native / Expo mobile application
│   ├── src/
│   │   ├── assets/             # Branding images (app icon, splash)
│   │   ├── components/         # Reusable UI components (user + admin)
│   │   ├── constants/          # Theme, config, healthcare service defaults
│   │   ├── context/            # React context (Auth)
│   │   ├── hooks/              # Custom hooks (data fetching, form, submit)
│   │   ├── navigation/         # Stack and tab navigator definitions
│   │   ├── screens/            # Screen components (user + admin)
│   │   ├── services/           # API service functions
│   │   ├── utils/              # Cache, debounce utilities
│   │   └── validations/        # Frontend input validation helpers
│   ├── App.js                  # Expo app root
│   ├── app.json                # Expo config (name, icons, bundle ID)
│   ├── babel.config.js
│   ├── .env.example            # Optional API URL override
│   ├── package.json
│   └── package-lock.json
│
├── docs/                       # Technical documentation
│   ├── API_GUIDE.md
│   ├── ARCHITECTURE.md
│   ├── DEPENDENCIES.md
│   └── IMPLEMENTATION_LOG.md
│
├── .gitignore
└── README.md
```

---

## Requirements

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9 (comes with Node.js 18+)
- **MongoDB Community** (local) — running on `mongodb://127.0.0.1:27017`
- **Expo CLI** — installed via `npm install -g expo-cli` or used via `npx expo`
- **Android Emulator** or physical Android device (for mobile app)

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/mhd-jaseel/doctor-booking-app.git
cd doctor-booking-app
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

**Create your environment file:**

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/doctor_booking_db
JWT_SECRET=your_strong_jwt_secret_key_here
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-strong-password
```

**Seed the database** (required on first run — creates admin account and sample data):

```bash
npm run seed
```

> ⚠️ `npm run seed` deletes all existing data and re-seeds from scratch. Only run once on initial setup.

**Start the backend:**

```bash
npm run dev        # Development mode with auto-reload (nodemon)
# or
npm start          # Production mode
```

The API will be available at: `http://localhost:5000/api`

**Run the test suite** (optional):

```bash
npm test
```

---

### 3. Mobile Setup

```bash
cd mobile
npm install
```

**API URL Configuration:**

The mobile app automatically connects to:
- **Android Emulator**: `http://10.0.2.2:5000/api`
- **Web / iOS Simulator**: `http://localhost:5000/api`

For a **physical Android device** on the same Wi-Fi network, create a `.env` file:

```bash
cp .env.example .env
```

Uncomment and set your machine's local IP in `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.X:5000/api
```

**Start the Expo dev server:**

```bash
npx expo start            # Opens Expo developer menu
npx expo start --android  # Launch directly on Android emulator
npx expo start --web      # Launch in browser (web preview)
```

---

## Database Setup

DoctorCare uses **MongoDB** running locally. No cloud database configuration is required.

1. Install [MongoDB Community Edition](https://www.mongodb.com/try/download/community) for your OS.
2. Start the MongoDB service (it runs on `mongodb://127.0.0.1:27017` by default).
3. The database `doctor_booking_db` is created automatically on first connection.
4. Run `npm run seed` from the `backend/` directory to populate initial data.

### Seed Data Includes
- 1 admin user account
- Sample hospitals and clinics
- Sample doctors with facility assignments
- Sample OPD schedules

> **Note:** Images uploaded via the Admin panel are stored in MongoDB GridFS inside `fs.files` and `fs.chunks` collections — no external file service required.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `5000` |
| `NODE_ENV` | Environment (`development`/`production`) | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/doctor_booking_db` |
| `JWT_SECRET` | Secret key for JWT signing | *(required)* |
| `JWT_EXPIRES_IN` | JWT token expiry | `7d` |
| `RATE_LIMIT_WINDOW_MS` | Rate limiter time window (ms) | `900000` (15 min) |
| `RATE_LIMIT_MAX` | Max requests per window | `200` |
| `ADMIN_EMAIL` | Bootstrap admin email | `admin@example.com` |
| `ADMIN_PASSWORD` | Bootstrap admin password | *(set a strong value)* |

### Mobile (`mobile/.env`) — Optional

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Override API base URL (for physical devices on LAN) |

---

## Test Credentials

After running `npm run seed`, the following admin credentials are active:

> These are seeded from your `.env` file values (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).

Default seed values (change before production use):
- **Admin Email**: `admin@doctorbooking.com`
- **Admin Password**: `Admin@12345`

User accounts can be registered directly in the app.

---

## API Documentation

See [`docs/API_GUIDE.md`](docs/API_GUIDE.md) for the full API reference.

**Base URL (local):** `http://localhost:5000/api`

Key endpoint groups:
- `/api/auth` — Login, register, profile
- `/api/hospitals` — Facility listing and detail
- `/api/doctors` — Doctor listing, detail, schedules
- `/api/schedules` — Available schedule slots
- `/api/appointments` — Book, view, cancel appointments
- `/api/waiting-list` — Waiting list management
- `/api/notifications` — User notifications
- `/api/ratings` — Doctor ratings
- `/api/healthcare-services` — Service category listing
- `/api/files/:fileId` — Image retrieval (GridFS streaming)
- `/api/admin/*` — All admin management endpoints (require admin JWT)

---

## Architecture & Documentation

| Document | Description |
|----------|-------------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design, data flow, component structure |
| [`docs/API_GUIDE.md`](docs/API_GUIDE.md) | Full API endpoint reference |
| [`docs/DEPENDENCIES.md`](docs/DEPENDENCIES.md) | Package dependency rationale |
| [`docs/IMPLEMENTATION_LOG.md`](docs/IMPLEMENTATION_LOG.md) | Implementation decisions and notes |

---

## Security Notes

- **Never commit `.env` files** — use `.env.example` as a template only
- **JWT_SECRET** must be a long, random string in production — never use defaults
- **ADMIN_PASSWORD** must be changed before any public/production deployment
- MongoDB is configured for local access only — configure auth and network access for production
- All API endpoints use JWT authentication; Admin routes are additionally guarded by role middleware
- Rate limiting is enabled on all `/api` routes

---

## License

This project is submitted as a technical assessment. All rights reserved.
