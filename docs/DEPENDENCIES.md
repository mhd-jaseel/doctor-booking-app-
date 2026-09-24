# Dependencies Documentation

This document maintains a complete, detailed record of all external libraries used in the **Doctor Booking Application** (both Backend and Mobile). It serves as an educational guide for developers learning modern Node.js and React Native architectures.

---

## Backend Dependencies Summary Table

| Step | Package | Project | Installation Command | Why Used | Where Used | Type |
|------|---------|---------|----------------------|----------|------------|------|
| 1 | `express` | Backend | `npm install express` | Fast, unopinionated web framework for routing and middleware. | `src/app.js`, `src/routes/*` | Production |
| 2 | `mongoose` | Backend | `npm install mongoose` | Elegant MongoDB ODM for schema definition, indexing, and transactions. | `src/config/db.js`, `src/models/*`, `src/services/*` | Production |
| 3 | `dotenv` | Backend | `npm install dotenv` | Loads environment variables from `.env` into `process.env`. | `src/config/env.js`, `src/server.js` | Production |
| 4 | `cors` | Backend | `npm install cors` | Configures Cross-Origin Resource Sharing for secure mobile/web communication. | `src/app.js` | Production |
| 5 | `helmet` | Backend | `npm install helmet` | Sets security-focused HTTP response headers to protect against vulnerabilities. | `src/app.js` | Production |
| 6 | `bcryptjs` | Backend | `npm install bcryptjs` | Secure salt-based hashing algorithm for user passwords. | `src/models/user.model.js`, `src/services/auth.service.js` | Production |
| 7 | `jsonwebtoken` | Backend | `npm install jsonwebtoken` | Generates and verifies cryptographic stateless JWT access tokens. | `src/utils/jwt.js`, `src/middleware/auth.middleware.js` | Production |
| 8 | `express-rate-limit` | Backend | `npm install express-rate-limit` | Protects endpoints against brute force attacks and request flooding. | `src/app.js`, `src/routes/auth.routes.js` | Production |
| 9 | `multer` | Backend | `npm install multer` | In-memory multipart/form-data handler for streaming images into MongoDB GridFS. | `src/middleware/upload.middleware.js` | Production |
| 10 | `nodemon` | Backend | `npm install -D nodemon` | Development tool that automatically restarts the Node server upon code changes. | `package.json` (scripts) | Development |

---

## Detailed Backend Dependency Breakdown

### 1. `express`
- **Installation**: `npm install express`
- **Project**: Backend
- **Why Needed**: Express provides the fundamental HTTP server, middleware chaining pipeline, routing engine, and JSON body parsing capabilities.
- **Problem Solved**: Eliminates the complex boilerplate of raw Node.js `http.createServer()` and simplifies REST API development.
- **Where Used**: `backend/src/app.js`, `backend/src/routes/*.js`

### 2. `mongoose`
- **Installation**: `npm install mongoose`
- **Project**: Backend
- **Why Needed**: Provides schema validation, typed models, population/relations, hooks, compound indexes, and ACID multi-document transactions.
- **Problem Solved**: Prevents invalid data insertion and allows atomic database operations critical for race-condition-safe token booking.
- **Where Used**: `backend/src/config/db.js`, `backend/src/models/*.js`, `backend/src/services/*.js`

### 3. `dotenv`
- **Installation**: `npm install dotenv`
- **Project**: Backend
- **Why Needed**: Securely manages secrets (database connection strings, JWT secret keys, port configurations) outside source control.
- **Problem Solved**: Prevents accidental leakage of credentials to git repositories.
- **Where Used**: `backend/src/config/env.js`, `backend/src/server.js`

### 4. `cors`
- **Installation**: `npm install cors`
- **Project**: Backend
- **Why Needed**: Grants controlled permissions for mobile clients and development web browsers to consume backend endpoints across origins.
- **Problem Solved**: Prevents browser and native fetch cross-origin blocking errors.
- **Where Used**: `backend/src/app.js`

### 5. `helmet`
- **Installation**: `npm install helmet`
- **Project**: Backend
- **Why Needed**: Adds critical security headers such as `X-Content-Type-Options`, `Strict-Transport-Security`, `X-Frame-Options`, and `X-XSS-Protection`.
- **Problem Solved**: Mitigates common web vulnerabilities like clickjacking and MIME-type sniffing.
- **Where Used**: `backend/src/app.js`

### 6. `bcryptjs`
- **Installation**: `npm install bcryptjs`
- **Project**: Backend
- **Why Needed**: One-way cryptographic hashing function with configurable salt work factor to safely store passwords.
- **Problem Solved**: Protects user passwords from plain-text exposure if the database is ever compromised.
- **Where Used**: `backend/src/models/user.model.js`, `backend/src/services/auth.service.js`

### 7. `jsonwebtoken`
- **Installation**: `npm install jsonwebtoken`
- **Project**: Backend
- **Why Needed**: Encodes user ID and role into signed JSON Web Tokens (JWT) for stateless API authorization.
- **Problem Solved**: Enables secure, scalable session verification without requiring session stores or server memory lookups.
- **Where Used**: `backend/src/utils/jwt.js`, `backend/src/middleware/auth.middleware.js`

### 8. `express-rate-limit`
- **Installation**: `npm install express-rate-limit`
- **Project**: Backend
- **Why Needed**: Limits repeated requests to public APIs such as login and registration.
- **Problem Solved**: Defends against credential stuffing, brute-force password guessing, and denial-of-service attempts.
- **Where Used**: `backend/src/app.js`, `backend/src/routes/auth.routes.js`

---

## Mobile Dependencies Summary Table

| Step | Package | Project | Installation Command | Why Used | Where Used | Type |
|------|---------|---------|----------------------|----------|------------|------|
| 10 | `expo` / `react-native` | Mobile | `npx create-expo-app` | Core mobile application framework and native runtime environment. | `App.js`, `src/*` | Production |
| 11 | `@react-navigation/native` | Mobile | `npm install @react-navigation/native` | Core navigation container and state management for screen transitions. | `src/navigation/*` | Production |
| 12 | `@react-navigation/native-stack` | Mobile | `npm install @react-navigation/native-stack` | Native-feel stack navigation for screen transitions (Auth, Details, Booking). | `src/navigation/*` | Production |
| 13 | `@react-navigation/bottom-tabs` | Mobile | `npm install @react-navigation/bottom-tabs` | Bottom navigation bar for core tabs (Home, Live, History, Profile). | `src/navigation/UserTabs.js` | Production |
| 14 | `react-native-screens` | Mobile | `npx expo install react-native-screens` | Native primitives for memory-efficient screen rendering. | Dependency for React Navigation | Production |
| 15 | `react-native-safe-area-context` | Mobile | `npx expo install react-native-safe-area-context` | Handles device notches, status bars, and home indicators across iOS & Android. | `App.js`, `src/screens/*` | Production |
| 16 | `@react-native-async-storage/async-storage` | Mobile | `npx expo install @react-native-async-storage/async-storage` | Persistent, asynchronous key-value storage system for storing JWTs. | `src/context/AuthContext.js`, `src/services/api.js` | Production |
| 17 | `axios` | Mobile | `npm install axios` | Promise-based HTTP client with request/response interceptor support. | `src/services/api.js`, `src/services/*.service.js` | Production |
| 18 | `@expo/vector-icons` | Mobile | `npx expo install @expo/vector-icons` | Medical, navigation, and UI iconography (Feather, Ionicons, MaterialIcons). | `src/components/*`, `src/screens/*` | Production |
| 19 | `@expo/metro-runtime` | Mobile | `npx expo install @expo/metro-runtime` | Web runtime support and fast refresh for Expo Metro bundler. | Web bundler integration | Production |
| 20 | `expo-image-picker` | Mobile | `npx expo install expo-image-picker` | Native cross-platform gallery and image selector for Admin Doctor & Facility uploads. | `src/components/admin/common/ImageUploadField.js` | Production |

---

## Detailed Mobile Dependency Breakdown

### 10. `expo` & `react-native`
- **Why Needed**: Provides the cross-platform native runtime, component primitives (`View`, `Text`, `TouchableOpacity`, `FlatList`, `ScrollView`), and asset loading.
- **Where Used**: Whole mobile project.

### 11-13. `@react-navigation/*`
- **Why Needed**: Structured navigation system providing Stack navigation for drill-downs (Facility -> Doctor -> Booking -> Success) and Bottom Tabs for primary application modes.
- **Where Used**: `mobile/src/navigation/`

### 16. `@react-native-async-storage/async-storage`
- **Why Needed**: Persists the JWT access token and logged-in user metadata across app restarts.
- **Where Used**: `mobile/src/context/AuthContext.js`, `mobile/src/services/api.js`

### 17. `axios`
- **Why Needed**: Manages HTTP requests with centralized base URL configuration, request authorization headers injection, and global 401 unauthenticated response handling.
- **Where Used**: `mobile/src/services/`

### 18. `@expo/vector-icons`
- **Why Needed**: High-fidelity iconography for medical specialties, star ratings, calendar pickers, notification badges, and bottom navigation.
- **Where Used**: `mobile/src/components/`, `mobile/src/screens/`

---

## 🔐 Admin Authentication & Security Architecture

### 1. Backend-Only Environment Secrets (`ADMIN_EMAIL`, `ADMIN_PASSWORD`)
- **Principle**: Administrative seed credentials (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) reside exclusively within `backend/.env` and are loaded via `dotenv`.
- **Zero Secrets in Frontend**: Neither `ADMIN_EMAIL` nor `ADMIN_PASSWORD` is ever placed in `mobile/.env`, client constants, or bundled React Native source code. Bundled mobile applications can be decompiled; putting secrets in client bundles exposes critical administrative credentials.

### 2. Startup Bootstrapping & Password Hashing via `bcryptjs`
- **Mechanism**: On backend server launch (`server.js`), the server runs `bootstrapAdmin()`:
  1. Inspects the database to check if an account with `ADMIN_EMAIL` already exists.
  2. If the admin user exists, it **preserves** the existing record without overwriting or recalculating password hashes.
  3. If missing, it creates the administrator document in the MongoDB `User` collection with `role: "admin"` and `isActive: true`.
  4. The Mongoose `pre('save')` hook intercepts the password and generates a cryptographic one-way salted hash using `bcrypt.hash(password, salt)` with 10 salt rounds.
- **Zero Plaintext Storage**: Plaintext passwords are never stored in the database.
- **Verification via `bcrypt.compare`**: During authentication (`POST /api/auth/login`), the backend retrieves the hashed password with `.select('+password')` and securely compares the candidate password using `bcrypt.compare()`. Login passwords are never compared against `process.env.ADMIN_PASSWORD` at runtime.

### 3. Stateless JWT Authorization & Role Guards
- Upon successful validation, the server signs a JWT containing `id` and `role: "admin"`.
- All administrative routes (`/api/admin/*`) are strictly enforced by two middleware layers:
  1. `protect`: Verifies JWT signature and extracts user.
  2. `restrictTo(ROLES.ADMIN)`: Verifies that the user role equals `"admin"`. Normal users receive `403 Forbidden: Admin access required.`
- Passwords and password hashes are filtered out (`select: false` and `select('-password')`) and never exposed in API responses.
